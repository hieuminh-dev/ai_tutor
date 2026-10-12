from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.assessment import assessment_bp
    from app.routes.learning_path import learning_path_bp
    from app.routes.chat import chat_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.lessons import lessons_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(assessment_bp, url_prefix="/api/assessment")
    app.register_blueprint(learning_path_bp, url_prefix="/api/learning-path")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(lessons_bp, url_prefix="/api/lessons")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "AI Learning Platform API is running"}, 200

    return app
