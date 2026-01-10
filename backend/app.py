from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)

SECRET_KEY = "SUPERTAJNYFIGIELKOWYKLUCZ"
ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 1

DOCUMENTS_DIR = "documents"

DOCUMENTS = {
    "BUS__25Z_sprawozdanie1.pdf": {
        "allowed_roles": ["user", "admin"]
    },
    "BUS__25Z_prezentacja1.pptx": {
        "allowed_roles": ["admin"]
    },
    "Tematy_projektow.xlsx": {
        "allowed_roles": ["user", "admin"]
    }
}

users = {
    "user": {"id": 1, "username": "user", "password": "user123", "role": "user"},
    "admin": {"id": 2, "username": "admin", "password": "admin123", "role": "admin"},
}

def get_file_metadata(filename):
    path = os.path.join(DOCUMENTS_DIR, filename)

    if not os.path.isfile(path):
        return None

    size_bytes = os.path.getsize(path)
    size_mb = f"{round(size_bytes / (1024 * 1024), 2)} MB"

    modified_ts = os.path.getmtime(path)
    date_str = datetime.fromtimestamp(modified_ts).strftime("%Y-%m-%d")

    return {
        "size": size_mb,
        "date": date_str
    }


def generate_jwt(user):
    payload = {
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Brak username lub password"}), 400

    user = users.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Nieprawidłowe dane logowania"}), 401

    token = generate_jwt(user)
    return jsonify({
        "token": token,
        "user": {"username": user["username"], "role": user["role"]}
    })

def token_required():
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization")
            if not auth:
                return jsonify({"error": "Brak Authorization"}), 401

            parts = auth.split(" ", 1)
            if len(parts) != 2 or parts[0].lower() != "bearer":
                return jsonify({"error": "Zły format Authorization"}), 401

            try:
                payload = jwt.decode(parts[1], SECRET_KEY, algorithms=[ALGORITHM])
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token wygasł"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Nieprawidłowy token"}), 401

            return f(payload, *args, **kwargs)
        return wrapper
    return decorator

@app.route("/documents", methods=["GET"])
@token_required()
def documents(user_data):
    docs = []

    for name, meta in DOCUMENTS.items():
        file_meta = get_file_metadata(name)
        if not file_meta:
            continue

        docs.append({
            "name": name,
            "allowed_roles": meta["allowed_roles"],
            "size": file_meta["size"],
            "date": file_meta["date"]
        })

    return jsonify({
        "user": user_data["username"],
        "role": user_data["role"],
        "documents": docs
    })


@app.route("/documents/download/<filename>", methods=["GET"])
@token_required()
def download_document(user_data, filename):
    if ".." in filename:
        abort(400)

    meta = DOCUMENTS.get(filename)
    if not meta:
        abort(404)

    if user_data["role"] not in meta["allowed_roles"]:
        return jsonify({"error": "Brak dostępu"}), 403

    return send_from_directory(DOCUMENTS_DIR, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
