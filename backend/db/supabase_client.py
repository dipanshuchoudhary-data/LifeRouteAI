"""
LifeRoute AI — Supabase Client
Handles all database interactions: semantic search, hospital retrieval.
Falls back to mock data when Supabase is unreachable.
"""

import os
from supabase import create_client, Client

_client: Client | None = None


def _get_client() -> Client:
    """Lazy-initialize the Supabase client."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        if not url or not key:
            raise ConnectionError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        _client = create_client(url, key)
    return _client


def search_hospitals(query_text: str, triage_level: str) -> list[dict]:
    """
    Search hospitals using semantic similarity via pgvector + hard filters.
    Uses the match_hospitals RPC function defined in schema.sql.
    """
    try:
        # Generate embedding for the query text
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer("all-MiniLM-L6-v2")
        embedding = model.encode(query_text).tolist()

        client = _get_client()

        # Call the RPC function for semantic search
        result = client.rpc(
            "match_hospitals",
            {
                "query_embedding": embedding,
                "match_threshold": 0.3,
                "match_count": 10,
            },
        ).execute()

        if result.data:
            return result.data
        return []

    except Exception as e:
        print(f"[Supabase] Semantic search failed: {e}")
        # Fall back to basic query
        return get_all_hospitals()


def get_all_hospitals() -> list[dict]:
    """Retrieve all hospital records (for map view / fallback)."""
    try:
        client = _get_client()
        result = (
            client.table("hospitals")
            .select("*")
            .execute()
        )
        if result.data:
            # Remove embedding field from response (too large)
            for h in result.data:
                h.pop("embedding", None)
            return result.data
        return []

    except Exception as e:
        print(f"[Supabase] Failed to fetch hospitals: {e}")
        # Return mock data without embeddings
        from graph.mock_data import MOCK_HOSPITALS

        return MOCK_HOSPITALS
