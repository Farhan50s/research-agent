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

app = FastAPI(title="AI Research Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "service": "Zynt AI Research Agent API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# ==========================================
# 2. STATE SCHEMA & REQUEST MODELS
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
    mode: str = "simple"

# ==========================================
# 3. TOOLS & GRAPH NODES
# ==========================================
def search_tavily(query: str) -> list[dict]:
    tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = tavily_client.search(query=query, max_results=2)
    return [{
        "title": res.get("title", "No Title"),
        "url": res.get("url", ""),
        "content": res.get("content", "")
    } for res in response.get('results', [])]

def planner_node(state: ResearchState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Break the question into 2-3 search queries. Output one per line with a hyphen."),
        ("human", "{question}")
    ])
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    response = (prompt | llm).invoke({"question": state["question"]})
    queries = [line.lstrip("- ").strip() for line in response.content.splitlines() if line.strip()]
    return {"sub_questions": queries, "current_index": 0}

def search_node(state: ResearchState) -> dict:
    query = state["sub_questions"][state["current_index"]]
    new_results = search_tavily(query)
    return {
        "search_results": state.get("search_results", []) + new_results,
        "current_index": state["current_index"] + 1
    }

def synthesizer_node(state: ResearchState) -> dict:
    results = state.get("search_results", [])
    sources_text = "\n".join([f"Source [{i}]: {res['title']}\n{res['content']}" for i, res in enumerate(results, 1)])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Answer the question using provided sources with [x] citations."),
        ("human", "Question: {question}\n\nSources:\n{sources}")
    ])
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)
    response = (prompt | llm).invoke({"question": state["question"], "sources": sources_text})
    
    references = "\n\n### 📚 Sources\n" + "\n".join([f"- [{i}] {res['title']} ({res['url']})" for i, res in enumerate(results, 1)])
    return {"final_answer": response.content + references}

def route_after_search(state: ResearchState) -> str:
    return "search" if state["current_index"] < len(state["sub_questions"]) else "synthesizer"

# ==========================================
# 4. GRAPH ASSEMBLY & INTERFACE
# ==========================================
def compile_research_graph():
    builder = StateGraph(ResearchState)
    builder.add_node("planner", planner_node)
    builder.add_node("search", search_node)
    builder.add_node("synthesizer", synthesizer_node)
    builder.add_edge(START, "planner")
    builder.add_edge("planner", "search")
    builder.add_conditional_edges("search", route_after_search, {"search": "search", "synthesizer": "synthesizer"})
    builder.add_edge("synthesizer", END)
    return builder.compile()

research_graph = compile_research_graph()

def run_research(question: str) -> dict:
    final_state = research_graph.invoke({
        "question": question, "sub_questions": [], "current_index": 0,
        "search_results": [], "search_rounds": 0, "final_answer": ""
    })
    return {"research_data": final_state.get("final_answer", ""), "metadata": []}

# ==========================================
# 5. API ENDPOINT
# ==========================================
@app.post("/api/research")
async def handle_research(payload: ResearchRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Empty question")
    
    try:
        if payload.mode == "simple":
            llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.5)
            response = llm.invoke(payload.question)
            return {"research_data": response.content, "metadata": []}
        
        return run_research(payload.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("agent:app", host="0.0.0.0", port=port, reload=True)
