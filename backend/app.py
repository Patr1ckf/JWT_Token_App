from flask import Flask, request, jsonify
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps

app = Flask(__name__)

SECRET_KEY = "SUPERTAJNYFIGIELKOWYKLUCZ"
ALGORITHM = "HS256"

JWT_EXPIRE_MINUTES = 1  # na potrzeby prezentacji 1 min

# =========================
# PRZYKŁADOWI UŻYTKOWNICY
# =========================
users = {
    "user": {
        "id": 1,
        "username": "user",
        "password": "user123",
        "role": "user"
    },
    "admin": {
        "id": 2,
        "username": "admin",
        "password": "admin123",
        "role": "admin"
    }
}

# =========================
# GENEROWANIE JWT
# =========================
def generate_jwt(user):
    payload = {
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# =========================
# LOGOWANIE
# =========================
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = users.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Nieprawidlowe dane logowania"}), 401

    token = generate_jwt(user)
    return jsonify({"token": token})

def token_required(required_role=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return jsonify({"error": "Brak naglowka Authorization"}), 401
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"error": "Niepoprawny format Authorization"}), 401

            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token wygasl, zaloguj sie ponownie"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Nieprawidlowy token"}), 401

            if required_role and payload["role"] != required_role:
                return jsonify({"error": "Brak uprawnien"}), 403

            return f(payload, *args, **kwargs)
        return wrapper
    return decorator

# =================================================
# DOSTĘP DO PLIKÓW W ZALEŻNOŚCI OD ROLI UŻYTKOWNIKA
# =================================================
@app.route("/documents", methods=["GET"])
@token_required()
def documents(user_data):
    if user_data["role"] == "admin":
        documents = [
            "BUS__25Z_prezentacja1_Topczewska_Figiel.pptx"
        ]
    else:
        documents = [
            "BUS__25Z_sprawozdanie1_Topczewska_Figiel.pdf"
        ]
    return jsonify({
        "user": user_data["username"],
        "role": user_data["role"],
        "documents": documents
    })

# ==================================
# ENDPOINT DOSTĘPNY TYLKO DLA ADMINA
# ==================================
@app.route("/admin", methods=["GET"])
@token_required(required_role="admin")
def admin_panel(user_data):
    return jsonify({
        "message": "Dostep tylko dla administratora",
        "user": user_data["username"]
    })

# =========================
# START SERWERA
# =========================
if __name__ == "__main__":
    app.run(debug=True)