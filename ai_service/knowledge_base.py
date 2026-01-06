import os
import glob
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
from langchain_text_splitters import RecursiveCharacterTextSplitter

class KnowledgeBase:
    def __init__(self, persist_directory: str = "./ai_service/chroma_db") -> None:
        """
        Initialize the Knowledge Base with ChromaDB.
        """
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Use a local, efficient embedding model (runs on CPU/GPU, no API costs)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.collection = self.client.get_or_create_collection(
            name="gyn_docs",
            embedding_function=self.embedding_fn
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )

    def ingest_docs(self, docs_dir: str) -> int:
        """
        Reads all markdown files from docs_dir, chunks them, and stores in vector DB.
        Returns number of chunks added.
        """
        print(f"Scanning {docs_dir} for documentation...")
        files: List[str] = glob.glob(os.path.join(docs_dir, "*.md"))
        
        if not files:
            print("No markdown files found.")
            return 0

        total_chunks: int = 0
        
        # Clear existing to avoid duplicates on re-ingest (simple strategy for now)
        try:
            existing_count: int = self.collection.count()
            if existing_count > 0:
                print(f"Clearing {existing_count} existing documents...")
                self.client.delete_collection("gyn_docs")
                self.collection = self.client.get_or_create_collection(
                    name="gyn_docs",
                    embedding_function=self.embedding_fn
                )
        except Exception as e:
            print(f"Note: Collection reset skipped: {e}")

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content: str = f.read()
                
                filename: str = os.path.basename(file_path)
                chunks: List[str] = self.text_splitter.split_text(content)
                
                for i, chunk in enumerate(chunks):
                    chunk_id: str = f"{filename}_{i}"
                    ids.append(chunk_id)
                    documents.append(chunk)
                    metadatas.append({"source": filename, "chunk_index": i})
                    
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

        if documents:
            # Add in batches to avoid hitting limits if any
            batch_size: int = 100
            for i in range(0, len(documents), batch_size):
                end: int = i + batch_size
                self.collection.add(
                    ids=ids[i:end],
                    documents=documents[i:end],
                    metadatas=metadatas[i:end]
                )
            total_chunks = len(documents)
            print(f"Successfully indexed {total_chunks} chunks from {len(files)} files.")
        
        return total_chunks

    def search(self, query: str, k: int = 3) -> List[str]:
        """
        Semantic search for relevant context.
        """
        if self.collection.count() == 0:
            return []

        results = self.collection.query(
            query_texts=[query],
            n_results=k
        )
        
        # Flatten results
        if results and results['documents']:
            # The type of results['documents'] is List[List[str]] | None
            # We know it's not None because we checked, and we want the first list (first query)
            docs: List[str] = results['documents'][0]
            return docs
        return []
