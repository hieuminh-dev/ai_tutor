from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app import db
from app.models import User, QuizAttempt, LessonProgress, Lesson, AssessmentResult

recommendations_bp = Blueprint("recommendations", __name__)


def compute_recommendations(user_id: int) -> list:
    """
    Score all available lessons for the user based on:
    - Not yet completed
    - Matches user skill level
    - Related to weak topics from assessments
    Returns top 5 recommendations.
    """
    user = db.session.get(User, user_id)
    if not user:
        return []

    skill_level = user.profile.skill_level if user.profile else "Beginner"

    # Get completed lesson IDs
    completed_ids = [
        p.lesson_id for p in
        LessonProgress.query.filter_by(user_id=user_id, status="completed").all()
    ]

    # Get weak topics from latest assessment
    latest = (
        AssessmentResult.query
        .filter_by(user_id=user_id)
        .order_by(AssessmentResult.taken_at.desc())
        .first()
    )
    weak_topics = [t.lower() for t in (latest.weak_topics if latest else [])]

    # Fetch all lessons not yet completed
    candidates = Lesson.query.filter(
        Lesson.id.notin_(completed_ids),
        Lesson.difficulty == skill_level,
    ).all()

    # Score each lesson
    scored = []
    for lesson in candidates:
        score = 10  # base score
        title_lower = lesson.title.lower()
        for topic in weak_topics:
            if topic in title_lower:
                score += 20  # boost for weak topic match

        # Boost lower order_index (foundational lessons first)
        score -= lesson.order_index * 0.5

        scored.append({"lesson": lesson, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)

    return [
        {
            **item["lesson"].to_dict(),
            "recommendation_score": round(item["score"], 1),
            "subject_name": item["lesson"].subject.name if item["lesson"].subject else None,
        }
        for item in scored[:5]
    ]


@recommendations_bp.route("/", methods=["GET"])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    recs = compute_recommendations(user_id)
    return jsonify({"recommendations": recs, "count": len(recs)}), 200


@recommendations_bp.route("/performance", methods=["GET"])
@jwt_required()
def performance_prediction():
    """
    Predict student performance category using the trained ML model.
    Falls back to rule-based scoring if model not yet trained.
    """
    import os, joblib
    import numpy as np

    user_id = int(get_jwt_identity())

    # Compute features
    quiz_attempts = QuizAttempt.query.filter_by(user_id=user_id).all()
    quiz_scores = [a.score for a in quiz_attempts]
    avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0

    completed = LessonProgress.query.filter_by(user_id=user_id, status="completed").count()
    total = LessonProgress.query.filter_by(user_id=user_id).count()
    completion_rate = (completed / total * 100) if total > 0 else 0

    total_time = db.session.query(func.sum(LessonProgress.time_spent)).filter_by(user_id=user_id).scalar() or 0
    
    # Calculate cumulative distraction events for the user
    distraction_events = db.session.query(func.sum(LessonProgress.distraction_events)).filter_by(user_id=user_id).scalar() or 0

    features = np.array([[avg_quiz_score, completion_rate, total_time, len(quiz_attempts), distraction_events]])

    model_path = os.path.join("ml_models", "performance_predictor.pkl")
    # Fallback to alternative paths if needed (e.g. root or backend/ml_models)
    if not os.path.exists(model_path):
        model_path = os.path.join("..", "ml_models", "performance_predictor.pkl")

    if os.path.exists(model_path):
        try:
            model_bundle = joblib.load(model_path)
            clf = model_bundle["model"]
            le = model_bundle["label_encoder"]
            
            pred_encoded = clf.predict(features)[0]
            label = le.inverse_transform([pred_encoded])[0]
            
            proba = clf.predict_proba(features)[0]
            confidence = round(float(max(proba)) * 100, 1)
        except Exception as e:
            # Fallback to rule-based logic in case of load failure
            label = "Rule Fallback (Error)"
            confidence = None
    else:
        # Rule-based fallback
        if avg_quiz_score >= 70 and completion_rate >= 60:
            label = "High Success"
        elif avg_quiz_score >= 50 or completion_rate >= 40:
            label = "Moderate Success"
        else:
            label = "At-Risk"
        confidence = None

    return jsonify({
        "prediction": label,
        "confidence_percent": confidence,
        "features": {
            "avg_quiz_score": round(avg_quiz_score, 1),
            "completion_rate": round(completion_rate, 1),
            "total_time_seconds": int(total_time),
            "quiz_attempts": len(quiz_attempts),
            "distraction_events": int(distraction_events),
        },
    }), 200
