import os
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, LearningPath, AssessmentResult

learning_path_bp = Blueprint("learning_path", __name__)

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")


def get_groq_client():
    from groq import Groq
    return Groq(api_key=os.environ.get("GROQ_API_KEY", ""))


def generate_path_with_groq(skill_level: str, learning_goal: str, weak_topics: list, strong_topics: list) -> dict:
    client = get_groq_client()
    system_prompt = (
        "You are an expert educational curriculum designer. "
        "Your task is to generate a structured personalized learning roadmap in JSON format. "
        "Output only valid JSON — no extra text, no markdown."
    )
    user_prompt = f"""
Generate a personalized learning roadmap for a student with the following profile:
- Skill Level: {skill_level}
- Learning Goal: {learning_goal}
- Weak Topics (needs focus): {', '.join(weak_topics) if weak_topics else 'None identified yet'}
- Strong Topics (already knows): {', '.join(strong_topics) if strong_topics else 'None identified yet'}

Return a JSON object with this exact structure:
{{
  "goal": "string",
  "total_phases": number,
  "estimated_weeks": number,
  "phases": [
    {{
      "phase_number": 1,
      "phase_title": "string",
      "description": "string",
      "estimated_weeks": number,
      "topics": [
        {{
          "title": "string",
          "description": "string",
          "difficulty": "Beginner|Intermediate|Advanced",
          "estimated_hours": number,
          "resources": ["string"]
        }}
      ]
    }}
  ]
}}
"""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=2048,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content
    return json.loads(raw)


@learning_path_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_path():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    profile = user.profile
    skill_level = profile.skill_level if profile else "Beginner"
    learning_goal = profile.learning_goal if profile else "Learn programming"

    # Pull latest assessment data
    latest_assessment = (
        AssessmentResult.query
        .filter_by(user_id=user_id)
        .order_by(AssessmentResult.taken_at.desc())
        .first()
    )
    weak_topics = latest_assessment.weak_topics if latest_assessment else []
    strong_topics = latest_assessment.strong_topics if latest_assessment else []

    # Allow manual overrides from request body
    data = request.get_json() or {}
    skill_level = data.get("skill_level", skill_level)
    learning_goal = data.get("learning_goal", learning_goal)
    weak_topics = data.get("weak_topics", weak_topics)
    strong_topics = data.get("strong_topics", strong_topics)

    try:
        path_data = generate_path_with_groq(skill_level, learning_goal, weak_topics, strong_topics)
    except Exception as e:
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500

    # Save to DB
    learning_path = LearningPath(user_id=user_id, generated_path=path_data)
    db.session.add(learning_path)
    db.session.commit()

    return jsonify(learning_path.to_dict()), 201


@learning_path_bp.route("/", methods=["GET"])
@jwt_required()
def get_path():
    user_id = int(get_jwt_identity())
    path = (
        LearningPath.query
        .filter_by(user_id=user_id)
        .order_by(LearningPath.created_at.desc())
        .first()
    )
    if not path:
        return jsonify({"message": "No learning path generated yet."}), 404
    return jsonify(path.to_dict()), 200


@learning_path_bp.route("/regenerate", methods=["POST"])
@jwt_required()
def regenerate_path():
    """Force regenerate a new path (e.g. after significant progress)."""
    return generate_path()
