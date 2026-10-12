from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app import db
from app.models import LessonProgress, QuizAttempt, Lesson, Subject

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Overall summary stats for the dashboard header cards."""
    user_id = int(get_jwt_identity())

    completed_lessons = LessonProgress.query.filter_by(user_id=user_id, status="completed").count()
    total_lessons = LessonProgress.query.filter_by(user_id=user_id).count()
    quiz_attempts = QuizAttempt.query.filter_by(user_id=user_id).all()

    avg_quiz_score = (
        round(sum(a.score for a in quiz_attempts) / len(quiz_attempts), 1)
        if quiz_attempts else 0
    )

    total_time_seconds = (
        db.session.query(func.sum(LessonProgress.time_spent))
        .filter_by(user_id=user_id)
        .scalar() or 0
    )

    return jsonify({
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "completion_rate": round((completed_lessons / total_lessons * 100) if total_lessons else 0, 1),
        "avg_quiz_score": avg_quiz_score,
        "total_quiz_attempts": len(quiz_attempts),
        "total_learning_hours": round(total_time_seconds / 3600, 1),
    }), 200


@dashboard_bp.route("/weekly-progress", methods=["GET"])
@jwt_required()
def weekly_progress():
    """Lessons completed per day for the last 7 days."""
    user_id = int(get_jwt_identity())
    today = datetime.now(timezone.utc).date()

    data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = LessonProgress.query.filter(
            LessonProgress.user_id == user_id,
            LessonProgress.status == "completed",
            func.date(LessonProgress.completed_at) == day,
        ).count()
        data.append({"date": day.strftime("%Y-%m-%d"), "lessons_completed": count})

    return jsonify(data), 200


@dashboard_bp.route("/quiz-performance", methods=["GET"])
@jwt_required()
def quiz_performance():
    """Last 10 quiz scores with timestamps for bar chart."""
    user_id = int(get_jwt_identity())
    attempts = (
        QuizAttempt.query
        .filter_by(user_id=user_id)
        .order_by(QuizAttempt.attempted_at.desc())
        .limit(10)
        .all()
    )
    return jsonify([a.to_dict() for a in reversed(attempts)]), 200


@dashboard_bp.route("/topic-mastery", methods=["GET"])
@jwt_required()
def topic_mastery():
    """Per-subject lesson completion % for radar chart."""
    user_id = int(get_jwt_identity())
    subjects = Subject.query.all()
    result = []

    for subject in subjects:
        lesson_ids = [l.id for l in subject.lessons]
        if not lesson_ids:
            continue
        total = len(lesson_ids)
        completed = LessonProgress.query.filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.status == "completed",
        ).count()
        result.append({
            "subject": subject.name,
            "mastery_percent": round((completed / total) * 100, 1),
            "completed": completed,
            "total": total,
        })

    return jsonify(result), 200


@dashboard_bp.route("/achievements", methods=["GET"])
@jwt_required()
def achievements():
    """Compute and return unlocked achievement badges."""
    user_id = int(get_jwt_identity())

    completed = LessonProgress.query.filter_by(user_id=user_id, status="completed").count()
    quiz_count = QuizAttempt.query.filter_by(user_id=user_id).count()
    perfect_scores = QuizAttempt.query.filter_by(user_id=user_id).filter(QuizAttempt.score == 100).count()

    badges = []
    if completed >= 1:
        badges.append({"id": "first_lesson", "title": "First Step", "description": "Completed your first lesson!", "icon": "target"})
    if completed >= 5:
        badges.append({"id": "five_lessons", "title": "Getting Started", "description": "Completed 5 lessons!", "icon": "rocket"})
    if completed >= 20:
        badges.append({"id": "twenty_lessons", "title": "Dedicated Learner", "description": "Completed 20 lessons!", "icon": "book-open"})
    if quiz_count >= 1:
        badges.append({"id": "first_quiz", "title": "Quiz Taker", "description": "Attempted your first quiz!", "icon": "check-circle"})
    if perfect_scores >= 1:
        badges.append({"id": "perfect_score", "title": "Perfectionist", "description": "Scored 100% on a quiz!", "icon": "trophy"})

    return jsonify({"badges": badges, "total": len(badges)}), 200
