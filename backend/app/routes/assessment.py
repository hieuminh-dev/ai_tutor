from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Subject, QuizQuestion, AssessmentResult

assessment_bp = Blueprint("assessment", __name__)

SCORE_TO_BAND = {
    (0, 40): "Beginner",
    (40, 70): "Intermediate",
    (70, 101): "Advanced",
}


def get_skill_band(score: float) -> str:
    for (low, high), band in SCORE_TO_BAND.items():
        if low <= score < high:
            return band
    return "Beginner"


@assessment_bp.route("/subjects", methods=["GET"])
@jwt_required()
def get_subjects():
    """Return all available assessment subjects."""
    subjects = Subject.query.all()
    return jsonify([s.to_dict() for s in subjects]), 200


@assessment_bp.route("/start/<int:subject_id>", methods=["GET"])
@jwt_required()
def start_assessment(subject_id):
    """Fetch 10 assessment questions for a subject (no correct answers exposed)."""
    subject = db.session.get(Subject, subject_id)
    if not subject:
        return jsonify({"error": "Subject not found."}), 404

    # Pull questions from quizzes belonging to lessons in this subject
    from app.models import Lesson, Quiz
    lesson_ids = [l.id for l in subject.lessons]
    quiz_ids = [q.id for q in Quiz.query.filter(Quiz.lesson_id.in_(lesson_ids)).all()]
    questions = (
        QuizQuestion.query
        .filter(QuizQuestion.quiz_id.in_(quiz_ids))
        .limit(10)
        .all()
    )

    return jsonify({
        "subject": subject.to_dict(),
        "questions": [q.to_dict() for q in questions],
        "total": len(questions),
    }), 200


@assessment_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_assessment():
    """Score the submitted answers and store results."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    subject_id = data.get("subject_id")
    answers = data.get("answers", {})  # {"question_id": "selected_option_index"}

    if not subject_id or not answers:
        return jsonify({"error": "subject_id and answers are required."}), 400

    # Fetch questions and grade
    question_ids = [int(k) for k in answers.keys()]
    questions = QuizQuestion.query.filter(QuizQuestion.id.in_(question_ids)).all()

    correct = 0
    strong_topics = []
    weak_topics = []
    topic_results = {}

    for q in questions:
        selected = str(answers.get(str(q.id), ""))
        is_correct = selected == q.correct_answer
        if is_correct:
            correct += 1
        quiz_title = q.quiz.title if q.quiz else "General"
        topic_results.setdefault(quiz_title, {"correct": 0, "total": 0})
        topic_results[quiz_title]["total"] += 1
        if is_correct:
            topic_results[quiz_title]["correct"] += 1

    total = len(questions) or 1
    score = (correct / total) * 100

    for topic, stats in topic_results.items():
        ratio = stats["correct"] / max(stats["total"], 1)
        if ratio >= 0.7:
            strong_topics.append(topic)
        else:
            weak_topics.append(topic)

    skill_band = get_skill_band(score)

    result = AssessmentResult(
        user_id=user_id,
        subject_id=subject_id,
        score=round(score, 2),
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        skill_band=skill_band,
    )
    db.session.add(result)
    db.session.commit()

    return jsonify({
        "score": round(score, 2),
        "correct": correct,
        "total": total,
        "skill_band": skill_band,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "result_id": result.id,
    }), 200


@assessment_bp.route("/results", methods=["GET"])
@jwt_required()
def get_results():
    """Get latest assessment results for the logged-in user."""
    user_id = int(get_jwt_identity())
    results = (
        AssessmentResult.query
        .filter_by(user_id=user_id)
        .order_by(AssessmentResult.taken_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in results]), 200
