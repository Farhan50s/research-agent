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

def get_groq_key() -> str:
    key = os.getenv("GROQ_API_KEY", "").strip().strip('"').strip("'")
    return key

def get_tavily_key() -> str:
    key = os.getenv("TAVILY_API_KEY", "").strip().strip('"').strip("'")
    return key

def get_groq_model() -> str:
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip().strip('"').strip("'")
    return model or "openai/gpt-oss-120b"

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Zynt AI Research Agent API",
        "version": "1.0.0",
        "model": get_groq_model(),
        "hosting": "Vercel Serverless (Fluid Compute)"
    }

@app.get("/health")
async def health():
    groq_set = bool(get_groq_key())
    tavily_set = bool(get_tavily_key())
    return {
        "status": "healthy",
        "model": get_groq_model(),
        "keys_configured": {
            "groq": groq_set,
            "tavily": tavily_set
        }
    }

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
    tavily_key = get_tavily_key()
    if not tavily_key:
        raise HTTPException(
            status_code=400,
            detail="TAVILY_API_KEY is not configured in the environment."
        )
    tavily_client = TavilyClient(api_key=tavily_key)
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
    groq_key = get_groq_key()
    if not groq_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY is not configured in the environment."
        )
    llm = ChatGroq(model=get_groq_model(), temperature=0, groq_api_key=groq_key)
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
    groq_key = get_groq_key()
    llm = ChatGroq(model=get_groq_model(), temperature=0.3, groq_api_key=groq_key)
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
    
    groq_key = get_groq_key()
    if not groq_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY is missing. Please configure GROQ_API_KEY in your deployment environment."
        )

    try:
        if payload.mode == "simple":
            llm = ChatGroq(model=get_groq_model(), temperature=0.5, groq_api_key=groq_key)
            response = llm.invoke(payload.question)
            return {"research_data": response.content, "metadata": []}
        
        return run_research(payload.question)
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        if "invalid_api_key" in err_msg or "Invalid API Key" in err_msg or "401" in err_msg:
            raise HTTPException(
                status_code=401,
                detail="Groq API Key is invalid or expired. Please obtain a fresh free API key at https://console.groq.com and update GROQ_API_KEY."
            )
        raise HTTPException(status_code=500, detail=err_msg)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("agent:app", host="0.0.0.0", port=port, reload=True)
