from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, LearningProfile

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json()

    # Update user fields
    if "name" in data:
        user.name = data["name"].strip()
    if "education_level" in data:
        user.education_level = data["education_level"]

    # Update or create profile
    profile = user.profile
    if not profile:
        profile = LearningProfile(user_id=user_id)
        db.session.add(profile)

    if "subjects_of_interest" in data:
        profile.subjects_of_interest = data["subjects_of_interest"]
    if "skill_level" in data:
        profile.skill_level = data["skill_level"]
    if "learning_goal" in data:
        profile.learning_goal = data["learning_goal"]

    db.session.commit()

    result = user.to_dict()
    result["profile"] = profile.to_dict()
    return jsonify(result), 200
