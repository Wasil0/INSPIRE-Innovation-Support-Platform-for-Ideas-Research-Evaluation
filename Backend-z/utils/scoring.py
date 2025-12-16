def calculate_match_scores(team_profiles, required_skills):
    required = set(skill.lower() for skill in required_skills)

    team_union = set()
    members = []

    for profile in team_profiles:
        skills = set(skill.lower() for skill in profile.get("skills", []))
        matched = skills & required

        team_union |= matched

        members.append({
            "user_id": profile["user_id"],
            "individual_score": len(matched),
            "matched_skills": list(matched)
        })

    team_score = round(
        (len(team_union) / len(required)) * 100, 2
    ) if required else 0

    return team_score, list(team_union), members
