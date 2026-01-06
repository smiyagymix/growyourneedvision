from typing import Dict, Any, Optional
import os

class ModelRouter:
    def __init__(self):
        self.default_provider = os.getenv("AI_PROVIDER", "openai")
        self.default_model = os.getenv("AI_MODEL", "gpt-3.5-turbo")
        
    def route(self, query: str, context: str, available_providers: list) -> Dict[str, str]:
        """
        Determines the best model/provider for the given query.
        """
        query_lower = query.lower()
        
        # Strategy:
        # 1. If specific provider is requested in context/query (advanced), use it.
        # 2. If "code" or "complex" -> High Intelligence (OpenAI GPT-4 / OpenRouter Claude 3)
        # 3. If "fast" or simple -> Low Latency (Groq / Ollama)
        # 4. Fallback -> Default
        
        selected_provider = self.default_provider
        selected_model = self.default_model
        reason = "Default configuration"

        # Check availability
        has_groq = "groq" in available_providers
        has_openai = "openai" in available_providers
        has_ollama = "ollama" in available_providers

        # 1. Complex / Coding
        if any(k in query_lower for k in ["code", "function", "debug", "error", "fix", "algorithm", "architecture", "react", "typescript"]):
            if has_openai:
                selected_provider = "openai"
                selected_model = "gpt-4-turbo-preview"
                reason = "Complex technical query -> GPT-4"
            elif "openrouter" in available_providers:
                selected_provider = "openrouter"
                selected_model = "anthropic/claude-3-opus"
                reason = "Complex technical query -> Claude 3 Opus"

        # 2. Speed / Simple
        elif len(query.split()) < 15 or any(k in query_lower for k in ["hello", "hi", "status", "time", "thanks"]):
            if has_groq:
                selected_provider = "groq"
                selected_model = "llama3-8b-8192"
                reason = "Simple query -> Groq Llama3 (Speed)"
            elif has_ollama:
                selected_provider = "ollama"
                selected_model = os.getenv("VITE_OLLAMA_MODEL", "qwen2.5:1.5b")
                reason = "Simple query -> Local Ollama"

        # 3. Fallback if selected provider is not available
        if selected_provider not in available_providers:
            # Try to find ANY available provider
            if available_providers:
                selected_provider = available_providers[0]
                reason = f"Fallback: {selected_provider} (Original choice {selected_provider} unavailable)"
            else:
                # No providers!
                return {
                    "provider": "none",
                    "model": "none",
                    "reason": "No AI providers configured"
                }

        return {
            "provider": selected_provider,
            "model": selected_model,
            "reason": reason
        }
