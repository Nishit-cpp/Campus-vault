import os
import sqlite3
import uuid
from datetime import datetime, date, timedelta
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "campus_vault.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx", "txt", "zip", "png", "jpg", "jpeg"}

def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def initialize_database():
    connection = get_db()
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT 'Student',
            course TEXT DEFAULT '', branch TEXT DEFAULT '', year TEXT DEFAULT '', semester TEXT DEFAULT '',
            weak TEXT DEFAULT '', strong TEXT DEFAULT '', goal TEXT DEFAULT '', daily_target INTEGER DEFAULT 60,
            xp INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, last_study TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '',
            subject TEXT DEFAULT '', semester TEXT DEFAULT '', kind TEXT DEFAULT 'Notes', 
            year TEXT DEFAULT '', original TEXT DEFAULT '', stored TEXT DEFAULT '', filename TEXT DEFAULT '', 
            uploaded_by INTEGER DEFAULT 1, downloads INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Auto-fix: Add branch column if it doesn't exist
    try:
        connection.execute("ALTER TABLE resources ADD COLUMN branch TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    connection.execute("""
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, subject TEXT NOT NULL,
            minutes INTEGER NOT NULL, note TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, subject TEXT DEFAULT '',
            creator_id INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, test_id INTEGER NOT NULL, question TEXT NOT NULL,
            a TEXT NOT NULL, b TEXT NOT NULL, c TEXT NOT NULL, d TEXT NOT NULL, answer TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, test_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
            score INTEGER NOT NULL, total INTEGER NOT NULL, xp INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, code TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, code)
        )
    """)

    # Initialize the base user (No fake users, no fake XP)
    if connection.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        connection.execute("INSERT INTO users (name, xp, streak) VALUES ('Student', 0, 0)")

    connection.commit()
    connection.close()

def get_current_user():
    connection = get_db()
    user = connection.execute("SELECT * FROM users ORDER BY id LIMIT 1").fetchone()
    connection.close()
    return dict(user) if user else None

def update_achievements(connection, user_id):
    user = connection.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    achievements = []
    if user["xp"] >= 2: achievements.append("FIRST_STUDY")
    if user["xp"] >= 100: achievements.append("XP_100")
    if user["xp"] >= 500: achievements.append("XP_500")
    if user["streak"] >= 3: achievements.append("STREAK_3")
    for code in achievements:
        connection.execute("INSERT OR IGNORE INTO achievements (user_id, code) VALUES (?, ?)", (user_id, code))

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/profile")
def get_profile():
    return jsonify(get_current_user())

@app.post("/api/profile")
def save_profile():
    data = request.get_json(silent=True) or {}
    try: daily_target = max(15, min(int(data.get("daily_target", 60)), 600))
    except: daily_target = 60
    connection = get_db()
    connection.execute("""
        UPDATE users SET name=?, course=?, branch=?, year=?, semester=?, weak=?, strong=?, goal=?, daily_target=? WHERE id=1
    """, (str(data.get("name", "")).strip(), data.get("course", ""), str(data.get("branch", "")).strip(), data.get("year", ""), data.get("semester", ""), data.get("weak", ""), str(data.get("strong", "")).strip(), data.get("goal", ""), daily_target))
    connection.commit()
    saved_user = dict(connection.execute("SELECT * FROM users WHERE id=1").fetchone())
    connection.close()
    return jsonify(success=True, **saved_user)

@app.get("/api/stats")
def get_stats():
    connection = get_db()
    total = connection.execute("SELECT COUNT(*) FROM resources").fetchone()[0]
    downloads = connection.execute("SELECT COALESCE(SUM(downloads), 0) FROM resources").fetchone()[0]
    subjects = connection.execute("SELECT COUNT(DISTINCT subject) FROM resources WHERE subject != ''").fetchone()[0]
    connection.close()
    return jsonify(total=total, downloads=downloads, subjects=subjects)

@app.get("/api/dashboard")
def dashboard():
    connection = get_db()
    current_user = connection.execute("SELECT * FROM users WHERE id=1").fetchone()
    recent = connection.execute("SELECT subject, minutes, note, created_at FROM study_sessions WHERE user_id=1 ORDER BY id DESC LIMIT 50").fetchall()
    connection.close()
    return jsonify(user=dict(current_user), recent=[dict(row) for row in recent], level=(current_user["xp"] // 100) + 1)

@app.get("/api/resources")
def get_resources():
    search = request.args.get("search", "").strip()
    kind = request.args.get("kind", "").strip()
    subject = request.args.get("subject", "").strip()
    branch = request.args.get("branch", "").strip()
    semester = request.args.get("semester", "").strip()
    
    connection = get_db()
    query = "SELECT * FROM resources WHERE 1=1"
    params = []
    
    if search:
        query += " AND (title LIKE ? OR description LIKE ? OR subject LIKE ?)"
        params.extend([f"%{search}%"] * 3)
    for key, val in [("kind", kind), ("subject", subject), ("branch", branch), ("semester", semester)]:
        if val:
            query += f" AND {key}=?"
            params.append(val)
            
    query += " ORDER BY id DESC"
    rows = connection.execute(query, params).fetchall()
    connection.close()
    return jsonify([dict(row) for row in rows])

@app.post("/api/upload")
def upload_resource():
    form = request.form
    uploaded_file = request.files.get("file")
    if not uploaded_file or not uploaded_file.filename: return jsonify(success=False, message="File required."), 400
    orig_name = secure_filename(uploaded_file.filename)
    ext = os.path.splitext(orig_name)[1].lower().replace(".", "")
    if ext not in ALLOWED_EXTENSIONS: return jsonify(success=False, message="Invalid file type."), 400
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    uploaded_file.save(os.path.join(UPLOAD_FOLDER, stored_name))
    connection = get_db()
    connection.execute("""
        INSERT INTO resources (title, description, subject, branch, semester, kind, original, stored, filename, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (form.get("title",""), form.get("description",""), form.get("subject",""), form.get("branch",""), form.get("semester",""), form.get("kind",""), orig_name, stored_name, orig_name))
    update_achievements(connection, 1)
    connection.commit()
    connection.close()
    return jsonify(success=True, message="Resource uploaded successfully!")

@app.get("/api/resource/<int:resource_id>/open")
def open_resource(resource_id):
    connection = get_db()
    resource = connection.execute("SELECT * FROM resources WHERE id=?", (resource_id,)).fetchone()
    if resource and resource["stored"] and os.path.exists(os.path.join(UPLOAD_FOLDER, resource["stored"])):
        connection.execute("UPDATE resources SET downloads = downloads + 1 WHERE id=?", (resource_id,))
        connection.commit()
        connection.close()
        return send_from_directory(UPLOAD_FOLDER, resource["stored"], as_attachment=False, download_name=resource["original"])
    return "File not found.", 404

@app.get("/api/resources/<int:resource_id>/download")
def download_resource(resource_id):
    connection = get_db()
    resource = connection.execute("SELECT * FROM resources WHERE id=?", (resource_id,)).fetchone()
    connection.close()
    if not resource or not resource["stored"]: return "File not found.", 404
    file_path = os.path.join(UPLOAD_FOLDER, resource["stored"])
    if not os.path.exists(file_path): return "File not found.", 404
    return send_from_directory(UPLOAD_FOLDER, resource["stored"], as_attachment=True, download_name=(resource["original"] or "resource"))

@app.post("/api/study")
def log_study():
    data = request.get_json(silent=True) or {}
    subject, minutes, note = data.get("subject", "").strip(), int(data.get("minutes", 0)), data.get("note", "").strip()
    if not subject or minutes <= 0: return jsonify(success=False, message="Invalid input."), 400
    connection = get_db()
    user = connection.execute("SELECT * FROM users WHERE id=1").fetchone()
    last_study = (user["last_study"] or "")[:10]
    today, yesterday = date.today().isoformat(), (date.today() - timedelta(days=1)).isoformat()
    new_streak = user["streak"] if last_study == today else (user["streak"] + 1 if last_study == yesterday else 1)
    earned_xp = max(1, minutes // 10) * 2
    connection.execute("INSERT INTO study_sessions (user_id, subject, minutes, note) VALUES (1, ?, ?, ?)", (subject, minutes, note))
    connection.execute("UPDATE users SET xp = xp + ?, streak = ?, last_study = ? WHERE id=1", (earned_xp, new_streak, datetime.now().isoformat()))
    update_achievements(connection, 1)
    connection.commit()
    connection.close()
    return jsonify(success=True, earned=earned_xp, streak=new_streak)

@app.get("/api/tests")
def get_tests():
    connection = get_db()
    tests = connection.execute("SELECT tests.*, COUNT(questions.id) AS question_count FROM tests LEFT JOIN questions ON questions.test_id = tests.id GROUP BY tests.id ORDER BY tests.id DESC").fetchall()
    connection.close()
    return jsonify([dict(t) for t in tests])

@app.post("/api/tests")
def create_test():
    data = request.get_json(silent=True) or {}
    title, subject, questions = str(data.get("title", "")).strip(), str(data.get("subject", "")).strip(), data.get("questions", [])
    if not title or not subject or not questions: return jsonify(success=False, message="Incomplete data."), 400
    connection = get_db()
    cursor = connection.execute("INSERT INTO tests (title, subject, creator_id) VALUES (?, ?, 1)", (title, subject))
    test_id = cursor.lastrowid
    valid_count = 0
    for q in questions:
        if not all(str(q.get(k, "")).strip() for k in ["question", "a", "b", "c", "d", "answer"]): continue
        connection.execute("INSERT INTO questions (test_id, question, a, b, c, d, answer) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                           (test_id, q["question"], q["a"], q["b"], q["c"], q["d"], q["answer"]))
        valid_count += 1
    if valid_count == 0:
        connection.execute("DELETE FROM tests WHERE id=?", (test_id,))
        connection.commit()
        connection.close()
        return jsonify(success=False, message="No valid questions."), 400
    connection.execute("UPDATE users SET xp = xp + 10 WHERE id=1")
    update_achievements(connection, 1)
    connection.commit()
    connection.close()
    return jsonify(success=True, message="Test created! +10 XP")

@app.get("/api/tests/<int:test_id>")
def get_test(test_id):
    connection = get_db()
    test = connection.execute("SELECT * FROM tests WHERE id=?", (test_id,)).fetchone()
    questions = connection.execute("SELECT id, question, a, b, c, d FROM questions WHERE test_id=? ORDER BY id", (test_id,)).fetchall()
    connection.close()
    if not test: return jsonify(message="Test not found."), 404
    return jsonify(test=dict(test), questions=[dict(q) for q in questions])

@app.post("/api/tests/<int:test_id>/submit")
def submit_test(test_id):
    data = request.get_json(silent=True) or {}
    answers = data.get("answers", {})
    connection = get_db()
    questions = connection.execute("SELECT id, answer FROM questions WHERE test_id=?", (test_id,)).fetchall()
    score = sum(1 for q in questions if answers.get(str(q["id"])) == q["answer"])
    total, earned_xp = len(questions), score * 10
    connection.execute("INSERT INTO attempts (test_id, user_id, score, total, xp) VALUES (?, ?, ?, ?, ?)", (test_id, 1, score, total, earned_xp))
    connection.execute("UPDATE users SET xp = xp + ? WHERE id=1", (earned_xp,))
    update_achievements(connection, 1)
    connection.commit()
    connection.close()
    return jsonify(score=score, total=total, xp=earned_xp)

@app.get("/api/leaderboard")
def get_leaderboard():
    connection = get_db()
    users = connection.execute("SELECT name, xp, streak, course, branch FROM users ORDER BY xp DESC, streak DESC, name ASC LIMIT 20").fetchall()
    connection.close()
    return jsonify([dict(u) for u in users])

@app.get("/api/achievements")
def get_achievements():
    names = {"FIRST_STUDY": "🌱 First Study", "XP_100": "⚡ 100 XP", "XP_500": "🔥 500 XP", "STREAK_3": "🏆 3-Day Streak", "RESOURCE_SHARER": "📚 Resource Sharer"}
    connection = get_db()
    rows = connection.execute("SELECT code FROM achievements WHERE user_id=1").fetchall()
    connection.close()
    return jsonify([names.get(r["code"], r["code"]) for r in rows])

initialize_database()
if __name__ == "__main__":
    app.run(debug=True)