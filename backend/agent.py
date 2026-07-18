import os
from typing import TypedDict, List
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from tavily import TavilyClient
from langgraph.graph import StateGraph, START, END
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ==========================================
# 1. INITIALIZATION & SETUP
# ==========================================
load_dotenv()

# Initialize FastAPI App
app = FastAPI(title="AI Research Agent API")

# Enable CORS for React frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from local React development setups (Vite, CRA, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. STATE SCHEMA
# ==========================================
class ResearchState(TypedDict):
    question: str
    sub_questions: List[str]
    current_index: int
    search_results: List[dict]
    search_rounds: int
    final_answer: str

class ResearchRequest(BaseModel):
    question: str

# ==========================================
# 3. TOOLS & HELPERS
# ==========================================
def search_tavily(query: str) -> list[dict]:
    """Queries the web using Tavily and isolates structural fields for context mapping."""
    tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = tavily_client.search(query=query, max_results=2)
    cleaned_results = []
    for result in response.get('results', []):
        cleaned_results.append({
            "title": result.get("title", "No Title"),
            "url": result.get("url", ""),
            "content": result.get("content", "")
        })
    return cleaned_results

# ==========================================
# 4. GRAPH NODES (AGENTS & PROCESSING LOGIC)
# ==========================================
def planner_node(state: ResearchState) -> dict:
    print("\n--- [Planner Node] Breaking down the question ---")
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are a world-class research planner. Your job is to take a complex user question and break it down into 2 to 3 distinct, search-optimized query statements.
Follow these strict formatting rules:
1. Output each query on a new line starting with a hyphen and a space: - query goes here
2. Do NOT write any introduction text, greeting, or summary.
3. Do NOT write any conclusion or explanation text.
4. Keep each query concise, focusing only on keywords."""),
        ("human", "Should I buy mechanical or membrane keyboards?"),
        ("ai", "- mechanical vs membrane keyboard performance typing feel\n- mechanical keyboard durability lifespan cost comparison"),
        ("human", "{question}")
    ])
    
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    chain = prompt_template | llm
    response = chain.invoke({"question": state["question"]})
    
    parsed_queries = [
        line.lstrip("- ").strip()
        for line in response.content.splitlines()
        if line.strip()
    ]
    print(f"Generated Sub-Questions: {parsed_queries}")
    return {"sub_questions": parsed_queries, "current_index": 0}

def search_node(state: ResearchState) -> dict:
    queries = state["sub_questions"]
    index = state["current_index"]
    
    current_query = queries[index]
    print(f"\n--- [Search Node] Searching for sub-question {index + 1}/{len(queries)} ---")
    print(f"🔍 Query: {current_query}")
    
    new_results = search_tavily(current_query)
    existing_results = state.get("search_results", [])
    if existing_results is None:
        existing_results = []
        
    updated_results = existing_results + new_results
    print(f"Collected {len(new_results)} results from Tavily.")
    
    return {
        "search_results": updated_results,
        "current_index": index + 1
    }

def synthesizer_node(state: ResearchState) -> dict:
    print("\n--- [Synthesizer Node] Generating final cited report ---")
    user_question = state["question"]
    results = state.get("search_results", [])
    
    sources_text = ""
    for i, res in enumerate(results, start=1):
        sources_text += f"Source [{i}]:\nTitle: {res['title']}\nContent: {res['content']}\n\n"
        
    system_prompt = """You are an expert research analyst. Your job is to write a comprehensive, balanced, and deep final report answering the user's question based strictly on the provided numbered sources.

Follow these strict rules:
1. Every major fact or claim you make MUST be cited using the source number in brackets, like [1] or [2].
2. Do not invent any facts that are not present in the provided sources.
3. Keep your tone objective, professional, and clear.
4. Organize your response with clean markdown headings and bullet points where appropriate."""

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "User Question: {question}\n\nProvided Sources:\n{sources}")
    ])
    
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)
    chain = prompt_template | llm
    response = chain.invoke({"question": user_question, "sources": sources_text})
    
    # Compile clean reference library layout
    references = "\n\n### 📚 Sources & References\n"
    seen_urls = set()
    for i, res in enumerate(results, start=1):
        if res['url'] not in seen_urls:
            references += f"- [{i}] [{res['title']}]({res['url']})\n"
            seen_urls.add(res['url'])
            
    full_final_answer = response.content + references
    return {"final_answer": full_final_answer}

# ==========================================
# 5. SUPERVISOR ROUTING LOGIC
# ==========================================
def route_after_search(state: ResearchState) -> str:
    queries = state["sub_questions"]
    index = state["current_index"]
    
    if index < len(queries):
        print(f"🔄 Supervisor: {len(queries) - index} sub-question(s) remaining. Looping back to search.")
        return "search"
    else:
        print("✅ Supervisor: All sub-questions searched. Proceeding to final answer synthesis.")
        return "synthesizer"

# ==========================================
# 6. GRAPH ASSEMBLY
# ==========================================
def compile_research_graph():
    builder = StateGraph(ResearchState)

    builder.add_node("planner", planner_node)
    builder.add_node("search", search_node)
    builder.add_node("synthesizer", synthesizer_node)

    builder.add_edge(START, "planner")
    builder.add_edge("planner", "search")

    builder.add_conditional_edges(
        "search",
        route_after_search,
        {
            "search": "search",
            "synthesizer": "synthesizer"
        }
    )
    builder.add_edge("synthesizer", END)
    return builder.compile()

# Compile the execution pipeline
research_graph = compile_research_graph()

# ==========================================
# 7. INTERFACE WRAPPER FOR NETWORKS
# ==========================================
def run_research(question: str) -> dict:
    """Wraps graph execution and formats data payload packages for React consumption."""
    initial_state = {
        "question": question,
        "sub_questions": [],
        "current_index": 0,
        "search_results": [],
        "search_rounds": 0,
        "final_answer": ""
    }
    
    final_state = research_graph.invoke(initial_state)
    
    metadata_sources = []
    seen_urls = set()
    for res in final_state.get("search_results", []):
        if res['url'] not in seen_urls:
            metadata_sources.append({
                "title": res.get("title", "No Title"),
                "url": res.get("url", "")
            })
            seen_urls.add(res['url'])
            
    return {
        "research_data": final_state.get("final_answer", ""),
        "metadata": metadata_sources
    }

# ==========================================
# 8. WEB SERVICE API ROUTING
# ==========================================
@app.post("/api/research")
async def handle_research(payload: ResearchRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    try:
        print(f"\n⚡ Incoming React request: '{payload.question}'")
        result = run_research(payload.question)
        return result
    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FastAPI Server for React integration...")
    uvicorn.run("agent:app", host="127.0.0.1", port=8000, reload=True)