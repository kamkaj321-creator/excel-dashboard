from pymongo import MongoClient
import json
from datetime import datetime

def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)

def inspect_db():
    try:
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        # Trigger an exception if server is not reachable
        client.server_info()
        
        db = client.app_db
        
        print("\n=== MAPPINGS COLLECTION ===")
        mappings = list(db.mappings.find())
        if not mappings:
            print("No mappings found.")
        for m in mappings:
            print(json.dumps(m, indent=2, default=default_serializer))
            
        print("\n=== AGGREGATE RESULTS COLLECTION ===")
        results = list(db.aggregate_results.find())
        if not results:
            print("No results found.")
        for r in results:
            print(json.dumps(r, indent=2, default=default_serializer))
            
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("\nTip: Make sure MongoDB is installed and running at localhost:27017")

if __name__ == "__main__":
    inspect_db()
