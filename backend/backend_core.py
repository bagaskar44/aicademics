import os
import json
import re  # <--- TAMBAHKAN INI
from typing import List, Literal, TypedDict, Optional, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# 1. SETUP
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI(title="AICademics API", version="Final")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup
db_url = os.getenv("DATABASE_URL")
if not db_url:
    db_url = "postgresql://user:pass@localhost:5432/dummy" # Fallback

connection_string = db_url.replace("postgresql://", "postgresql+psycopg2://")

try:
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name="materi_kuliah",
        connection=connection_string,
        use_jsonb=True,
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
except:
    retriever = None

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    convert_system_message_to_human=True
)

# 2. HELPER (PENTING AGAR TIDAK CRASH)
def get_content(msg: Any) -> str:
    if hasattr(msg, 'content'):
        return msg.content
    return str(msg)

def extract_json(text: str) -> Optional[dict]:
    """Mencari JSON object { ... } di dalam teks yang berantakan."""
    try:
        # Cari pola { ... } menggunakan Regex
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return None
    except:
        return None

# 3. MODELS
class ChatRequest(BaseModel):
    user_id: str
    message: str
    mode: Literal["chat", "visual", "quiz"] = "chat"

class ChatResponse(BaseModel):
    answer: str
    references: List[str]
    context_used: str
    canvas_data: Optional[dict] = None

# 4. LOGIC
class AgentState(TypedDict):
    messages: List[Any]
    context: List[str]
    mode: str
    canvas_output: Optional[dict]

def retrieve_node(state: AgentState):
    if not retriever: return {"context": []}
    try:
        last_msg = get_content(state["messages"][-1])
        docs = retriever.invoke(last_msg)
        return {"context": [d.page_content for d in docs]}
    except:
        return {"context": []}

def generate_node(state: AgentState):
    try:
        query = get_content(state["messages"][-1])
        context = "\n\n".join(state["context"]) or "Tidak ada referensi."
        mode = state.get("mode", "chat")
        
        base_prompt = f"Jawab berdasarkan:\n{context}\n\nPertanyaan: {query}"
        canvas_result = None
        
        # Inisialisasi pesan respon default
        final_message = AIMessage(content="Maaf, gagal memproses permintaan.")

        if mode == "quiz":
            prompt = base_prompt + """
            \nINSTRUKSI: Buat 1 soal kuis pilihan ganda format JSON: 
            {"question": "...", "options": ["A","B","C","D"], "correct_answer": "...", "explanation": "..."}
            """
            # Minta AI generate
            raw_response = llm.invoke([HumanMessage(content=prompt)])
            
            # Coba ambil JSON menggunakan fungsi baru kita
            quiz_data = extract_json(raw_response.content)
            
            if quiz_data:
                # Jika JSON ketemu -> Masukkan ke Canvas
                canvas_result = quiz_data
                canvas_result["type"] = "quiz"
                # Ubah pesan chat jadi rapi (supaya kode JSON gak bocor ke chat)
                final_message = AIMessage(content="✅ **Kuis Siap!**\n\nSilakan cek panel sebelah kanan untuk mengerjakan kuis interaktif.")
            else:
                # Jika gagal nemu JSON, ya sudah tampilkan apa adanya
                final_message = raw_response

        elif mode == "visual":
            prompt = base_prompt + "\nDeskripsikan visual secara singkat."
            final_message = llm.invoke([HumanMessage(content=prompt)])
            
            keyword = query.split()[-1] if query else "Img"
            canvas_result = {
                "type": "image",
                "url": f"https://placehold.co/600x400/png?text={keyword}",
                "caption": f"Visual: {query}"
            }
        else:
            # Chat Biasa
            prompt = base_prompt + "\nJawab akademis (Markdown)."
            final_message = llm.invoke([HumanMessage(content=prompt)])

        # Return pesan yang sudah dirapikan tadi
        return {"messages": [final_message], "canvas_output": canvas_result}

        return {"messages": [response], "canvas_output": canvas_result}
    except Exception as e:
        return {"messages": [AIMessage(content=f"Error: {e}")], "canvas_output": None}

workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)
app_graph = workflow.compile()

# 5. ENDPOINTS
@app.get("/") 
def root():
    return {"status": "Backend Running"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        inputs = {
            "messages": [HumanMessage(content=request.message)],
            "context": [],
            "mode": request.mode,
            "canvas_output": None
        }
        result = await app_graph.ainvoke(inputs)
        
        final_ans = get_content(result["messages"][-1])
        
        return ChatResponse(
            answer=final_ans,
            references=["Database"],
            context_used="",
            canvas_data=result.get("canvas_output")
        )
    except Exception as e:
        print(f"Error: {e}")
        return ChatResponse(answer=f"Error: {e}", references=[], context_used="", canvas_data=None)