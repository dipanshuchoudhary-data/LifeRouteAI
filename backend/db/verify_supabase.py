"""
Verify Supabase connection and hospital test data.
Run: python -m db.verify_supabase
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from supabase import create_client


def verify():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        print("❌ Set SUPABASE_URL and SUPABASE_KEY in .env")
        sys.exit(1)

    print(f"Connecting to {url}...")
    client = create_client(url, key)

    try:
        result = client.table("hospitals").select("id, name, city, available_beds, has_icu").execute()
    except Exception as e:
        err = str(e)
        if "PGRST205" in err or "Could not find the table" in err:
            print("\n❌ Table 'hospitals' does not exist yet.")
            print("\n👉 Fix: Open Supabase SQL Editor and run:")
            print("   backend/db/init_supabase.sql")
            print(f"\n   https://supabase.com/dashboard/project/gojcynmxgidwwnilywbq/sql/new")
        else:
            print(f"\n❌ Error: {e}")
        sys.exit(1)

    rows = result.data or []
    print(f"\n✅ Connected! Found {len(rows)} hospitals:\n")
    for h in rows:
        icu = "ICU ✓" if h.get("has_icu") else "no ICU"
        print(f"  [{h['id']}] {h['name']} ({h['city']}) — {h['available_beds']} beds, {icu}")

    with_emb = client.table("hospitals").select("id").not_.is_("embedding", "null").execute()
    emb_count = len(with_emb.data or [])
    print(f"\n📊 Embeddings: {emb_count}/{len(rows)} hospitals have vector embeddings")

    if emb_count == 0 and len(rows) > 0:
        print("\n💡 Run full seed for semantic search:")
        print("   python -m db.seed_hospitals")

    # Test RPC if embeddings exist
    if emb_count > 0:
        try:
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer("all-MiniLM-L6-v2")
            emb = model.encode("chest pain cardiology").tolist()
            rpc = client.rpc("match_hospitals", {
                "query_embedding": emb,
                "match_threshold": 0.3,
                "match_count": 3,
            }).execute()
            print(f"\n🔍 Semantic search test (chest pain): {len(rpc.data or [])} matches")
            for m in (rpc.data or [])[:3]:
                print(f"   → {m['name']} (similarity: {m.get('similarity', 0):.2f})")
        except Exception as e:
            print(f"\n⚠️  RPC test failed: {e}")


if __name__ == "__main__":
    verify()
