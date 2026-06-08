"""
LifeRoute AI — Hospital Seed Script
Seeds 15 realistic Indian hospitals into Supabase with pgvector embeddings.
Run: python -m db.seed_hospitals
"""

import os
import sys

# Ensure we can import from the backend package
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from supabase import create_client
from sentence_transformers import SentenceTransformer

# Import mock hospital data
from graph.mock_data import MOCK_HOSPITALS


def generate_embedding_text(hospital: dict) -> str:
    """Build text representation of a hospital for embedding."""
    parts = [
        hospital["name"],
        hospital["city"],
        " ".join(hospital["specialties"]),
    ]
    if hospital.get("has_icu"):
        parts.append("ICU intensive care unit")
    if hospital.get("has_cath_lab"):
        parts.append("catheterization lab cardiac")
    if hospital.get("has_trauma_center"):
        parts.append("trauma center emergency")
    if hospital.get("has_neurology_unit"):
        parts.append("neurology brain stroke")
    return " ".join(parts)


def seed():
    """Seed hospitals into Supabase with embeddings."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_KEY in your .env file")
        sys.exit(1)

    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print("Connecting to Supabase...")
    client = create_client(url, key)

    try:
        existing = client.table("hospitals").select("id").limit(1).execute()
    except Exception as e:
        if "PGRST205" in str(e) or "Could not find the table" in str(e):
            print("\n❌ Table 'hospitals' not found.")
            print("Run backend/db/init_supabase.sql in Supabase SQL Editor first:")
            print("https://supabase.com/dashboard/project/gojcynmxgidwwnilywbq/sql/new")
            sys.exit(1)
        raise

    if existing.data:
        print(f"Hospitals table already has data. Clearing and re-seeding...")
        client.table("hospitals").delete().neq("id", 0).execute()

    print(f"Seeding {len(MOCK_HOSPITALS)} hospitals...")

    for i, hospital in enumerate(MOCK_HOSPITALS):
        # Generate embedding
        text = generate_embedding_text(hospital)
        embedding = model.encode(text).tolist()

        # Prepare record (remove 'id' — let Supabase auto-generate)
        record = {k: v for k, v in hospital.items() if k != "id"}
        record["embedding"] = embedding

        # Insert
        client.table("hospitals").insert(record).execute()
        print(f"  [{i+1}/{len(MOCK_HOSPITALS)}] {hospital['name']} ✓")

    print(f"\n✅ Successfully seeded {len(MOCK_HOSPITALS)} hospitals!")
    print("Run the SQL in db/schema.sql first if you haven't created the table and RPC function.")


if __name__ == "__main__":
    seed()
