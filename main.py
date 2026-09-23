from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS so your frontend HTML can connect to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Temporary in-memory database
db = {
    "users": {
        "arjun": {"name": "Arjun", "friends_count": 2},
        "priya": {"name": "Priya", "friends_count": 2},
        "omar": {"name": "Omar", "friends_count": 2}
    },
    "habits": [
        {"id": "run", "title": "Run 3x/week", "target": 3, "completed": 2},     # 66%
        {"id": "phone", "title": "No phone <10PM", "target": 5, "completed": 4} # 80%
    ],
    "influence": [
        {"source": "priya", "target": "arjun", "score": "78%"},
        {"source": "omar", "target": "arjun", "score": "55%"}
    ]
}

# Define what data the POST request expects
class HabitLogRequest(BaseModel):
    habit_id: str  # Send "run" or "phone"


# Route 1: Get Arjun's habit statistics (calculates % live from db)
@app.get("/api/user/stats")
def get_user_stats():
    formatted_habits = []
    for habit in db["habits"]:
        # Calculate completion percentage from current db state
        pct = int((habit["completed"] / habit["target"]) * 100)
        formatted_habits.append({
            "id": habit["id"],
            "title": habit["title"],
            "progress": min(pct, 100)
        })

    return {
        "user_id": db["users"]["arjun"]["name"].upper(),
        "habits": formatted_habits,
        "quick_stats": {
            "friends_count": db["users"]["arjun"]["friends_count"],
            "top_catalyst": "PRIYA (78%)"
        }
    }


# Route 2: Get graph nodes and connections directly from db
@app.get("/api/network-graph")
def get_network_graph():
    nodes = [{"id": key, "label": val["name"].upper()} for key, val in db["users"].items()]
    return {
        "nodes": nodes,
        "edges": db["influence"]
    }


# Route 3: Update habit progress in memory when triggered
@app.post("/api/habits/log")
def log_activity(request: HabitLogRequest):
    for habit in db["habits"]:
        if habit["id"] == request.habit_id:
            habit["completed"] += 1  # Adds +1 to completed count in db
            new_pct = int((habit["completed"] / habit["target"]) * 100)
            return {
                "status": "success",
                "message": f"Logged activity for '{habit['title']}'! New count: {habit['completed']}/{habit['target']} ({new_pct}%)"
            }
            
    return {"status": "error", "message": "Habit ID not found"}