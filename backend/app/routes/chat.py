import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, ChatMessage

chat_bp = Blueprint("chat", __name__)

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
HISTORY_LIMIT = 10  # Number of past messages to include for context


def get_groq_client():
    from groq import Groq
    return Groq(api_key=os.environ.get("GROQ_API_KEY", ""))


def build_system_prompt(user: User, context: str = None) -> str:
    profile = user.profile
    skill = profile.skill_level if profile else "Beginner"
    goal = profile.learning_goal if profile else "learning"
    subjects = ", ".join(profile.subjects_of_interest or []) if profile else "various topics"

    prompt = (
        f"You are an expert, friendly AI tutor on an adaptive learning platform. "
        f"You are helping {user.name}, a {skill}-level student whose goal is: {goal}. "
        f"Their subjects of interest are: {subjects}. "
        f"Explain concepts clearly, give practical examples, generate practice questions when asked, "
        f"and always encourage the student. Use markdown formatting for code and lists."
    )
    
    if context:
        prompt += (
            f"\n\nHere is some verified content from our course study guides that you should reference to ground your answer:\n"
            f"\"\"\"\n{context}\n\"\"\"\n"
            f"Ensure you integrate this study material into your explanation."
        )
        
    return prompt


@chat_bp.route("/message", methods=["POST"])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json()
    user_message = (data.get("message") or "").strip()
    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    # Save user message
    user_chat = ChatMessage(user_id=user_id, role="user", message=user_message)
    db.session.add(user_chat)
    db.session.flush()

    # Fetch last N messages for context
    history = (
        ChatMessage.query
        .filter_by(user_id=user_id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(HISTORY_LIMIT)
        .all()
    )
    history_messages = [
        {"role": msg.role, "content": msg.message}
        for msg in reversed(history)
        if msg.id != user_chat.id
    ]

    # Retrieve relevant study context from RAG service
    from app.services.rag_service import rag_service
    retrieved = rag_service.retrieve(user_message, top_n=2)
    context_str = "\n\n---\n\n".join(retrieved) if retrieved else None

    # Call Groq
    client = get_groq_client()
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": build_system_prompt(user, context_str)},
                *history_messages,
                {"role": "user", "content": user_message},
            ],
            temperature=0.8,
            max_tokens=1024,
        )
        assistant_reply = response.choices[0].message.content
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"AI service error: {str(e)}"}), 500

    # Save assistant response
    assistant_chat = ChatMessage(user_id=user_id, role="assistant", message=assistant_reply)
    db.session.add(assistant_chat)
    db.session.commit()

    return jsonify({
        "user_message": user_chat.to_dict(),
        "assistant_message": assistant_chat.to_dict(),
    }), 200


@chat_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    messages = (
        ChatMessage.query
        .filter_by(user_id=user_id)
        .order_by(ChatMessage.timestamp.asc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        "messages": [m.to_dict() for m in messages.items],
        "total": messages.total,
        "page": page,
        "pages": messages.pages,
    }), 200


@chat_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_history():
    user_id = int(get_jwt_identity())
    ChatMessage.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "Chat history cleared."}), 200
