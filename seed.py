from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from database import Base
from models import ContagionScore, Friendship, Habit, HabitLog, User

DATABASE_PATH = Path(__file__).with_name("habit_tracker.db")
seed_engine = create_engine(f"sqlite:///{DATABASE_PATH}", connect_args={"check_same_thread": False})


def seed() -> None:
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()
    Base.metadata.create_all(bind=seed_engine)
    now = datetime.utcnow()

    with Session(seed_engine) as db:
        users = {
            name: User(name=name, avatar_url=f"https://ui-avatars.com/api/?name={name}")
            for name in ["Pallavi", "Arjun", "Meera", "Priya"]
        }
        db.add_all(users.values())
        db.flush()

        habits = {}
        for user in users.values():
            for habit_name in ["Running", "Meditation", "Reading"]:
                habit = Habit(user_id=user.id, name=habit_name, icon="activity", frequency="daily")
                db.add(habit)
                habits[(user.name, habit_name)] = habit
        db.flush()

        for day in range(30):
            for user_name in users:
                for habit_name in ["Running", "Meditation", "Reading"]:
                    # Pallavi and Arjun have 18 matching recent Running check-ins: 18 / 25 = 0.72.
                    should_log = habit_name != "Running" or day < 25
                    if user_name == "Arjun" and habit_name == "Running":
                        should_log = day < 18
                    if should_log:
                        db.add(HabitLog(
                            habit_id=habits[(user_name, habit_name)].id,
                            completed_at=now - timedelta(days=day, hours=day % 3),
                        ))

        db.add_all([
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Arjun"].id),
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Meera"].id),
            Friendship(user_id_1=users["Pallavi"].id, user_id_2=users["Priya"].id),
        ])
        db.add_all([
            ContagionScore(user_a_id=users["Pallavi"].id, user_b_id=users["Arjun"].id, habit_name="Running", score=0.72, updated_at=now),
            ContagionScore(user_a_id=users["Pallavi"].id, user_b_id=users["Meera"].id, habit_name="Running", score=0.68, updated_at=now),
            ContagionScore(user_a_id=users["Pallavi"].id, user_b_id=users["Priya"].id, habit_name="Running", score=0.61, updated_at=now),
        ])
        db.commit()
    print(f"Seeded {DATABASE_PATH}")


if __name__ == "__main__":
    seed()