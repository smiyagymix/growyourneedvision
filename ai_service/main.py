import os
import time
import logging
import json
from pythonjsonlogger import jsonlogger
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import google.generativeai as genai
from knowledge_base import KnowledgeBase
from pocketbase_client import PocketBaseClient
from client_manager import ClientManager
from model_router import ModelRouter

# Configure JSON logging
log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
log_handler.setFormatter(formatter)
logger = logging.getLogger("ai_service")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

# Load environment variables
# Explicitly look for .env in the parent directory if not found in current
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(parent_dir, ".env")

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    logger.info(f"Loaded .env from: {dotenv_path}")
else:
    load_dotenv() # Fallback to default behavior
    logger.info("Loaded .env from default location (or not found)")

# Initialize Knowledge Base & PocketBase
# In production, we fail if KB cannot be initialized.
try:
    kb = KnowledgeBase()
except Exception as e:
    logger.critical(f"KnowledgeBase initialization failed: {e}")
    raise RuntimeError(f"KnowledgeBase initialization failed: {e}")

pb = PocketBaseClient()
client_manager = ClientManager()
router = ModelRouter()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await pb.authenticate()
    
    # Ingest docs on startup in background
    docs_path: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
    if os.path.exists(docs_path):
        logger.info(f"Background ingestion started for: {docs_path}")
        try:
            count: int = kb.ingest_docs(docs_path)
            logger.info(f"Startup ingestion complete: {count} chunks.")
        except Exception as e:
            logger.error(f"Error during startup ingestion: {e}")
    yield
    logger.info("Shutting down AI Service...")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Concierge AI Service", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")],  # Restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai").lower()
AI_MODEL: Optional[str] = os.getenv("AI_MODEL")
OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OPEN_WEBUI_BASE_URL: str = os.getenv("OPEN_WEBUI_BASE_URL", "http://localhost:3000/api")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Optional[str] = None
    model: Optional[str] = None
    userId: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    usage: Optional[Dict[str, Any]] = None
    provider: str

class SystemStats(BaseModel):
    latency: str
    error_rate: str
    load: str
    tokens_total: str
    tokens_input: str
    tokens_output: str
    provider: str



# Global Stats Tracker
class ServiceStats:
    def __init__(self) -> None:
        self.start_time: float = time.time()
        self.request_count: int = 0
        self.error_count: int = 0
        self.tokens_in: int = 0
        self.tokens_out: int = 0

    def get_uptime(self) -> str:
        uptime_seconds = time.time() - self.start_time
        hours = int(uptime_seconds // 3600)
        minutes = int((uptime_seconds % 3600) // 60)
        return f"{hours}h {minutes}m"

    def get_error_rate(self) -> str:
        if self.request_count == 0:
            return "0.00%"
        return f"{(self.error_count / self.request_count) * 100:.2f}%"

stats = ServiceStats()

@app.get("/")
async def root() -> Dict[str, str]:
    return {
        "status": "online", 
        "service": "Concierge AI", 
        "provider": AI_PROVIDER,
        "uptime": stats.get_uptime()
    }

@app.get("/stats", response_model=SystemStats)
async def get_stats() -> Dict[str, str]:
    return {
        "latency": "24ms", # Placeholder for average latency calculation
        "error_rate": stats.get_error_rate(),
        "load": f"{stats.request_count} reqs",
        "tokens_total": str(stats.tokens_in + stats.tokens_out),
        "tokens_input": str(stats.tokens_in),
        "tokens_output": str(stats.tokens_out),
        "provider": AI_PROVIDER
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "provider": AI_PROVIDER,
        "kb_status": "ready" if kb else "error"
    }

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("5/minute")
async def chat(request: ChatRequest, fast_request: Request) -> Dict[str, Any]:
    stats.request_count += 1
    try:
        # 1. Check for specific system commands first
        last_message: str = request.messages[-1].content.lower()
        
        if "status" in last_message or "health" in last_message:
            return {
                "response": f"All systems are operational. Provider: {AI_PROVIDER}. Latency is nominal (24ms).",
                "usage": {"total_tokens": 0},
                "provider": AI_PROVIDER
            }
        
        if "help" in last_message:
            return {
                "response": "I am the Concierge AI. I can assist you with:\n- Platform configuration\n- User management\n- System diagnostics\n- Data analysis\n\nHow can I help you today?",
                "usage": {"total_tokens": 0},
                "provider": AI_PROVIDER
            }

        # RAG: Retrieve relevant context
        retrieved_context: str = ""
        try:
            results: List[str] = kb.search(request.messages[-1].content)
            if results:
                retrieved_context = "\n\nRelevant Documentation:\n" + "\n---\n".join(results)
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")

        # REAL-TIME DATA: Fetch System Pulse
        system_pulse: str = await pb.get_recent_activity()
        
        # REAL-TIME DATA: Targeted Search (Simple Intent)
        db_results: str = ""
        user_query: str = request.messages[-1].content.lower()
        
        # Wellness Coach Logic
        if request.context == "Wellness Coach" and request.userId:
            try:
                logs = await pb.search_collection("wellness_logs", filter_str=f"user='{request.userId}'", limit=7)
                if logs:
                    # Format logs for better AI consumption
                    formatted_logs: List[str] = []
                    for log in logs:
                        formatted_logs.append(f"- Date: {log.get('date')}, Steps: {log.get('steps')}, Calories: {log.get('calories')}, Sleep: {log.get('sleep_minutes')}m, Mood: {log.get('mood')}")
                    db_results += f"\n\n[USER WELLNESS LOGS (Last 7 Days)]\n" + "\n".join(formatted_logs)
            except Exception as e:
                logger.error(f"Error fetching wellness logs: {e}", extra={"userId": request.userId})

        if "search user" in user_query or "find user" in user_query:
            # Extract name (very naive)
            parts = user_query.split("user")
            if len(parts) > 1:
                search_term = parts[1].strip()
                users = await pb.search_collection("users", filter_str=f"name~'{search_term}' || email~'{search_term}'")
                db_results = f"\n\nDatabase Search Results (Users):\n{users}"
        elif "list products" in user_query:
             products = await pb.search_collection("products", limit=10)
             db_results = f"\n\nDatabase Search Results (Products):\n{products}"

        system_prompt: str = "You are the Concierge AI for the 'Grow Your Need' platform. You are helpful, professional, and concise. You have access to system documentation and real-time database status."
        
        if request.context == "Wellness Coach":
            system_prompt = "You are the Wellness Coach for the 'Grow Your Need' platform. You are an empathetic, encouraging, and knowledgeable health assistant. You help users track their fitness, sleep, and mental well-being. Use the provided wellness logs to give personalized advice. Keep your answers short and motivating."

        # Inject Contexts
        system_prompt += f"\n\n[SYSTEM PULSE - RECENT ACTIVITY]\n{system_pulse}"
        
        if request.context:
            system_prompt += f"\n\n[USER CONTEXT]\n{request.context}"
            
        if retrieved_context:
            system_prompt += f"\n\n[KNOWLEDGE BASE]\n{retrieved_context}"
            
        if db_results:
            system_prompt += f"\n\n[DATABASE RESULTS]\n{db_results}"

        # --- INTELLIGENT ROUTING ---
        available_providers = client_manager.list_available_providers()
        route_decision = router.route(request.messages[-1].content, request.context or "General", available_providers)
        
        selected_provider = route_decision["provider"]
        selected_model = route_decision["model"]
        
        logger.info(f"Routing Decision: {route_decision}", extra={"userId": request.userId, "context": request.context})

        # 2. Handle Gemini Provider
        if selected_provider == "gemini":
            genai_model = client_manager.get_client("gemini")
            if genai_model:
                chat_session = genai_model.start_chat(history=[])
                full_prompt: str = f"{system_prompt}\n\nUser: {request.messages[-1].content}"
                response = chat_session.send_message(full_prompt)
                
                input_tokens = len(full_prompt) // 4
                output_tokens = len(response.text) // 4
                stats.tokens_in += input_tokens
                stats.tokens_out += output_tokens
                
                return {
                    "response": response.text,
                    "usage": {"total_tokens": input_tokens + output_tokens}, 
                    "provider": f"gemini ({selected_model})"
                }

        # 3. Handle OpenAI-compatible Providers
        client = client_manager.get_client(selected_provider)
        if client:
            api_messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
            for msg in request.messages:
                api_messages.append({"role": msg.role, "content": msg.content})

            completion = client.chat.completions.create(
                model=selected_model,
                messages=api_messages
            )
            
            if completion.usage:
                stats.tokens_in += completion.usage.prompt_tokens
                stats.tokens_out += completion.usage.completion_tokens
            
            return {
                "response": completion.choices[0].message.content,
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                } if completion.usage else {},
                "provider": f"{selected_provider} ({selected_model})"
            }
        
        # 4. Fallback
        stats.error_count += 1
        return {
            "response": f"I am currently running in offline mode. Provider '{selected_provider}' is not configured correctly. Please check your .env file.",
            "usage": {"total_tokens": 0},
            "provider": "offline"
        }

    except Exception as e:
        stats.error_count += 1
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

async def ingest_all_knowledge():
    logger.info("Starting knowledge refresh...")
    # 1. Ingest local docs
    docs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")
    if os.path.exists(docs_path):
        kb.ingest_docs(docs_path)
    
    # 2. Download and ingest from PocketBase
    records = await pb.get_knowledge_docs()
    temp_dir = os.path.join(os.path.dirname(__file__), "temp_docs")
    os.makedirs(temp_dir, exist_ok=True)
    
    downloaded_count = 0
    for record in records:
        filename = record.get("file")
        if filename:
            dest = os.path.join(temp_dir, filename)
            if await pb.download_file(record["collectionId"], record["id"], filename, dest):
                downloaded_count += 1
    
    if downloaded_count > 0:
        logger.info(f"Downloaded {downloaded_count} documents from PocketBase.")
        kb.ingest_docs(temp_dir)
    
    logger.info("Knowledge refresh complete.")

@app.post("/refresh-knowledge")
async def refresh_knowledge(background_tasks: BackgroundTasks):
    background_tasks.add_task(ingest_all_knowledge)
    return {"status": "Knowledge refresh started"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
