from db.db import db

def create_indexes():
    interested = db["interested_teams"]

    interested.create_index(
        [("project_id", 1), ("team_id", 1)],
        unique=True
    )

    interested.create_index(
        [("advisor_id", 1), ("created_at", -1)]
    )

    interested.create_index(
        [("team_id", 1)]
    )
    