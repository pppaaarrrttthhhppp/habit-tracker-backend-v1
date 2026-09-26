from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import ContagionScore, Friendship, Habit, HabitLog, User

CURRENT_USERNAME = "Pallavi"
WINDOW = timedelta(hours=48)

HABIT_COLORS = {
    "running": "#6366f1",
    "meditation": "#10b981",
    "reading": "#f59e0b",
    "activity": "#6366f1",
    "check": "#0ea5e9",
    "heart": "#ec4899",
    "book": "#f59e0b",
    "flame": "#f97316",
    "brain": "#8b5cf6",
}
FALLBACK_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#ec4899", "#8b5cf6"]


class CheckInRequest(BaseModel):
    habit_id: int
    toggle: bool = False


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    icon: str = Field(default="check", max_length=20)
    frequency: str = Field(default="daily", max_length=20)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Habit name cannot be empty")
        return cleaned

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if cleaned not in {"daily", "weekly"}:
            raise ValueError("Frequency must be 'daily' or 'weekly'")
        return cleaned


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    icon: str | None = Field(default=None, max_length=20)
    frequency: str | None = Field(default=None, max_length=20)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Habit name cannot be empty")
        return cleaned

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        if cleaned not in {"daily", "weekly"}:
            raise ValueError("Frequency must be 'daily' or 'weekly'")
        return cleaned


def current_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.name == CURRENT_USERNAME))
    if user is None:
        user = User(name=CURRENT_USERNAME, avatar_url=f"https://ui-avatars.com/api/?name={CURRENT_USERNAME}")
        db.add(user)
        db.flush()
    return user


def resolve_habit_color(habit: Habit) -> str:
    by_name = HABIT_COLORS.get((habit.name or "").strip().lower())
    if by_name:
        return by_name
    by_icon = HABIT_COLORS.get((habit.icon or "").strip().lower())
    if by_icon:
        return by_icon
    return FALLBACK_PALETTE[(habit.id or 0) % len(FALLBACK_PALETTE)]


def today_habit_log(db: Session, habit_id: int) -> HabitLog | None:
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.scalar(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id, HabitLog.completed_at >= start)
        .order_by(HabitLog.completed_at.desc())
    )


def habit_response(db: Session, habit: Habit) -> dict:
    since = datetime.utcnow() - timedelta(days=7)
    completed = db.scalar(select(func.count(HabitLog.id)).where(
        HabitLog.habit_id == habit.id, HabitLog.completed_at >= since,
    )) or 0
    target = 7 if habit.frequency == "daily" else 5
    completed_today = today_habit_log(db, habit.id) is not None
    return {
        "id": habit.id,
        "name": habit.name,
        "title": habit.name,
        "icon": habit.icon,
        "frequency": habit.frequency,
        "completed": completed,
        "completed_today": completed_today,
        "target_days": target,
        "progress": min(100, round(completed / target * 100)),
        "color": resolve_habit_color(habit),
        "created_at": habit.created_at.isoformat() if habit.created_at else None,
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


def influencer_rows(db: Session, user: User, limit: int, habit_filter: str | None = None) -> list[dict]:
    rows = []
    habit_names = db.scalars(select(Habit.name).where(Habit.user_id == user.id)).all()
    unique_names = list(dict.fromkeys(habit_names))
    if habit_filter and habit_filter.lower() != "all":
        unique_names = [n for n in unique_names if n.lower() == habit_filter.strip().lower()]

    for friend_id in connected_friend_ids(db, user.id):
        friend = db.get(User, friend_id)
        if not friend:
            continue
        habit_scores: dict[str, float] = {}
        for name in unique_names:
            stored_score = db.scalar(select(ContagionScore.score).where(
                ContagionScore.user_a_id == user.id,
                ContagionScore.user_b_id == friend.id,
                ContagionScore.habit_name == name,
            ))
            if stored_score is None:
                habit_scores[name] = calculate_score(db, user.id, friend.id, name)
            else:
                habit_scores[name] = float(stored_score)

        if habit_scores:
            top_habit_name, best_score = max(habit_scores.items(), key=lambda pair: pair[1])
        else:
            top_habit_name, best_score = (habit_filter or "Running"), 0.0

        friend_habits = db.scalars(select(Habit.name).where(Habit.user_id == friend.id)).all()
        shared_habits = [n for n in unique_names if n in set(friend_habits)]

        rows.append({
            "id": friend.id,
            "name": friend.name,
            "avatar_url": friend.avatar_url or f"https://ui-avatars.com/api/?name={friend.name}",
            "score": round(best_score, 2),
            "top_habit": top_habit_name,
            "shared_habits": shared_habits,
            "habit_scores": habit_scores,
        })
    return sorted(rows, key=lambda item: item["score"], reverse=True)[:limit]


def today_count(db: Session, user_id: int) -> int:
    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.scalar(
        select(func.count(func.distinct(HabitLog.habit_id)))
        .join(Habit)
        .where(Habit.user_id == user_id, HabitLog.completed_at >= start)
    ) or 0


def format_relative_time(timestamp: datetime) -> str:
    delta = datetime.utcnow() - timestamp
    seconds = max(0, int(delta.total_seconds()))
    if seconds < 60:
        return "Just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"


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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/user/stats")
@app.get("/user/stats")
def user_stats(db: Session = Depends(get_db)):
    user = current_user(db)
    active_habits = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
    influencers_list = influencer_rows(db, user, 1)
    friends_count = len(connected_friend_ids(db, user.id))
    today_completed = today_count(db, user.id)
    return {
        "user_id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url or f"https://ui-avatars.com/api/?name={user.name}",
        "check_ins": db.scalar(select(func.count(HabitLog.id)).join(Habit).where(Habit.user_id == user.id)) or 0,
        "total_friends": friends_count,
        "active_habits_count": len(active_habits),
        "top_influencer": influencers_list[0] if influencers_list else None,
        "display_name": user.name,
        "quick_stats": {
            "today_check_ins": today_completed,
            "active_habits": len(active_habits),
            "friends_count": friends_count,
        },
    }


@app.get("/api/habits")
@app.get("/habits")
def list_habits(
    search: str | None = Query(default=None, description="Filter habits by name"),
    frequency: str | None = Query(default=None, description="Filter habits by frequency (daily/weekly)"),
    db: Session = Depends(get_db),
):
    user = current_user(db)
    stmt = select(Habit).where(Habit.user_id == user.id)
    if search and search.strip():
        stmt = stmt.where(Habit.name.ilike(f"%{search.strip()}%"))
    if frequency and frequency.strip().lower() not in {"all", ""}:
        stmt = stmt.where(func.lower(Habit.frequency) == frequency.strip().lower())
    habits = db.scalars(stmt.order_by(Habit.id.asc())).all()
    return [habit_response(db, habit) for habit in habits]


@app.post("/api/habits", status_code=status.HTTP_201_CREATED)
@app.post("/habits", status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, db: Session = Depends(get_db)):
    user = current_user(db)
    existing = db.scalar(
        select(Habit).where(
            Habit.user_id == user.id,
            func.lower(Habit.name) == payload.name.lower(),
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"A habit named '{payload.name}' already exists")
    habit = Habit(user_id=user.id, **payload.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit_response(db, habit)


@app.get("/api/habits/{habit_id}")
@app.get("/habits/{habit_id}")
def get_habit(habit_id: int, db: Session = Depends(get_db)):
    user = current_user(db)
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit_response(db, habit)


@app.put("/api/habits/{habit_id}")
@app.put("/habits/{habit_id}")
def update_habit(habit_id: int, payload: HabitUpdate, db: Session = Depends(get_db)):
    user = current_user(db)
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        duplicate = db.scalar(
            select(Habit).where(
                Habit.user_id == user.id,
                Habit.id != habit_id,
                func.lower(Habit.name) == update_data["name"].lower(),
            )
        )
        if duplicate:
            raise HTTPException(status_code=400, detail=f"A habit named '{update_data['name']}' already exists")
        habit.name = update_data["name"]
    if "icon" in update_data and update_data["icon"] is not None:
        habit.icon = update_data["icon"]
    if "frequency" in update_data and update_data["frequency"] is not None:
        habit.frequency = update_data["frequency"]

    db.commit()
    db.refresh(habit)
    return habit_response(db, habit)


@app.delete("/api/habits/{habit_id}")
@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    user = current_user(db)
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit_name = habit.name
    db.delete(habit)
    db.commit()
    return {"status": "deleted", "id": habit_id, "name": habit_name, "message": f"Habit '{habit_name}' deleted"}


@app.post("/api/habits/{habit_id}/toggle")
@app.post("/habits/{habit_id}/toggle")
def toggle_habit_check_in(habit_id: int, db: Session = Depends(get_db)):
    user = current_user(db)
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_log = today_habit_log(db, habit.id)
    if existing_log:
        db.execute(
            delete(HabitLog).where(
                HabitLog.habit_id == habit.id,
                HabitLog.completed_at >= start,
            )
        )
        db.commit()
        completed_today = False
    else:
        db.add(HabitLog(habit_id=habit.id, completed_at=datetime.utcnow()))
        db.commit()
        completed_today = True

    db.refresh(habit)
    return {
        "status": "success",
        "habit_id": habit.id,
        "habit_name": habit.name,
        "completed_today": completed_today,
        "habit": habit_response(db, habit),
    }


@app.get("/api/check-ins/today")
@app.get("/check-ins/today")
def today_check_ins(db: Session = Depends(get_db)):
    user = current_user(db)
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
    completed_ids = [habit.id for habit in habits if today_habit_log(db, habit.id)]
    return {
        "date": datetime.utcnow().date(),
        "completed": len(completed_ids),
        "habit_ids": completed_ids,
    }


@app.post("/api/check-ins")
@app.post("/api/habits/log")
@app.post("/check-ins")
def create_check_in(payload: CheckInRequest, db: Session = Depends(get_db)):
    user = current_user(db)
    habit = db.scalar(select(Habit).where(Habit.id == payload.habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_log = today_habit_log(db, habit.id)
    if existing_log and payload.toggle:
        db.execute(
            delete(HabitLog).where(
                HabitLog.habit_id == habit.id,
                HabitLog.completed_at >= start,
            )
        )
        db.commit()
        completed_today = False
    elif not existing_log:
        db.add(HabitLog(habit_id=habit.id, completed_at=datetime.utcnow()))
        db.commit()
        completed_today = True
    else:
        completed_today = True

    db.refresh(habit)
    return {
        "status": "success",
        "habit_id": habit.id,
        "habit_name": habit.name,
        "completed_today": completed_today,
        "habit": habit_response(db, habit),
    }


@app.get("/api/influencers")
@app.get("/influencers")
def influencers(
    limit: int = Query(default=5, ge=1, le=50),
    habit: str | None = Query(default=None, description="Optional habit name filter"),
    db: Session = Depends(get_db),
):
    return influencer_rows(db, current_user(db), limit, habit_filter=habit)


@app.get("/api/recommendations/pairing")
@app.get("/recommendations/pairing")
def pairing_recommendation(
    habit: str | None = Query(default=None, description="Optional habit name filter"),
    db: Session = Depends(get_db),
):
    user = current_user(db)
    candidates = influencer_rows(db, user, 50, habit_filter=habit)
    if not candidates:
        return {
            "recommendation": None,
            "alternatives": [],
            "message": "Connect with a friend to receive a pairing recommendation.",
        }

    enriched = []
    for candidate in candidates:
        pairing_score = round(candidate["score"] * 0.6 + 0.4, 2)
        match_percentage = min(99, max(50, round(pairing_score * 100)))
        top_habit = candidate.get("top_habit") or "Running"
        schedule_days = min(5, max(3, round(candidate["score"] * 5)))
        enriched.append({
            **candidate,
            "pairing_score": pairing_score,
            "match_percentage": match_percentage,
            "similar_goal": top_habit,
            "schedule_match": f"{schedule_days}/5",
            "explanation": (
                f"Your recent {top_habit} activity overlaps closely with {candidate['name']}'s check-in window, "
                f"with an influence score of {candidate['score']:.2f} and {schedule_days}/5 aligned schedule days."
            ),
        })

    return {
        "recommendation": enriched[0],
        "alternatives": enriched,
    }


@app.get("/api/activity")
@app.get("/activity")
def recent_activity(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    user = current_user(db)
    network_user_ids = [user.id, *connected_friend_ids(db, user.id)]
    stmt = (
        select(HabitLog, Habit, User)
        .join(Habit, HabitLog.habit_id == Habit.id)
        .join(User, Habit.user_id == User.id)
        .where(User.id.in_(network_user_ids))
        .order_by(HabitLog.completed_at.desc())
        .limit(limit)
    )
    records = db.execute(stmt).all()
    items = []
    for log, habit, actor in records:
        is_self = actor.id == user.id
        actor_label = "You" if is_self else actor.name
        items.append({
            "id": log.id,
            "user_id": actor.id,
            "user_name": actor.name,
            "actor_label": actor_label,
            "is_current_user": is_self,
            "avatar_url": actor.avatar_url or f"https://ui-avatars.com/api/?name={actor.name}",
            "habit_id": habit.id,
            "habit_name": habit.name,
            "habit_icon": habit.icon,
            "completed_at": log.completed_at.isoformat(),
            "time_ago": format_relative_time(log.completed_at),
            "summary": f"{actor_label} completed {habit.name}",
        })
    return items