import os
import sqlite3
import uuid
from datetime import datetime, date, timedelta

from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename


# =========================================================
# BASIC SETUP
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "campus_vault.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)

app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024


ALLOWED_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "txt",
    "zip",
    "png",
    "jpg",
    "jpeg",
    "webp"
}


# =========================================================
# DATABASE
# =========================================================

def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def add_column(connection, table, column, definition):

    existing_columns = {
        row["name"]
        for row in connection.execute(
            f"PRAGMA table_info({table})"
        )
    }

    if column not in existing_columns:

        connection.execute(
            f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
        )


def initialize_database():

    connection = get_db()

    # -----------------------------------------------------
    # USERS
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL DEFAULT 'Student',

            course TEXT DEFAULT '',

            branch TEXT DEFAULT '',

            year TEXT DEFAULT '',

            semester TEXT DEFAULT '',

            weak TEXT DEFAULT '',

            strong TEXT DEFAULT '',

            goal TEXT DEFAULT '',

            daily_target INTEGER DEFAULT 60,

            xp INTEGER DEFAULT 0,

            streak INTEGER DEFAULT 0,

            last_study TEXT,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -----------------------------------------------------
    # RESOURCES
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS resources (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT NOT NULL,

            description TEXT DEFAULT '',

            subject TEXT DEFAULT '',

            semester TEXT DEFAULT '',

            kind TEXT DEFAULT 'Notes',

            year TEXT DEFAULT '',

            original TEXT DEFAULT '',

            stored TEXT DEFAULT '',

            filename TEXT DEFAULT '',

            uploaded_by INTEGER DEFAULT 1,

            downloads INTEGER DEFAULT 0,

            verified INTEGER DEFAULT 0,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -----------------------------------------------------
    # STUDY SESSIONS
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS study_sessions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            subject TEXT NOT NULL,

            minutes INTEGER NOT NULL,

            note TEXT DEFAULT '',

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -----------------------------------------------------
    # TESTS
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS tests (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT NOT NULL,

            subject TEXT DEFAULT '',

            creator_id INTEGER DEFAULT 1,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -----------------------------------------------------
    # QUESTIONS
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS questions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            test_id INTEGER NOT NULL,

            question TEXT NOT NULL,

            a TEXT NOT NULL,

            b TEXT NOT NULL,

            c TEXT NOT NULL,

            d TEXT NOT NULL,

            answer TEXT NOT NULL,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -----------------------------------------------------
    # TEST ATTEMPTS
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS attempts (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            test_id INTEGER NOT NULL,

            user_id INTEGER NOT NULL,

            score INTEGER NOT NULL,

            total INTEGER NOT NULL,

            xp INTEGER DEFAULT 0,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


    # -----------------------------------------------------
    # ACHIEVEMENTS
    # -----------------------------------------------------

    connection.execute("""
        CREATE TABLE IF NOT EXISTS achievements (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            code TEXT NOT NULL,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(user_id, code)
        )
    """)


    # =====================================================
    # MIGRATE OLD DATABASES
    # =====================================================

    user_columns = [

        ("course", "TEXT DEFAULT ''"),

        ("branch", "TEXT DEFAULT ''"),

        ("year", "TEXT DEFAULT ''"),

        ("semester", "TEXT DEFAULT ''"),

        ("weak", "TEXT DEFAULT ''"),

        ("strong", "TEXT DEFAULT ''"),

        ("goal", "TEXT DEFAULT ''"),

        ("daily_target", "INTEGER DEFAULT 60"),

        ("xp", "INTEGER DEFAULT 0"),

        ("streak", "INTEGER DEFAULT 0"),

        ("last_study", "TEXT"),

        ("created_at", "TEXT")
    ]

    for column, definition in user_columns:

        add_column(
            connection,
            "users",
            column,
            definition
        )


    resource_columns = [

        ("description", "TEXT DEFAULT ''"),

        ("subject", "TEXT DEFAULT ''"),

        ("semester", "TEXT DEFAULT ''"),

        ("kind", "TEXT DEFAULT 'Notes'"),

        ("year", "TEXT DEFAULT ''"),

        ("original", "TEXT DEFAULT ''"),

        ("stored", "TEXT DEFAULT ''"),

        ("filename", "TEXT DEFAULT ''"),

        ("uploaded_by", "INTEGER DEFAULT 1"),

        ("downloads", "INTEGER DEFAULT 0"),

        ("verified", "INTEGER DEFAULT 0"),

        ("created_at", "TEXT")
    ]

    for column, definition in resource_columns:

        add_column(
            connection,
            "resources",
            column,
            definition
        )


    # =====================================================
    # CREATE FIRST USER
    # =====================================================

    user_count = connection.execute(
        "SELECT COUNT(*) FROM users"
    ).fetchone()[0]

    if user_count == 0:

        connection.execute("""
            INSERT INTO users (name)
            VALUES ('Student')
        """)


    # =====================================================
    # DEMO RESOURCES
    # =====================================================

    resource_count = connection.execute(
        "SELECT COUNT(*) FROM resources"
    ).fetchone()[0]

    if resource_count == 0:

        demo_resources = [

            (
                "C Programming Notes",
                "Programming",
                "Semester 1",
                "Notes",
                "Core C syntax, functions and pointers."
            ),

            (
                "Engineering Mathematics PYQ",
                "Mathematics",
                "Semester 1",
                "PYQ",
                "Previous-year mathematics practice questions."
            ),

            (
                "Digital Logic Lab Manual",
                "Digital Logic",
                "Semester 1",
                "Lab",
                "Logic gates and laboratory experiments."
            ),

            (
                "Problem Solving Practice",
                "Programming",
                "Semester 1",
                "Practice",
                "Beginner programming practice questions."
            )
        ]

        for resource in demo_resources:

            title = resource[0]
            subject = resource[1]
            semester = resource[2]
            kind = resource[3]
            description = resource[4]

            connection.execute("""
                INSERT INTO resources
                (
                    title,
                    subject,
                    semester,
                    kind,
                    description,
                    original,
                    stored,
                    uploaded_by
                )

                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                title,
                subject,
                semester,
                kind,
                description,
                "",
                ""
            ))


    connection.commit()

    connection.close()


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_current_user():

    connection = get_db()

    user = connection.execute(
        "SELECT * FROM users ORDER BY id LIMIT 1"
    ).fetchone()

    connection.close()

    return user


def row_to_dict(row):

    if row is None:
        return None

    return dict(row)


def calculate_level(xp):

    return (xp // 100) + 1


# =========================================================
# ACHIEVEMENTS
# =========================================================

def update_achievements(connection, user_id):

    user = connection.execute(
        "SELECT * FROM users WHERE id=?",
        (user_id,)
    ).fetchone()

    achievements = []

    if user["xp"] >= 2:

        achievements.append(
            "FIRST_STUDY"
        )


    if user["xp"] >= 100:

        achievements.append(
            "XP_100"
        )


    if user["xp"] >= 500:

        achievements.append(
            "XP_500"
        )


    if user["streak"] >= 3:

        achievements.append(
            "STREAK_3"
        )


    upload_count = connection.execute(
        """
        SELECT COUNT(*)
        FROM resources
        WHERE uploaded_by=?
        """,
        (user_id,)
    ).fetchone()[0]

    if upload_count >= 1:

        achievements.append(
            "RESOURCE_SHARER"
        )


    for code in achievements:

        connection.execute(
            """
            INSERT OR IGNORE INTO achievements
            (user_id, code)

            VALUES (?, ?)
            """,
            (user_id, code)
        )


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# =========================================================
# PROFILE
# =========================================================

@app.get("/api/profile")
def get_profile():

    user = get_current_user()

    return jsonify(
        row_to_dict(user)
    )


@app.post("/api/profile")
def save_profile():

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [

        "name",
        "course",
        "branch",
        "year",
        "semester",
        "weak",
        "strong",
        "goal"
    ]

    for field in required_fields:

        if not str(
            data.get(field, "")
        ).strip():

            return jsonify(
                success=False,
                message=f"Please complete: {field}"
            ), 400


    try:

        daily_target = int(
            data.get(
                "daily_target",
                60
            )
        )

    except:

        daily_target = 60


    daily_target = max(
        15,
        min(
            daily_target,
            600
        )
    )


    try:

        connection = get_db()

        connection.execute("""
            UPDATE users

            SET
                name=?,
                course=?,
                branch=?,
                year=?,
                semester=?,
                weak=?,
                strong=?,
                goal=?,
                daily_target=?

            WHERE id=1
        """, (

            str(
                data["name"]
            ).strip(),

            data["course"],

            str(
                data["branch"]
            ).strip(),

            data["year"],

            data["semester"],

            data["weak"],

            str(
                data["strong"]
            ).strip(),

            data["goal"],

            daily_target
        ))


        connection.commit()


        saved_user = connection.execute(
            "SELECT * FROM users WHERE id=1"
        ).fetchone()


        connection.close()


        return jsonify(
            success=True,
            **row_to_dict(saved_user)
        )


    except Exception as error:

        return jsonify(
            success=False,
            message=str(error)
        ), 500


# =========================================================
# DASHBOARD STATS
# =========================================================

@app.get("/api/stats")
def get_stats():

    connection = get_db()


    total = connection.execute(
        "SELECT COUNT(*) FROM resources"
    ).fetchone()[0]


    downloads = connection.execute(
        """
        SELECT COALESCE(
            SUM(downloads),
            0
        )

        FROM resources
        """
    ).fetchone()[0]


    subjects = connection.execute(
        """
        SELECT COUNT(
            DISTINCT subject
        )

        FROM resources

        WHERE subject != ''
        """
    ).fetchone()[0]


    connection.close()


    return jsonify(

        total=total,

        downloads=downloads,

        subjects=subjects
    )


# =========================================================
# DASHBOARD
# =========================================================

@app.get("/api/dashboard")
def dashboard():

    connection = get_db()


    current_user = connection.execute(
        "SELECT * FROM users WHERE id=1"
    ).fetchone()


    subjects = connection.execute("""
        SELECT
            subject,
            SUM(minutes) AS minutes

        FROM study_sessions

        WHERE user_id=1

        GROUP BY subject

        ORDER BY minutes DESC
    """).fetchall()


    recent = connection.execute("""
        SELECT
            subject,
            minutes,
            note,
            created_at

        FROM study_sessions

        WHERE user_id=1

        ORDER BY id DESC

        LIMIT 50
    """).fetchall()


    connection.close()


    return jsonify(

        user=row_to_dict(
            current_user
        ),

        subjects=[
            dict(row)
            for row in subjects
        ],

        recent=[
            dict(row)
            for row in recent
        ],

        level=calculate_level(
            current_user["xp"]
        )
    )


# =========================================================
# RESOURCES
# =========================================================

@app.get("/api/resources")
def get_resources():

    search = request.args.get(
        "search",
        ""
    ).strip()

    kind = request.args.get(
        "kind",
        ""
    ).strip()

    subject = request.args.get(
        "subject",
        ""
    ).strip()

    semester = request.args.get(
        "semester",
        ""
    ).strip()


    connection = get_db()


    query = """
        SELECT *
        FROM resources
        WHERE 1=1
    """

    parameters = []


    if search:

        query += """
            AND (
                title LIKE ?
                OR description LIKE ?
                OR subject LIKE ?
            )
        """

        search_value = (
            f"%{search}%"
        )

        parameters.extend([
            search_value,
            search_value,
            search_value
        ])


    if kind:

        query += """
            AND kind=?
        """

        parameters.append(
            kind
        )


    if subject:

        query += """
            AND subject=?
        """

        parameters.append(
            subject
        )


    if semester:

        query += """
            AND semester=?
        """

        parameters.append(
            semester
        )


    query += """
        ORDER BY id DESC
    """


    rows = connection.execute(
        query,
        parameters
    ).fetchall()


    connection.close()


    return jsonify([
        dict(row)
        for row in rows
    ])


# =========================================================
# UPLOAD RESOURCE
# =========================================================

@app.post("/api/upload")
def upload_resource():

    title = request.form.get(
        "title",
        ""
    ).strip()

    subject = request.form.get(
        "subject",
        ""
    ).strip()

    semester = request.form.get(
        "semester",
        ""
    ).strip()

    kind = request.form.get(
        "kind",
        ""
    ).strip()

    description = request.form.get(
        "description",
        ""
    ).strip()


    if not title:

        return jsonify(
            success=False,
            message="Enter a resource name."
        ), 400


    if not subject:

        return jsonify(
            success=False,
            message="Enter a subject."
        ), 400


    if not semester:

        return jsonify(
            success=False,
            message="Select a semester."
        ), 400


    if not kind:

        return jsonify(
            success=False,
            message="Select a resource type."
        ), 400


    uploaded_file = request.files.get(
        "file"
    )


    if not uploaded_file:

        return jsonify(
            success=False,
            message="Please choose a file."
        ), 400


    if not uploaded_file.filename:

        return jsonify(
            success=False,
            message="Please choose a file."
        ), 400


    original_name = secure_filename(
        uploaded_file.filename
    )


    extension = os.path.splitext(
        original_name
    )[1].lower().replace(
        ".",
        ""
    )


    if extension not in ALLOWED_EXTENSIONS:

        return jsonify(
            success=False,
            message="This file type is not allowed."
        ), 400


    stored_name = (
        uuid.uuid4().hex
        + "."
        + extension
    )


    file_path = os.path.join(
        UPLOAD_FOLDER,
        stored_name
    )


    uploaded_file.save(
        file_path
    )


    connection = get_db()


    connection.execute("""
        INSERT INTO resources
        (
            title,
            description,
            subject,
            semester,
            kind,
            original,
            stored,
            filename,
            uploaded_by
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (

        title,
        description,
        subject,
        semester,
        kind,
        original_name,
        stored_name,
        original_name
    ))


    update_achievements(
        connection,
        1
    )


    connection.commit()

    connection.close()


    return jsonify(
        success=True,
        message="Resource uploaded successfully!"
    )


# =========================================================
# OPEN RESOURCE
# =========================================================

@app.get("/api/resource/<int:resource_id>/open")
def open_resource(resource_id):

    connection = get_db()


    resource = connection.execute(
        """
        SELECT *
        FROM resources
        WHERE id=?
        """,
        (resource_id,)
    ).fetchone()


    if not resource:

        connection.close()

        return "Resource not found.", 404


    stored = resource["stored"]


    if not stored:

        connection.close()

        return (
            "This demo resource does not have "
            "a real file attached yet."
        ), 404


    file_path = os.path.join(
        UPLOAD_FOLDER,
        stored
    )


    if not os.path.exists(
        file_path
    ):

        connection.close()

        return "File not found.", 404


    connection.execute(
        """
        UPDATE resources

        SET downloads = downloads + 1

        WHERE id=?
        """,
        (resource_id,)
    )


    connection.commit()

    connection.close()


    return send_from_directory(
        UPLOAD_FOLDER,
        stored,
        as_attachment=False,
        download_name=(
            resource["original"]
            or "resource"
        )
    )


# =========================================================
# DOWNLOAD RESOURCE
# =========================================================

@app.get("/api/resources/<int:resource_id>/download")
def download_resource(resource_id):

    connection = get_db()


    resource = connection.execute(
        """
        SELECT *
        FROM resources
        WHERE id=?
        """,
        (resource_id,)
    ).fetchone()


    connection.close()


    if not resource:

        return "Resource not found.", 404


    stored = resource["stored"]


    if not stored:

        return "File not found.", 404


    file_path = os.path.join(
        UPLOAD_FOLDER,
        stored
    )


    if not os.path.exists(
        file_path
    ):

        return "File not found.", 404


    return send_from_directory(
        UPLOAD_FOLDER,
        stored,
        as_attachment=True,
        download_name=(
            resource["original"]
            or "resource"
        )
    )


# =========================================================
# STUDY SESSION
# =========================================================

@app.post("/api/study")
def log_study():

    data = request.get_json(
        silent=True
    ) or {}


    subject = str(
        data.get(
            "subject",
            ""
        )
    ).strip()


    try:

        minutes = int(
            data.get(
                "minutes",
                0
            )
        )

    except:

        minutes = 0


    note = str(
        data.get(
            "note",
            ""
        )
    ).strip()


    if not subject:

        return jsonify(
            success=False,
            message="Enter a subject."
        ), 400


    if minutes <= 0:

        return jsonify(
            success=False,
            message="Enter valid study minutes."
        ), 400


    connection = get_db()


    current_user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE id=1
        """
    ).fetchone()


    today = date.today().isoformat()


    last_study = (
        current_user["last_study"]
        or ""
    )[:10]


    yesterday = (
        date.today()
        - timedelta(days=1)
    ).isoformat()


    if last_study == today:

        new_streak = (
            current_user["streak"]
            or 1
        )

    elif last_study == yesterday:

        new_streak = (
            current_user["streak"]
            or 0
        ) + 1

    else:

        new_streak = 1


    earned_xp = max(
        1,
        minutes // 10
    ) * 2


    connection.execute("""
        INSERT INTO study_sessions
        (
            user_id,
            subject,
            minutes,
            note
        )

        VALUES (?, ?, ?, ?)
    """, (
        1,
        subject,
        minutes,
        note
    ))


    connection.execute("""
        UPDATE users

        SET
            xp = xp + ?,
            streak = ?,
            last_study = ?

        WHERE id=1
    """, (
        earned_xp,
        new_streak,
        datetime.now().isoformat()
    ))


    update_achievements(
        connection,
        1
    )


    connection.commit()

    connection.close()


    return jsonify(
        success=True,
        earned=earned_xp,
        streak=new_streak
    )


# =========================================================
# TESTS
# =========================================================

@app.get("/api/tests")
def get_tests():

    connection = get_db()


    tests = connection.execute("""
        SELECT
            tests.*,
            COUNT(questions.id)
            AS question_count

        FROM tests

        LEFT JOIN questions
        ON questions.test_id = tests.id

        GROUP BY tests.id

        ORDER BY tests.id DESC
    """).fetchall()


    connection.close()


    return jsonify([
        dict(test)
        for test in tests
    ])


# =========================================================
# CREATE TEST
# =========================================================

@app.post("/api/tests")
def create_test():

    data = request.get_json(
        silent=True
    ) or {}


    title = str(
        data.get(
            "title",
            ""
        )
    ).strip()


    subject = str(
        data.get(
            "subject",
            ""
        )
    ).strip()


    questions = data.get(
        "questions",
        []
    )


    if not title:

        return jsonify(
            success=False,
            message="Enter a test title."
        ), 400


    if not subject:

        return jsonify(
            success=False,
            message="Enter a subject."
        ), 400


    if not questions:

        return jsonify(
            success=False,
            message="Add at least one question."
        ), 400


    connection = get_db()


    cursor = connection.execute("""
        INSERT INTO tests
        (
            title,
            subject,
            creator_id
        )

        VALUES (?, ?, 1)
    """, (
        title,
        subject
    ))


    test_id = cursor.lastrowid


    valid_question_count = 0


    for question in questions:

        required = [
            "question",
            "a",
            "b",
            "c",
            "d",
            "answer"
        ]


        if not all(
            str(
                question.get(
                    key,
                    ""
                )
            ).strip()
            for key in required
        ):

            continue


        connection.execute("""
            INSERT INTO questions
            (
                test_id,
                question,
                a,
                b,
                c,
                d,
                answer
            )

            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (

            test_id,

            question["question"],

            question["a"],

            question["b"],

            question["c"],

            question["d"],

            question["answer"]
        ))


        valid_question_count += 1


    if valid_question_count == 0:

        connection.execute(
            "DELETE FROM tests WHERE id=?",
            (test_id,)
        )

        connection.commit()

        connection.close()


        return jsonify(
            success=False,
            message="No valid questions were added."
        ), 400


    connection.execute("""
        UPDATE users

        SET xp = xp + 10

        WHERE id=1
    """)


    update_achievements(
        connection,
        1
    )


    connection.commit()

    connection.close()


    return jsonify(
        success=True,
        message="Test created! +10 XP"
    )


# =========================================================
# GET ONE TEST
# =========================================================

@app.get("/api/tests/<int:test_id>")
def get_test(test_id):

    connection = get_db()


    test = connection.execute(
        """
        SELECT *
        FROM tests
        WHERE id=?
        """,
        (test_id,)
    ).fetchone()


    questions = connection.execute(
        """
        SELECT
            id,
            question,
            a,
            b,
            c,
            d

        FROM questions

        WHERE test_id=?

        ORDER BY id
        """,
        (test_id,)
    ).fetchall()


    connection.close()


    if not test:

        return jsonify(
            message="Test not found."
        ), 404


    return jsonify(

        test=dict(test),

        questions=[
            dict(question)
            for question in questions
        ]
    )


# =========================================================
# SUBMIT TEST
# =========================================================

@app.post("/api/tests/<int:test_id>/submit")
def submit_test(test_id):

    data = request.get_json(
        silent=True
    ) or {}


    answers = data.get(
        "answers",
        {}
    )


    connection = get_db()


    questions = connection.execute(
        """
        SELECT
            id,
            answer

        FROM questions

        WHERE test_id=?
        """,
        (test_id,)
    ).fetchall()


    score = 0


    for question in questions:

        selected_answer = answers.get(
            str(
                question["id"]
            )
        )


        if (
            selected_answer
            == question["answer"]
        ):

            score += 1


    total = len(
        questions
    )


    earned_xp = score * 10


    connection.execute("""
        INSERT INTO attempts
        (
            test_id,
            user_id,
            score,
            total,
            xp
        )

        VALUES (?, ?, ?, ?, ?)
    """, (
        test_id,
        1,
        score,
        total,
        earned_xp
    ))


    connection.execute("""
        UPDATE users

        SET xp = xp + ?

        WHERE id=1
    """, (
        earned_xp,
    ))


    update_achievements(
        connection,
        1
    )


    connection.commit()

    connection.close()


    return jsonify(

        score=score,

        total=total,

        xp=earned_xp
    )


# =========================================================
# LEADERBOARD
# =========================================================

@app.get("/api/leaderboard")
def get_leaderboard():

    connection = get_db()


    users = connection.execute("""
        SELECT
            name,
            xp,
            streak,
            course,
            branch

        FROM users

        ORDER BY
            xp DESC,
            streak DESC,
            name ASC

        LIMIT 20
    """).fetchall()


    connection.close()


    return jsonify([
        dict(user)
        for user in users
    ])


# =========================================================
# ACHIEVEMENTS
# =========================================================

@app.get("/api/achievements")
def get_achievements():

    names = {

        "FIRST_STUDY":
            "🌱 First Study Session",

        "XP_100":
            "⚡ 100 XP",

        "XP_500":
            "🔥 500 XP",

        "STREAK_3":
            "🏆 3-Day Streak",

        "RESOURCE_SHARER":
            "📚 Resource Sharer"
    }


    connection = get_db()


    rows = connection.execute("""
        SELECT code

        FROM achievements

        WHERE user_id=1

        ORDER BY id
    """).fetchall()


    connection.close()


    return jsonify([
        names.get(
            row["code"],
            row["code"]
        )

        for row in rows
    ])


# =========================================================
# START
# =========================================================

initialize_database()


if __name__ == "__main__":

    app.run(
        debug=True
    )