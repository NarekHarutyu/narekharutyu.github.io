import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/contact": {"origins": ["http://127.0.0.1:8000", "http://localhost:8000"]}})

PORT = int(os.getenv("PORT", 8788))
BASE_DIR = Path(__file__).resolve().parent
OUTBOX_DIR = BASE_DIR / "outbox"


def send_email_via_gmail(sender_user: str, sender_pass: str, to_email: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = sender_user
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls(context=context)
        server.login(sender_user, sender_pass)
        server.send_message(msg)


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.post("/contact")
def contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"ok": False, "error": "Missing fields"}), 400

    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    to_email = os.getenv("TO_EMAIL", smtp_user or "")

    subject = f"Website contact from {name}"
    body = f"From: {name} <{email}>\n\n{message}"

    try:
        if smtp_user and smtp_pass and to_email:
            send_email_via_gmail(smtp_user, smtp_pass, to_email, subject, body)
            return jsonify({"ok": True, "method": "smtp"})
        else:
            # Fallback: save to outbox for local testing
            OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            file_path = OUTBOX_DIR / f"message-{stamp}.txt"
            file_path.write_text(body, encoding="utf-8")
            return jsonify({"ok": True, "method": "file", "path": str(file_path)})
    except Exception as e:
        print("Email send error:", e)
        return jsonify({"ok": False, "error": "Failed to send"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT) 