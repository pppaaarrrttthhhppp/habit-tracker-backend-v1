from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import ContagionScore, Friendship, Habit, HabitLog, User

CURRENT_USERNAME = "Pallavi"
WINDOW = timedelta(hours=48)


class CheckInRequest(BaseModel):
    habit_id: int


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    icon: str = "check"
    frequency: str = "daily"


def current_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.name == CURRENT_USERNAME))
    if user is None:
        user = User(name=CURRENT_USERNAME)
        db.add(user)
        db.flush()
    return user


def habit_response(db: Session, habit: Habit) -> dict:
    since = datetime.utcnow() - timedelta(days=7)
    completed = db.scalar(select(func.count(HabitLog.id)).where(
        HabitLog.habit_id == habit.id, HabitLog.completed_at >= since,
    )) or 0
    target = 7 if habit.frequency == "daily" else 5
    return {
        "id": habit.id,
        "name": habit.name,
        "title": habit.name,
        "icon": habit.icon,
        "frequency": habit.frequency,
        "completed": completed,
        "target_days": target,
        "progress": min(100, round(completed / target * 100)),
    }


def connected_friend_ids(db: Session, user_id: int) -> list[int]:
    friendships = db.scalars(select(Friendship).where(
        (Friendship.user_id_1 == user_id) | (Friendship.user_id_2 == user_id)
    )).all()
    return [item.user_id_2 if item.user_id_1 == user_id else item.user_id_1 for item in friendships]


def calculate_score(db: Session, user_a_id: int, user_b_id: int, habit_name: str) -> float:
    habit_a = db.scalar(select(Habit).where(Habit.user_id == user_a_id, Habit.name == habit_name))
    habit_b = db.scalar(select(Habit).where(Habit.user_id == user_b_id, Habit.name == habit_name))
    if not habit_a or not habit_b:
        return 0.0
    cutoff = datetime.utcnow() - WINDOW
    times_a = db.scalars(select(HabitLog.completed_at).where(
        HabitLog.habit_id == habit_a.id, HabitLog.completed_at >= cutoff,
    )).all()
    times_b = db.scalars(select(HabitLog.completed_at).where(
        HabitLog.habit_id == habit_b.id, HabitLog.completed_at >= cutoff,
    )).all()
    if not times_a or not times_b:
        return 0.0
    pairs = sum(1 for time_a in times_a if any(abs(time_a - time_b) <= WINDOW for time_b in times_b))
    return round(min(1.0, pairs / max(len(times_a), len(times_b))), 2)


def influencer_rows(db: Session, user: User, limit: int) -> list[dict]:
    rows = []
    habit_names = db.scalars(select(Habit.name).where(Habit.user_id == user.id)).all()
    for friend_id in connected_friend_ids(db, user.id):
        friend = db.get(User, friend_id)
        if not friend:
            continue
        stored_scores = []
        calculated_scores = []
        for name in set(habit_names):
            stored_score = db.scalar(select(ContagionScore.score).where(
                ContagionScore.user_a_id == user.id,
                ContagionScore.user_b_id == friend.id,
                ContagionScore.habit_name == name,
            ))
            if stored_score is None:
                calculated_scores.append(calculate_score(db, user.id, friend.id, name))
            else:
                stored_scores.append(stored_score)
        score = max(stored_scores) if stored_scores else max(calculated_scores, default=0.0)
        rows.append({"id": friend.id, "name": friend.name, "score": score})
    return sorted(rows, key=lambda item: item["score"], reverse=True)[:limit]


def today_count(db: Session, user_id: int) -> int:
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.scalar(select(func.count(HabitLog.id)).join(Habit).where(
        Habit.user_id == user_id, HabitLog.completed_at >= start,
    )) or 0


def today_habit_log(db: Session, habit_id: int) -> HabitLog | None:
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.scalar(select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.completed_at >= start))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        current_user(db)
        db.commit()
    yield


app = FastAPI(title="Micro-Habit Contagion Tracker API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/user/stats")
def user_stats(db: Session = Depends(get_db)):
    user = current_user(db)
    active_habits = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
    influencers = influencer_rows(db, user, 1)
    return {
        "user_id": user.id,
        "name": user.name,
        "check_ins": db.scalar(select(func.count(HabitLog.id)).join(Habit).where(Habit.user_id == user.id)) or 0,
        "total_friends": len(connected_friend_ids(db, user.id)),
        "active_habits_count": len(active_habits),
        "top_influencer": influencers[0] if influencers else None,
        "display_name": user.name,
        "quick_stats": {
            "today_check_ins": today_count(db, user.id),
            "active_habits": len(active_habits),
            "friends_count": len(connected_friend_ids(db, user.id)),
        },
    }


@app.get("/api/habits")
def list_habits(db: Session = Depends(get_db)):
    user = current_user(db)
    return [habit_response(db, habit) for habit in db.scalars(select(Habit).where(Habit.user_id == user.id)).all()]


@app.post("/api/habits", status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, db: Session = Depends(get_db)):
    habit = Habit(user_id=current_user(db).id, **payload.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit_response(db, habit)


@app.get("/api/check-ins/today")
def today_check_ins(db: Session = Depends(get_db)):
    user = current_user(db)
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
    return {
        "date": datetime.utcnow().date(),
        "completed": today_count(db, user.id),
        "habit_ids": [habit.id for habit in habits if today_habit_log(db, habit.id)],
    }


@app.post("/api/check-ins")
@app.post("/api/habits/log")
def create_check_in(payload: CheckInRequest, db: Session = Depends(get_db)):
    user = current_user(db)
    habit = db.scalar(select(Habit).where(Habit.id == payload.habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if not today_habit_log(db, habit.id):
        db.add(HabitLog(habit_id=habit.id))
        db.commit()
    return {"status": "success", "habit_id": habit.id, "habit_name": habit.name}


@app.get("/api/influencers")
def influencers(limit: int = Query(default=5, ge=1, le=50), db: Session = Depends(get_db)):
    return influencer_rows(db, current_user(db), limit)


@app.get("/api/recommendations/pairing")
def pairing_recommendation(db: Session = Depends(get_db)):
    user = current_user(db)
    candidates = influencer_rows(db, user, 50)
    if not candidates:
        return {"recommendation": None, "message": "Connect with a friend to receive a pairing recommendation."}
    candidate = candidates[0]
    pairing_score = round(candidate["score"] * 0.6 + 0.4, 2)
    return {"recommendation": {
        **candidate,
        "pairing_score": pairing_score,
        "explanation": f"Your recent {candidate['name']} activity overlaps with your habits and schedule.",
    }}