import re
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import User, LearningProfile

auth_bp = Blueprint("auth", __name__)


def is_valid_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return re.match(pattern, email) is not None


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email address."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        education_level=data.get("education_level"),
    )
    db.session.add(user)
    db.session.flush()  # get user.id before commit

    profile = LearningProfile(
        user_id=user.id,
        subjects_of_interest=data.get("subjects_of_interest", []),
        skill_level=data.get("skill_level", "Beginner"),
        learning_goal=data.get("learning_goal", ""),
    )
    db.session.add(profile)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    result = user.to_dict()
    if user.profile:
        result["profile"] = user.profile.to_dict()
    return jsonify(result), 200
