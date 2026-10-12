from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Lesson, LessonProgress, Quiz, QuizQuestion, QuizAttempt

lessons_bp = Blueprint("lessons", __name__)


@lessons_bp.route("/subject/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_subject_lessons(subject_id):
    """Retrieve all lessons for a subject, with user-specific progress."""
    user_id = int(get_jwt_identity())
    lessons = Lesson.query.filter_by(subject_id=subject_id).order_by(Lesson.order_index).all()

    result = []
    for lesson in lessons:
        progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson.id).first()
        progress_dict = progress.to_dict() if progress else {
            "status": "not_started",
            "time_spent": 0,
            "distraction_events": 0,
            "completed_at": None
        }
        
        # Check if this lesson has a quiz
        quiz = Quiz.query.filter_by(lesson_id=lesson.id).first()
        has_quiz = quiz is not None
        
        lesson_data = lesson.to_dict()
        lesson_data["progress"] = progress_dict
        lesson_data["has_quiz"] = has_quiz
        if quiz:
            lesson_data["quiz_id"] = quiz.id
            # Fetch user's best score for this quiz
            best_attempt = (
                QuizAttempt.query
                .filter_by(user_id=user_id, quiz_id=quiz.id)
                .order_by(QuizAttempt.score.desc())
                .first()
            )
            lesson_data["best_score"] = best_attempt.score if best_attempt else None
            
        result.append(lesson_data)

    return jsonify(result), 200


@lessons_bp.route("/<int:lesson_id>/start", methods=["POST"])
@jwt_required()
def start_lesson(lesson_id):
    """Mark a lesson as in_progress."""
    user_id = int(get_jwt_identity())
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found."}), 404

    progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not progress:
        progress = LessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            status="in_progress",
            time_spent=0,
            distraction_events=0
        )
        db.session.add(progress)
    elif progress.status == "not_started":
        progress.status = "in_progress"

    db.session.commit()
    return jsonify(progress.to_dict()), 200


@lessons_bp.route("/<int:lesson_id>/distract", methods=["POST"])
@jwt_required()
def track_distraction(lesson_id):
    """Increment the distraction event count (e.g. tab-switching) for a lesson progress."""
    user_id = int(get_jwt_identity())
    progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not progress:
        # Create progress record if it doesn't exist yet
        progress = LessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            status="in_progress",
            time_spent=0,
            distraction_events=1
        )
        db.session.add(progress)
    else:
        progress.distraction_events += 1

    db.session.commit()
    return jsonify(progress.to_dict()), 200


@lessons_bp.route("/<int:lesson_id>/complete", methods=["POST"])
@jwt_required()
def complete_lesson(lesson_id):
    """Mark a lesson as completed and update time spent."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    additional_time = int(data.get("time_spent", 0))  # seconds

    progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not progress:
        progress = LessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            status="completed",
            time_spent=additional_time,
            distraction_events=0,
            completed_at=datetime.now(timezone.utc)
        )
        db.session.add(progress)
    else:
        progress.status = "completed"
        progress.time_spent += additional_time
        progress.completed_at = datetime.now(timezone.utc)

    db.session.commit()
    return jsonify(progress.to_dict()), 200


@lessons_bp.route("/<int:lesson_id>/quiz", methods=["GET"])
@jwt_required()
def get_lesson_quiz(lesson_id):
    """Retrieve quiz questions for a lesson (excludes correct answers)."""
    quiz = Quiz.query.filter_by(lesson_id=lesson_id).first()
    if not quiz:
        return jsonify({"error": "No quiz found for this lesson."}), 404

    questions = QuizQuestion.query.filter_by(quiz_id=quiz.id).all()
    # Omit correct answers for security
    questions_list = []
    for q in questions:
        q_dict = q.to_dict()
        questions_list.append(q_dict)

    return jsonify({
        "quiz_id": quiz.id,
        "title": quiz.title,
        "questions": questions_list
    }), 200


@lessons_bp.route("/<int:lesson_id>/quiz/submit", methods=["POST"])
@jwt_required()
def submit_lesson_quiz(lesson_id):
    """Grade and submit the quiz attempt for a lesson."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    answers = data.get("answers", {})  # {"question_id": "selected_option_index"}
    time_taken = int(data.get("time_taken", 0))

    quiz = Quiz.query.filter_by(lesson_id=lesson_id).first()
    if not quiz:
        return jsonify({"error": "Quiz not found."}), 404

    questions = QuizQuestion.query.filter_by(quiz_id=quiz.id).all()
    
    correct = 0
    total = len(questions)
    
    for q in questions:
        selected = str(answers.get(str(q.id), ""))
        if selected == q.correct_answer:
            correct += 1

    score = (correct / total * 100) if total > 0 else 0

    attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz.id,
        score=round(score, 1),
        time_taken=time_taken,
        answers=answers
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        "score": round(score, 1),
        "correct": correct,
        "total": total,
        "attempt_id": attempt.id
    }), 200
