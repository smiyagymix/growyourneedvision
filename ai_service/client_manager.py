import os
from typing import Optional, Dict, Any
import openai
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class ClientManager:
    def __init__(self):
        self.clients: Dict[str, Any] = {}
        self._initialize_clients()

    def _initialize_clients(self):
        # 1. OpenAI
        if os.getenv("OPENAI_API_KEY"):
            try:
                self.clients["openai"] = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                print("[OK] OpenAI Client Initialized")
            except Exception as e:
                print(f"[WARN] OpenAI Init Failed: {e}")

        # 2. Groq (Fast Inference)
        if os.getenv("GROQ_API_KEY"):
            try:
                self.clients["groq"] = openai.OpenAI(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=os.getenv("GROQ_API_KEY")
                )
                print("[OK] Groq Client Initialized")
            except Exception as e:
                print(f"[WARN] Groq Init Failed: {e}")

        # 3. OpenRouter (Aggregator)
        if os.getenv("OPENROUTER_API_KEY"):
            try:
                self.clients["openrouter"] = openai.OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=os.getenv("OPENROUTER_API_KEY"),
                    default_headers={"HTTP-Referer": "https://growyourneed.com"}
                )
                print("[OK] OpenRouter Client Initialized")
            except Exception as e:
                print(f"[WARN] OpenRouter Init Failed: {e}")

        # 4. Ollama (Local)
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        try:
            # Simple check if reachable could be added here
            self.clients["ollama"] = openai.OpenAI(
                base_url=ollama_url,
                api_key="ollama"
            )
            print(f"[OK] Ollama Client Configured ({ollama_url})")
        except Exception as e:
            print(f"[WARN] Ollama Init Failed: {e}")

        # 5. Google Gemini
        if os.getenv("GEMINI_API_KEY"):
            try:
                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
                self.clients["gemini"] = genai.GenerativeModel('gemini-pro')
                print("[OK] Gemini Client Initialized")
            except Exception as e:
                print(f"[WARN] Gemini Init Failed: {e}")

    def get_client(self, provider: str) -> Any:
        return self.clients.get(provider)

    def list_available_providers(self) -> list:
        return list(self.clients.keys())
