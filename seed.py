"""
Deterministic demo data for the Micro-Habit Contagion Tracker.

The seed creates a richer demo network with:
- 7 people
- 6 habits
- 25 days of Pallavi's history
- Different temporal association strengths
- Real timestamps instead of hardcoded scores

Important:
These values represent observed temporal association, not causation.

Target associations:
- Arjun  -> Morning Run          -> 18/25 = 0.72
- Sneha  -> Read 20 Minutes      -> 16/25 = 0.64
- Rahul  -> Drink Water          -> 12/25 = 0.48
- Ananya -> Meditation           ->  9/25 = 0.36
- Vikram -> Study / Coding 1 Hour->  7/25 = 0.28
- Priya  -> No Phone After 10 PM ->  4/25 = 0.16
"""

from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from database import Base
from models import Friendship, Habit, HabitLog, User


DATABASE_PATH = Path(__file__).with_name("habit_tracker.db")

seed_engine = create_engine(
    f"sqlite:///{DATABASE_PATH}",
    connect_args={"check_same_thread": False},
)


# Habits
MORNING_RUN = "Morning Run"
READ_20 = "Read 20 Minutes"
DRINK_WATER = "Drink Water"
MEDITATION = "Meditation"
NO_PHONE = "No Phone After 10 PM"
STUDY = "Study / Coding 1 Hour"


def pallavi_times(now: datetime) -> list[datetime]:
    """
    Create 25 deterministic daily check-ins for Pallavi.
    """
    return [
        now - timedelta(days=day, hours=day % 3)
        for day in range(25)
    ]


def seed() -> None:
    # Recreate the database so every run produces the same demo.
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()

    Base.metadata.create_all(bind=seed_engine)

    now = datetime.utcnow()

    with Session(seed_engine) as db:

        # ---------------------------------------------------------
        # USERS
        # ---------------------------------------------------------
        user_names = [
            "Pallavi",
            "Arjun",
            "Sneha",
            "Rahul",
            "Ananya",
            "Vikram",
            "Priya",
        ]

        users = {
            name: User(
                name=name,
                avatar_url=f"https://ui-avatars.com/api/?name={name}",
            )
            for name in user_names
        }

        db.add_all(users.values())
        db.flush()

        # ---------------------------------------------------------
        # HABITS
        # ---------------------------------------------------------
        habits = {}

        def add_habit(user_name: str, habit_name: str) -> Habit:
            habit = Habit(
                user_id=users[user_name].id,
                name=habit_name,
                icon="activity",
                frequency="daily",
            )

            db.add(habit)
            habits[(user_name, habit_name)] = habit

            return habit

        # Pallavi tracks six habits for the richer demo.
        add_habit("Pallavi", MORNING_RUN)
        add_habit("Pallavi", READ_20)
        add_habit("Pallavi", DRINK_WATER)
        add_habit("Pallavi", MEDITATION)
        add_habit("Pallavi", NO_PHONE)
        add_habit("Pallavi", STUDY)

        # Each friend shares exactly one habit with Pallavi.
        add_habit("Arjun", MORNING_RUN)
        add_habit("Sneha", READ_20)
        add_habit("Rahul", DRINK_WATER)
        add_habit("Ananya", MEDITATION)
        add_habit("Vikram", STUDY)
        add_habit("Priya", NO_PHONE)

        db.flush()

        # ---------------------------------------------------------
        # HELPERS
        # ---------------------------------------------------------
        p_times = pallavi_times(now)

        def log_exact(user_name: str, habit_name: str, times: list[datetime]) -> None:
            habit = habits[(user_name, habit_name)]

            for timestamp in times:
                db.add(
                    HabitLog(
                        habit_id=habit.id,
                        completed_at=timestamp,
                    )
                )

        def log_for_pallavi_indices(
            user_name: str,
            habit_name: str,
            indices: list[int],
        ) -> None:
            """
            Put the friend's check-in 12 hours BEFORE the corresponding
            Pallavi check-in.

            Therefore Pallavi's check-in occurs within the next 48 hours,
            creating a valid directional temporal association.
            """
            times = [
                p_times[index] - timedelta(hours=12)
                for index in indices
            ]

            log_exact(user_name, habit_name, times)

        def log_unrelated(
            user_name: str,
            habit_name: str,
            days: list[int],
        ) -> None:
            """
            Create older timestamps that do not overlap with Pallavi's
            48-hour observation window.
            """
            times = [
                now - timedelta(days=day)
                for day in days
            ]

            log_exact(user_name, habit_name, times)

        # ---------------------------------------------------------
        # PALLAVI'S HISTORY
        # ---------------------------------------------------------
        # 25 observations for every habit.
        all_indices = list(range(25))

        log_exact("Pallavi", MORNING_RUN, p_times)
        log_exact("Pallavi", READ_20, p_times)
        log_exact("Pallavi", DRINK_WATER, p_times)
        log_exact("Pallavi", MEDITATION, p_times)
        log_exact("Pallavi", NO_PHONE, p_times)
        log_exact("Pallavi", STUDY, p_times)

        # ---------------------------------------------------------
        # FRIEND ASSOCIATIONS
        # ---------------------------------------------------------

        # Arjun:
        # 18 / 25 = 0.72
        log_for_pallavi_indices(
            "Arjun",
            MORNING_RUN,
            list(range(18)),
        )

        # Sneha:
        # 16 / 25 = 0.64
        log_for_pallavi_indices(
            "Sneha",
            READ_20,
            [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 23, 24, 1],
        )

        # Rahul:
        # 12 / 25 = 0.48
        log_for_pallavi_indices(
            "Rahul",
            DRINK_WATER,
            [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23],
        )

        # Ananya:
        # 9 / 25 = 0.36
        log_for_pallavi_indices(
            "Ananya",
            MEDITATION,
            [2, 5, 8, 11, 14, 17, 20, 22, 24],
        )

        # Vikram:
        # 7 / 25 = 0.28
        log_for_pallavi_indices(
            "Vikram",
            STUDY,
            [0, 4, 8, 12, 16, 20, 24],
        )

        # Priya:
        # 4 / 25 = 0.16
        log_for_pallavi_indices(
            "Priya",
            NO_PHONE,
            [3, 9, 15, 21],
        )

        # ---------------------------------------------------------
        # EXTRA NON-OVERLAPPING HISTORY
        # ---------------------------------------------------------
        # Adds some realistic history without increasing the
        # temporal association score.
        log_unrelated(
            "Arjun",
            MORNING_RUN,
            [40, 45],
        )

        log_unrelated(
            "Sneha",
            READ_20,
            [42, 48],
        )

        log_unrelated(
            "Rahul",
            DRINK_WATER,
            [38, 46],
        )

        log_unrelated(
            "Ananya",
            MEDITATION,
            [41, 47],
        )

        log_unrelated(
            "Vikram",
            STUDY,
            [39, 50],
        )

        log_unrelated(
            "Priya",
            NO_PHONE,
            [44, 51],
        )

        # ---------------------------------------------------------
        # FRIENDSHIPS
        # ---------------------------------------------------------
        db.add_all(
            [
                Friendship(
                    user_id_1=users["Pallavi"].id,
                    user_id_2=users["Arjun"].id,
                ),
                Friendship(
                    user_id_1=users["Pallavi"].id,
                    user_id_2=users["Sneha"].id,
                ),
                Friendship(
                    user_id_1=users["Pallavi"].id,
                    user_id_2=users["Rahul"].id,
                ),
                Friendship(
                    user_id_1=users["Pallavi"].id,
                    user_id_2=users["Ananya"].id,
                ),
                Friendship(
                    user_id_1=users["Pallavi"].id,
                    user_id_2=users["Vikram"].id,
                ),
                Friendship(
                    user_id_1=users["Pallavi"].id,
                    user_id_2=users["Priya"].id,
                ),
            ]
        )

        db.commit()

    print(f"Seeded {DATABASE_PATH}")


if __name__ == "__main__":
    seed()