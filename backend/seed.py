"""
Database seed script — populates subjects, lessons, quizzes, and questions.
Run from the backend directory:
    python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from run import app
from app import db
from app.models import Subject, Lesson, Quiz, QuizQuestion

SEED_DATA = [
    {
        "name": "Python Programming",
        "description": "Learn Python from basics to advanced concepts.",
        "category": "Programming",
        "icon": "terminal",
        "lessons": [
            {
                "title": "Python Basics & Variables",
                "difficulty": "Beginner",
                "order_index": 1,
                "estimated_minutes": 30,
                "content": "Python is a high-level, interpreted programming language. Variables store data values. Python has no command to declare a variable — it is created when you assign a value to it.",
                "quiz_title": "Python Basics Quiz",
                "questions": [
                    {
                        "question_text": "Which of the following is a valid Python variable name?",
                        "options": ["2variable", "_my_var", "my-var", "class"],
                        "correct_answer": "B",
                        "explanation": "_my_var is valid. Variable names can start with underscore or letter, not digit or hyphen."
                    },
                    {
                        "question_text": "What is the output of: print(type(42))?",
                        "options": ["<class 'str'>", "<class 'float'>", "<class 'int'>", "<class 'number'>"],
                        "correct_answer": "C",
                        "explanation": "42 is an integer, so type() returns <class 'int'>."
                    },
                    {
                        "question_text": "Which keyword is used to define a function in Python?",
                        "options": ["function", "define", "def", "func"],
                        "correct_answer": "C",
                        "explanation": "The 'def' keyword is used to define functions in Python."
                    },
                ],
            },
            {
                "title": "Loops & Control Flow",
                "difficulty": "Beginner",
                "order_index": 2,
                "estimated_minutes": 40,
                "content": "Python supports for loops, while loops, if/elif/else conditions, and loop control with break and continue.",
                "quiz_title": "Loops Quiz",
                "questions": [
                    {
                        "question_text": "How many times does this loop run? for i in range(5): print(i)",
                        "options": ["4", "5", "6", "Infinite"],
                        "correct_answer": "B",
                        "explanation": "range(5) generates [0,1,2,3,4] — 5 iterations."
                    },
                    {
                        "question_text": "Which statement exits a loop immediately?",
                        "options": ["continue", "pass", "exit", "break"],
                        "correct_answer": "D",
                        "explanation": "'break' exits the loop immediately."
                    },
                ],
            },
            {
                "title": "Functions & OOP",
                "difficulty": "Intermediate",
                "order_index": 3,
                "estimated_minutes": 60,
                "content": "Functions encapsulate reusable code. OOP organizes code using classes and objects with attributes and methods.",
                "quiz_title": "Functions & OOP Quiz",
                "questions": [
                    {
                        "question_text": "What does 'self' refer to inside a class method?",
                        "options": ["The class itself", "The current instance", "The parent class", "A global variable"],
                        "correct_answer": "B",
                        "explanation": "'self' refers to the current instance of the class."
                    },
                    {
                        "question_text": "What is the special method called when a class is instantiated?",
                        "options": ["__start__", "__init__", "__new__", "__create__"],
                        "correct_answer": "B",
                        "explanation": "__init__ is the constructor method called on object creation."
                    },
                ],
            },
        ],
    },
    {
        "name": "Data Science",
        "description": "Learn data analysis, visualization, and machine learning.",
        "category": "Data",
        "icon": "bar-chart",
        "lessons": [
            {
                "title": "NumPy & Pandas Basics",
                "difficulty": "Beginner",
                "order_index": 1,
                "estimated_minutes": 45,
                "content": "NumPy provides multi-dimensional arrays. Pandas provides DataFrames for tabular data manipulation.",
                "quiz_title": "NumPy & Pandas Quiz",
                "questions": [
                    {
                        "question_text": "Which Pandas method shows the first 5 rows of a DataFrame?",
                        "options": ["df.tail()", "df.show()", "df.head()", "df.first()"],
                        "correct_answer": "C",
                        "explanation": "df.head() displays the first 5 rows by default."
                    },
                    {
                        "question_text": "How do you create a NumPy array from a list [1, 2, 3]?",
                        "options": ["np.create([1,2,3])", "np.array([1,2,3])", "np.list([1,2,3])", "np.make([1,2,3])"],
                        "correct_answer": "B",
                        "explanation": "np.array() converts a list to a NumPy array."
                    },
                ],
            },
        ],
    },
    {
        "name": "Web Development",
        "description": "HTML, CSS, JavaScript, and modern frameworks.",
        "category": "Web",
        "icon": "globe",
        "lessons": [
            {
                "title": "HTML & CSS Fundamentals",
                "difficulty": "Beginner",
                "order_index": 1,
                "estimated_minutes": 30,
                "content": "HTML structures web pages using tags. CSS styles elements using selectors, properties, and values.",
                "quiz_title": "HTML & CSS Quiz",
                "questions": [
                    {
                        "question_text": "Which HTML tag is used for the largest heading?",
                        "options": ["<h6>", "<header>", "<h1>", "<head>"],
                        "correct_answer": "C",
                        "explanation": "<h1> is the largest heading tag in HTML."
                    },
                    {
                        "question_text": "Which CSS property changes the text color?",
                        "options": ["font-color", "text-color", "color", "foreground"],
                        "correct_answer": "C",
                        "explanation": "The CSS 'color' property sets the text color."
                    },
                ],
            },
        ],
    },
]


def seed():
    with app.app_context():
        print("Creating tables if they don't exist...")
        db.create_all()
        print("Seeding database...")

        # Clear existing seed data
        QuizQuestion.query.delete()
        Quiz.query.delete()
        Lesson.query.delete()
        Subject.query.delete()
        db.session.commit()

        for subject_data in SEED_DATA:
            subject = Subject(
                name=subject_data["name"],
                description=subject_data["description"],
                category=subject_data["category"],
                icon=subject_data["icon"],
            )
            db.session.add(subject)
            db.session.flush()

            for lesson_data in subject_data["lessons"]:
                lesson = Lesson(
                    subject_id=subject.id,
                    title=lesson_data["title"],
                    content=lesson_data["content"],
                    difficulty=lesson_data["difficulty"],
                    order_index=lesson_data["order_index"],
                    estimated_minutes=lesson_data["estimated_minutes"],
                )
                db.session.add(lesson)
                db.session.flush()

                quiz = Quiz(lesson_id=lesson.id, title=lesson_data["quiz_title"])
                db.session.add(quiz)
                db.session.flush()

                for i, q_data in enumerate(lesson_data["questions"]):
                    question = QuizQuestion(
                        quiz_id=quiz.id,
                        question_text=q_data["question_text"],
                        options=q_data["options"],
                        correct_answer=q_data["correct_answer"],
                        explanation=q_data.get("explanation", ""),
                    )
                    db.session.add(question)

        db.session.commit()
        print("✅ Database seeded successfully!")
        print(f"   Subjects: {Subject.query.count()}")
        print(f"   Lessons:  {Lesson.query.count()}")
        print(f"   Quizzes:  {Quiz.query.count()}")
        print(f"   Questions:{QuizQuestion.query.count()}")


if __name__ == "__main__":
    seed()
