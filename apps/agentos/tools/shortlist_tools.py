import json
from datetime import datetime
from agno.tools import tool
from db.client import get_db


@tool(name="add_to_shortlist", description="Add a car listing to the user's shortlist")
def add_to_shortlist(listing_json: str, notes: str = "", session_id: str = "") -> str:
    """Persist a listing to the shortlists MongoDB collection."""
    if not session_id:
        return "Error: session_id required"
    try:
        listing = json.loads(listing_json)
    except json.JSONDecodeError:
        return "Error: invalid listing JSON"

    db = get_db()
    entry = {
        "listing": listing,
        "notes": notes,
        "added_at": datetime.utcnow().isoformat(),
    }
    db.shortlists.update_one(
        {"session_id": session_id},
        {
            "$push": {"entries": entry},
            "$set": {"updated_at": datetime.utcnow().isoformat()},
            "$setOnInsert": {"session_id": session_id},
        },
        upsert=True,
    )
    brand = listing.get("brand", "")
    model = listing.get("model", "")
    return f"Added {brand} {model} to shortlist"


@tool(name="view_shortlist", description="View all cars in the user's shortlist")
def view_shortlist(session_id: str = "") -> str:
    if not session_id:
        return "[]"
    db = get_db()
    doc = db.shortlists.find_one({"session_id": session_id})
    if not doc:
        return "[]"
    entries = doc.get("entries", [])
    return json.dumps(entries, ensure_ascii=False, default=str)


@tool(name="remove_from_shortlist", description="Remove a car from the shortlist by index")
def remove_from_shortlist(index: int, session_id: str = "") -> str:
    if not session_id:
        return "Error: session_id required"
    db = get_db()
    doc = db.shortlists.find_one({"session_id": session_id})
    if not doc:
        return "Shortlist not found"
    entries: list = doc.get("entries", [])
    if index < 0 or index >= len(entries):
        return f"Invalid index {index}"
    entries.pop(index)
    db.shortlists.update_one(
        {"session_id": session_id},
        {"$set": {"entries": entries, "updated_at": datetime.utcnow().isoformat()}},
    )
    return f"Removed item at index {index}"


@tool(name="update_shortlist_notes", description="Add or update notes for a shortlisted car")
def update_shortlist_notes(index: int, notes: str, session_id: str = "") -> str:
    if not session_id:
        return "Error: session_id required"
    db = get_db()
    db.shortlists.update_one(
        {"session_id": session_id},
        {"$set": {f"entries.{index}.notes": notes}},
    )
    return f"Updated notes for item {index}"
