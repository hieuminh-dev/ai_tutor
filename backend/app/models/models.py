from datetime import datetime, timezone
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    education_level = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    profile = db.relationship("LearningProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    quiz_attempts = db.relationship("QuizAttempt", backref="user", cascade="all, delete-orphan")
    lesson_progresses = db.relationship("LessonProgress", backref="user", cascade="all, delete-orphan")
    learning_paths = db.relationship("LearningPath", backref="user", cascade="all, delete-orphan")
    assessment_results = db.relationship("AssessmentResult", backref="user", cascade="all, delete-orphan")
    chat_messages = db.relationship("ChatMessage", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "education_level": self.education_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LearningProfile(db.Model):
    __tablename__ = "learning_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    subjects_of_interest = db.Column(db.JSON, default=list)   # ["Python", "Data Science"]
    skill_level = db.Column(db.String(50), default="Beginner") # Beginner / Intermediate / Advanced
    learning_goal = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subjects_of_interest": self.subjects_of_interest or [],
            "skill_level": self.skill_level,
            "learning_goal": self.learning_goal,
        }


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=True)  # e.g., "Programming", "Math"
    icon = db.Column(db.String(50), nullable=True)        # Emoji or icon name

    lessons = db.relationship("Lesson", backref="subject", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "icon": self.icon,
        }


class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(50), default="Beginner")  # Beginner / Intermediate / Advanced
    order_index = db.Column(db.Integer, default=0)
    estimated_minutes = db.Column(db.Integer, default=30)

    quizzes = db.relationship("Quiz", backref="lesson", cascade="all, delete-orphan")
    progresses = db.relationship("LessonProgress", backref="lesson", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "title": self.title,
            "content": self.content,
            "difficulty": self.difficulty,
            "order_index": self.order_index,
            "estimated_minutes": self.estimated_minutes,
        }


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)

    questions = db.relationship("QuizQuestion", backref="quiz", cascade="all, delete-orphan")
    attempts = db.relationship("QuizAttempt", backref="quiz", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "title": self.title,
        }


class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)    # ["Option A", "Option B", "Option C", "Option D"]
    correct_answer = db.Column(db.String(10), nullable=False)  # "A", "B", "C", or "D"
    explanation = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "question_text": self.question_text,
            "options": self.options,
            # Note: correct_answer is omitted when sending to frontend during quiz
        }


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    score = db.Column(db.Float, nullable=False)          # 0-100
    time_taken = db.Column(db.Integer, nullable=True)    # seconds
    answers = db.Column(db.JSON, nullable=True)          # {"question_id": "selected_answer"}
    attempted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quiz_id": self.quiz_id,
            "score": self.score,
            "time_taken": self.time_taken,
            "attempted_at": self.attempted_at.isoformat() if self.attempted_at else None,
        }


class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)
    status = db.Column(db.String(30), default="not_started")  # not_started / in_progress / completed
    time_spent = db.Column(db.Integer, default=0)             # seconds
    distraction_events = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (db.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "lesson_id": self.lesson_id,
            "status": self.status,
            "time_spent": self.time_spent,
            "distraction_events": self.distraction_events,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class LearningPath(db.Model):
    __tablename__ = "learning_paths"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    generated_path = db.Column(db.JSON, nullable=False)   # Full AI-generated roadmap JSON
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "generated_path": self.generated_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AssessmentResult(db.Model):
    __tablename__ = "assessment_results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    score = db.Column(db.Float, nullable=False)             # 0-100
    weak_topics = db.Column(db.JSON, default=list)
    strong_topics = db.Column(db.JSON, default=list)
    skill_band = db.Column(db.String(50), default="Beginner")
    taken_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "score": self.score,
            "weak_topics": self.weak_topics or [],
            "strong_topics": self.strong_topics or [],
            "skill_band": self.skill_band,
            "taken_at": self.taken_at.isoformat() if self.taken_at else None,
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(20), nullable=False)   # "user" or "assistant"
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "message": self.message,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
