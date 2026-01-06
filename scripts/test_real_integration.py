import os
import sys
import asyncio
import httpx
from dotenv import load_dotenv
import openai

# Add ai_service to path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_service'))

# Load env
load_dotenv()

async def test_ollama():
    print("\n🔍 Testing Ollama Connection...")
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    # The base URL for openai client usually ends in /v1, but for raw ollama check we might want the root
    raw_ollama_url = ollama_url.replace("/v1", "")
    
    try:
        async with httpx.AsyncClient() as client:
            # Check version/status
            resp = await client.get(f"{raw_ollama_url}/api/tags")
            if resp.status_code == 200:
                models = resp.json().get('models', [])
                print(f"✅ Ollama is UP. Found {len(models)} models.")
                
                target_model = os.getenv("AI_MODEL", "qwen2.5:1.5b")
                found = any(m['name'].startswith(target_model) for m in models)
                if found:
                    print(f"✅ Model '{target_model}' is available.")
                else:
                    print(f"⚠️ Model '{target_model}' NOT found in Ollama list. Available: {[m['name'] for m in models]}")
            else:
                print(f"❌ Ollama returned status {resp.status_code}")
                return False
    except Exception as e:
        print(f"❌ Could not connect to Ollama at {raw_ollama_url}: {e}")
        return False
    
    # Test Generation
    print("   Testing Generation via OpenAI Client...")
    try:
        client = openai.OpenAI(
            base_url=ollama_url,
            api_key="ollama"
        )
        response = client.chat.completions.create(
            model=os.getenv("AI_MODEL", "qwen2.5:1.5b"),
            messages=[{"role": "user", "content": "Say 'System Operational' and nothing else."}]
        )
        print(f"✅ Generation Success: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"❌ Generation Failed: {e}")
        return False

async def test_pocketbase():
    print("\n🔍 Testing PocketBase Connection...")
    from pocketbase_client import PocketBaseClient
    pb = PocketBaseClient()
    
    try:
        await pb.authenticate()
        if pb.token:
            print("✅ PocketBase Authentication Successful.")
            
            # Try to fetch something
            users = await pb.get_user_count()
            print(f"✅ Connected to DB. User count: {users}")
            return True
        else:
            print("❌ PocketBase Authentication Failed (No token).")
            return False
    except Exception as e:
        print(f"❌ PocketBase Error: {e}")
        return False

def test_knowledge_base():
    print("\n🔍 Testing KnowledgeBase (RAG)...")
    try:
        from knowledge_base import KnowledgeBase
        kb = KnowledgeBase()
        print("✅ KnowledgeBase Initialized (ChromaDB + Embeddings loaded).")
        
        # Test Search (even if empty)
        results = kb.search("test")
        print(f"✅ Search executed successfully. Results found: {len(results) > 0}")
        return True
    except Exception as e:
        print(f"❌ KnowledgeBase Failed: {e}")
        return False

async def main():
    print("🚀 STARTING SYSTEM DIAGNOSTICS")
    print("==============================")
    
    ollama_ok = await test_ollama()
    pb_ok = await test_pocketbase()
    # KB is synchronous
    kb_ok = test_knowledge_base()
    
    print("\n==============================")
    if ollama_ok and pb_ok and kb_ok:
        print("🎉 ALL SYSTEMS GO! The AI Service is ready for production.")
    else:
        print("⚠️ SOME SYSTEMS FAILED. Check logs above.")

if __name__ == "__main__":
    asyncio.run(main())
