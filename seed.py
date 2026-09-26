"""
Deterministic demo data for the Micro-Habit Contagion Tracker.

The story this seed tells:
  - Pallavi (the current user) tracks three habits: Morning Run,
    Read 20 Minutes, and Drink Water.
  - Arjun also runs in the mornings, on a schedule that overlaps heavily
    with Pallavi's -> STRONG temporal association (18/25 = 0.72).
  - Sneha also reads, on a schedule that overlaps moderately -> MEDIUM
    temporal association (10/25 = 0.40).
  - Rahul also drinks water, but their check-ins rarely land in the same
    48-hour window -> WEAK temporal association (5/25 = 0.20).
  - Ananya tracks a habit Pallavi doesn't (No Phone After 10 PM). She's
    connected as a friend but shares no habit with Pallavi, so
    calculate_association() correctly returns 0 for her -- influencer_rows()
    then drops her from /api/influencers entirely (no row, no edge).

No scores are hardcoded anywhere in this file. Every relationship above is a
*consequence* of the HabitLog timestamps seeded here, computed at request
time by main.py's calculate_association() using the directional 48-hour
temporal-association rule.
"""

from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from database import Base
from models import Friendship, Habit, HabitLog, User

DATABASE_PATH = Path(__file__).with_name("habit_tracker.db")
seed_engine = create_engine(f"sqlite:///{DATABASE_PATH}", connect_args={"check_same_thread": False})

MORNING_RUN = "Morning Run"
READ_20 = "Read 20 Minutes"
DRINK_WATER = "Drink Water"
NO_PHONE = "No Phone After 10 PM"


def _log_times(days: list[int], now: datetime) -> list[datetime]:
    # Small, deterministic hour jitter so timestamps aren't all identical,
    # mirroring how real check-ins land at slightly different times of day.
    return [now - timedelta(days=day, hours=day % 3) for day in days]


def seed() -> None:
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()
    Base.metadata.create_all(bind=seed_engine)
    now = datetime.utcnow()

    with Session(seed_engine) as db:
        users = {
            name: User(name=name, avatar_url=f"https://ui-avatars.com/api/?name={name}")
            for name in ["Pallavi", "Arjun", "Sneha", "Rahul", "Ananya"]
        }
        db.add_all(users.values())
        db.flush()

        habits = {}

        def add_habit(user_name: str, habit_name: str) -> Habit:
            habit = Habit(user_id=users[user_name].id, name=habit_name, icon="activity", frequency="daily")
            db.add(habit)
            habits[(user_name, habit_name)] = habit
            return habit

        # Pallavi's own habit stack (1-3 habits, per the product concept).
        add_habit("Pallavi", MORNING_RUN)
        add_habit("Pallavi", READ_20)
        add_habit("Pallavi", DRINK_WATER)

        # Friends each track one overlapping habit (plus Ananya, who doesn't).
        add_habit("Arjun", MORNING_RUN)
        add_habit("Sneha", READ_20)
        add_habit("Rahul", DRINK_WATER)
        add_habit("Ananya", NO_PHONE)
        db.flush()

        def log(user_name: str, habit_name: str, days: list[int]) -> None:
            habit = habits[(user_name, habit_name)]
            for t in _log_times(days, now):
                db.add(HabitLog(habit_id=habit.id, completed_at=t))

        # Pallavi checks in on all three of her habits for the last 25 days --
        # a dense, realistic daily-habit history. This 25 is the denominator
        # ("observed_instances") for every association below.
        pallavi_days = list(range(25))
        log("Pallavi", MORNING_RUN, pallavi_days)
        log("Pallavi", READ_20, pallavi_days)
        log("Pallavi", DRINK_WATER, pallavi_days)

        # Arjun runs on 18 of the last 25 days, all of which land at/after
        # his corresponding Pallavi log within the 48h window
        # -> STRONG association: 18/25 = 0.72.
        log("Arjun", MORNING_RUN, list(range(18)))

        # Sneha reads on 4 scattered days; the directional 48h window around
        # each of her logs covers 10 of Pallavi's 25 days
        # -> MEDIUM association: 10/25 = 0.40.
        log("Sneha", READ_20, [2, 9, 16, 23])

        # Rahul drinks water on just 2 days late in the window, covering 5 of
        # Pallavi's 25 days -> WEAK association: 5/25 = 0.20.
        log("Rahul", DRINK_WATER, [20, 24])

        # Ananya has her own habit and history, but it isn't one Pallavi
        # tracks, so there is nothing to associate -- no score, no edge.
        log("Ananya", NO_PHONE, [1, 4, 8, 12, 16, 20])

        # Pallavi is connected to all four -- the API decides what to *show*
        # based on real association data, not on who's merely a friend.
        db.add_all([
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Arjun"].id),
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Sneha"].id),
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Rahul"].id),
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Ananya"].id),
        ])

        db.commit()
    print(f"Seeded {DATABASE_PATH}")


if __name__ == "__main__":
    seed()
