/* =====================================================
   CAMPUS VAULT
   FRONTEND
===================================================== */

let step = 1;

let profile =
    JSON.parse(
        localStorage.getItem("campusProfile") || "null"
    );

let selectedWeak = "";

let questions = [];


/* =====================================================
   HELPERS
===================================================== */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function scrollToSection(id) {

    const element = $(id);

    if (element) {

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
}


/* =====================================================
   ONBOARDING
===================================================== */

function showStep() {

    const area = $("formArea");

    const question = $("question");

    const text = $("questionText");

    const stepText = $("stepText");


    /* STEP 1 */

    if (step === 1) {

        stepText.textContent =
            "STEP 1 OF 3";

        question.textContent =
            "Tell us about yourself.";

        text.textContent =
            "Let's personalize your vault.";

        area.innerHTML = `

            <div class="input-group">

                <input
                    id="name"
                    placeholder="Your name"
                >

                <select id="course">

                    <option value="">
                        Select course
                    </option>

                    <option>B.Tech</option>
                    <option>B.E.</option>
                    <option>BCA</option>
                    <option>B.Sc</option>

                </select>


                <input
                    id="branch"
                    placeholder="Branch e.g. CSE"
                >


                <select id="year">

                    <option value="">
                        Current year
                    </option>

                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>

                </select>


                <select id="semester">

                    <option value="">
                        Semester
                    </option>

                    <option>Semester 1</option>
                    <option>Semester 2</option>
                    <option>Semester 3</option>
                    <option>Semester 4</option>

                </select>

            </div>

        `;

        return;
    }


    /* STEP 2 */

    if (step === 2) {

        stepText.textContent =
            "STEP 2 OF 3";

        question.textContent =
            "Where do you want to improve?";

        text.textContent =
            "Pick your focus.";

        area.innerHTML = `

            <div class="choices">

                <div class="choice"
                     onclick="pick(this,'Programming')">
                    💻 Programming
                </div>

                <div class="choice"
                     onclick="pick(this,'Mathematics')">
                    📐 Mathematics
                </div>

                <div class="choice"
                     onclick="pick(this,'DSA')">
                    🧠 DSA
                </div>

                <div class="choice"
                     onclick="pick(this,'Communication')">
                    🗣 Communication
                </div>

                <div class="choice"
                     onclick="pick(this,'Core Subjects')">
                    📚 Core Subjects
                </div>

                <div class="choice"
                     onclick="pick(this,'Problem Solving')">
                    🧩 Problem Solving
                </div>

            </div>


            <input
                id="weak"
                placeholder="Or type your own..."
            >


            <input
                id="strong"
                placeholder="What's your strength?"
            >

        `;

        return;
    }


    /* STEP 3 */

    if (step === 3) {

        stepText.textContent =
            "STEP 3 OF 3";

        question.textContent =
            "What are you aiming for?";

        text.textContent =
            "Choose your destination.";

        area.innerHTML = `

            <div class="choices">

                <div class="choice"
                     onclick="pickGoal(this,'Improve my coding')">
                    💻 Coding
                </div>

                <div class="choice"
                     onclick="pickGoal(this,'Score better in exams')">
                    📚 Academics
                </div>

                <div class="choice"
                     onclick="pickGoal(this,'Prepare for internships')">
                    🚀 Internship
                </div>

                <div class="choice"
                     onclick="pickGoal(this,'Build projects')">
                    🛠 Projects
                </div>

                <div class="choice"
                     onclick="pickGoal(this,'Prepare for placements')">
                    💼 Placements
                </div>

            </div>


            <select id="hours">

                <option value="">
                    Daily target
                </option>

                <option>30 minutes/day</option>
                <option>1 hour/day</option>
                <option>2 hours/day</option>
                <option>3+ hours/day</option>

            </select>

            <input
                id="goal"
                placeholder="Or type your own goal..."
            >

        `;

    }

}


function pick(element, value) {

    document
        .querySelectorAll(".choice")
        .forEach(item =>
            item.classList.remove("selected")
        );

    element.classList.add("selected");

    selectedWeak = value;

    const input = $("weak");

    if (input) {
        input.value = value;
    }
}


function pickGoal(element, value) {

    document
        .querySelectorAll(".choice")
        .forEach(item =>
            item.classList.remove("selected")
        );

    element.classList.add("selected");

    const input = $("goal");

    if (input) {
        input.value = value;
    }
}


/* =====================================================
   NEXT STEP
===================================================== */

async function nextStep() {


    /* STEP 1 */

    if (step === 1) {

        const name =
            $("name").value.trim();

        const course =
            $("course").value;

        const branch =
            $("branch").value.trim();

        const year =
            $("year").value;

        const semester =
            $("semester").value;


        if (
            !name ||
            !course ||
            !branch ||
            !year ||
            !semester
        ) {

            alert("Fill everything first.");

            return;
        }


        profile = {

            name,
            course,
            branch,
            year,
            semester

        };


        step = 2;

        showStep();

        return;
    }


    /* STEP 2 */

    if (step === 2) {

        const typed =
            $("weak").value.trim();

        const strong =
            $("strong").value.trim();


        profile.weak =
            typed ||
            selectedWeak ||
            "Programming";


        profile.strong =
            strong ||
            "Problem Solving";


        step = 3;

        showStep();

        return;
    }


    /* STEP 3 */

    if (step === 3) {

        const goal =
            $("goal").value.trim();

        const hours =
            $("hours").value;


        if (!goal || !hours) {

            alert("Choose your goal and daily target.");

            return;
        }


        profile.goal =
            goal;

        profile.hours =
            hours;


        localStorage.setItem(
            "campusProfile",
            JSON.stringify(profile)
        );


        await saveProfileToBackend();


        startApp();

    }

}


/* =====================================================
   SAVE PROFILE
===================================================== */

async function saveProfileToBackend() {

    try {

        let target = 60;

        if (
            profile.hours ===
            "30 minutes/day"
        ) target = 30;

        if (
            profile.hours ===
            "1 hour/day"
        ) target = 60;

        if (
            profile.hours ===
            "2 hours/day"
        ) target = 120;

        if (
            profile.hours ===
            "3+ hours/day"
        ) target = 180;


        await fetch(
            "/api/profile",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    name:
                        profile.name,

                    course:
                        profile.course,

                    branch:
                        profile.branch,

                    year:
                        profile.year,

                    semester:
                        profile.semester,

                    weak:
                        profile.weak,

                    strong:
                        profile.strong,

                    goal:
                        profile.goal,

                    daily_target:
                        target

                })

            }
        );

    } catch (error) {

        console.log(
            "Profile sync skipped:",
            error
        );

    }

}


/* =====================================================
   START APP (WITH DYNAMIC PLAN GENERATOR)
===================================================== */

function startApp() {

    $("onboarding")
        .classList.add("hidden");

    $("app")
        .classList.remove("hidden");


    $("studentName")
        .textContent =
        profile.name;


    $("weakArea")
        .textContent =
        profile.weak;


    $("studyHours")
        .textContent =
        profile.hours;


    $("goalTitle")
        .textContent =
        profile.goal;


    let plan = `As a ${profile.year} ${profile.course} student in ${profile.branch}, your primary focus is to ${profile.goal.toLowerCase()}. `;
    plan += `Since you want to improve in ${profile.weak}, dedicate your target of ${profile.hours} specifically to active practice and foundational review in this area. `;
    plan += `Use the Vault to log your sessions, track your streaks, and upload resources that help solidify your understanding.`;

    $("goalText")
        .textContent = plan;


    loadResources();

    loadStats();

    loadDashboard();

    loadTests();

    loadLeaderboard();

    loadAchievements();

}


function showProfile() {

    const box =
        $("profileInfo");


    box.innerHTML = `

        <div class="card">

            <h3>
                ${escapeHTML(profile.name)}
            </h3>

            <p>
                ${escapeHTML(profile.course)}
                ·
                ${escapeHTML(profile.branch)}
            </p>

            <p>
                ${escapeHTML(profile.year)}
                ·
                ${escapeHTML(profile.semester)}
            </p>

            <p>
                Focus:
                <b>${escapeHTML(profile.weak)}</b>
            </p>

            <p>
                Goal:
                <b>${escapeHTML(profile.goal)}</b>
            </p>
            
            <button class="main-btn"
                    onclick="logoutUser()"
                    style="margin-top: 25px; background: #c83254;">
                Log Out
            </button>

        </div>

    `;


    $("profileModal")
        .classList.add("show");

}


function logoutUser() {
    localStorage.removeItem("campusProfile");
    location.reload();
}


function closeProfile() {

    $("profileModal")
        .classList.remove("show");

}


/* =====================================================
   STATS
===================================================== */

async function loadStats() {

    try {

        const response =
            await fetch("/api/stats");

        const data =
            await response.json();


        $("total")
            .textContent =
            data.total;

    } catch (error) {

        console.log(error);

    }

}


/* =====================================================
   DASHBOARD / JOURNEY
===================================================== */

async function loadDashboard() {

    try {

        const response =
            await fetch("/api/dashboard");

        const data =
            await response.json();


        const user =
            data.user;


        $("xp")
            .textContent =
            user.xp || 0;


        $("streak")
            .textContent =
            user.streak || 0;


        $("studyStreak")
            .textContent =
            user.streak || 0;


        $("level")
            .textContent =
            data.level || 1;


        const progress =
            (user.xp % 100);


        const progressBar =
            $("journeyProgress");


        if (progressBar) {

            progressBar.style.width =
                progress + "%";

        }


        let totalMinutes = 0;


        if (data.recent) {

            data.recent.forEach(
                session => {

                    totalMinutes +=
                        Number(
                            session.minutes || 0
                        );

                }
            );

        }


        $("totalStudy")
            .textContent =
            totalMinutes + " min";


        renderStudyGraph(
            data.recent || []
        );


    } catch (error) {

        console.log(
            "Dashboard error:",
            error
        );

    }

}


/* =====================================================
   STUDY GRAPH
===================================================== */

function renderStudyGraph(sessions) {

    const graph =
        $("studyGraph");


    if (!graph) return;


    const days = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const d =
            new Date();

        d.setDate(
            d.getDate() - i
        );


        days.push({

            key:
                d.toISOString()
                 .slice(0, 10),

            label:
                d.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                ),

            minutes: 0

        });

    }


    sessions.forEach(
        session => {

            const key =
                String(
                    session.created_at
                ).slice(0, 10);


            const day =
                days.find(
                    item =>
                        item.key === key
                );


            if (day) {

                day.minutes +=
                    Number(
                        session.minutes || 0
                    );

            }

        }
    );


    const max =
        Math.max(
            60,
            ...days.map(
                d => d.minutes
            )
        );


    graph.innerHTML =
        days.map(day => {

            const height =
                Math.max(
                    8,
                    (day.minutes / max) * 100
                );


            return `

                <div style="
                    text-align:center;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    gap:7px;
                ">

                    <small>
                        ${day.minutes}m
                    </small>

                    <div style="
                        height:90px;
                        width:100%;
                        display:flex;
                        align-items:flex-end;
                        justify-content:center;
                    ">

                        <div style="
                            height:${height}%;
                            width:22px;
                            border-radius:8px;
                            background:linear-gradient(
                                180deg,
                                #8b5cf6,
                                #5b21b6
                            );
                        "></div>

                    </div>

                    <small>
                        ${day.label}
                    </small>

                </div>

            `;

        }).join("");

}


/* =====================================================
   STUDY MODAL
===================================================== */

function openStudyModal() {

    $("studyModal")
        .classList.add("show");

}


function closeStudyModal() {

    $("studyModal")
        .classList.remove("show");

}


$("studyForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const subject =
                $("studySubject")
                    .value.trim();


            const minutes =
                Number(
                    $("studyMinutes")
                        .value
                );


            const note =
                $("studyNote")
                    .value.trim();


            if (
                !subject ||
                minutes <= 0
            ) {

                alert(
                    "Enter your subject and time."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        "/api/study",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    subject,
                                    minutes,
                                    note

                                })

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.message ||
                        "Could not save."
                    );

                    return;

                }


                alert(
                    "Session saved! +" +
                    result.earned +
                    " XP ⚡"
                );


                $("studyForm")
                    .reset();


                closeStudyModal();

                loadDashboard();

                loadLeaderboard();

                loadAchievements();


            } catch (error) {

                alert(
                    "Something went wrong."
                );

            }

        }
    );


/* =====================================================
   RESOURCES
===================================================== */

async function loadResources() {

    try {

        const search =
            $("search").value;

        const subject =
            $("subject").value;

        const semester =
            $("semester").value;

        const kind =
            $("kind").value;


        const url =
            "/api/resources?" +
            "search=" +
            encodeURIComponent(search) +
            "&subject=" +
            encodeURIComponent(subject) +
            "&semester=" +
            encodeURIComponent(semester) +
            "&kind=" +
            encodeURIComponent(kind);


        const response =
            await fetch(url);


        const data =
            await response.json();


        renderResources(data);

        renderRecommended(
            data
        );

        updateSubjectFilter(
            data
        );


    } catch (error) {

        console.log(
            "Resources error:",
            error
        );

    }

}


function resourceIcon(kind) {

    const icons = {

        Notes: "📚",
        PYQ: "📝",
        Lab: "🧪",
        Practice: "⚡",
        Assignment: "📋",
        Reference: "🔗"

    };


    return icons[kind] || "📄";

}


function renderResources(data) {

    const grid =
        $("resourceGrid");


    grid.innerHTML = "";


    if (!data.length) {

        grid.innerHTML = `

            <div class="card">

                <h3>
                    Nothing here 🔍
                </h3>

                <p>
                    Try another search.
                </p>

            </div>

        `;

        return;

    }


    data.forEach(r => {

        const card =
            document.createElement("article");


        card.className =
            "card";


        const actions =
            r.stored

                ? `

                    <div class="actions">

                        <a
                            href="/api/resource/${r.id}/open"
                            target="_blank"
                        >
                            Open
                        </a>

                        <a
                            href="/api/resources/${r.id}/download"
                        >
                            Download
                        </a>

                    </div>

                  `

                : `

                    <span>
                        Demo resource
                    </span>

                  `;


        card.innerHTML = `

            <div class="card-top">

                <div class="icon">
                    ${resourceIcon(r.kind)}
                </div>

                <span class="tag">
                    ${escapeHTML(r.kind)}
                </span>

            </div>


            <h3>
                ${escapeHTML(r.title)}
            </h3>


            <p>
                ${escapeHTML(
                    r.description ||
                    "Student shared resource."
                )}
            </p>


            <div class="meta">

                <span>
                    ${escapeHTML(r.subject)}
                </span>

                <span>
                    ${escapeHTML(r.semester)}
                </span>

            </div>


            <div class="meta">

                <span>
                    ↓ ${r.downloads || 0}
                </span>

                ${actions}

            </div>

        `;


        grid.appendChild(card);

    });

}


function renderRecommended(data) {

    const grid =
        $("recommended");


    if (!grid) return;


    grid.innerHTML = "";


    if (!data.length) {

        grid.innerHTML = `

            <div class="card">

                <h3>
                    Your recommendations
                </h3>

                <p>
                    Resources will appear here.
                </p>

            </div>

        `;

        return;

    }


    let recommended =
        data.filter(
            resource =>
                profile &&
                resource.subject &&
                resource.subject
                    .toLowerCase()
                    .includes(
                        String(
                            profile.weak || ""
                        ).toLowerCase()
                    )
        );


    if (!recommended.length) {

        recommended =
            data.slice(0, 3);

    }


    recommended =
        recommended.slice(0, 3);


    recommended.forEach(r => {

        grid.innerHTML += `

            <article class="card">

                <div class="card-top">

                    <div class="icon">
                        ${resourceIcon(r.kind)}
                    </div>

                    <span class="tag">
                        FOR YOU
                    </span>

                </div>

                <h3>
                    ${escapeHTML(r.title)}
                </h3>

                <p>
                    ${escapeHTML(
                        r.description ||
                        "Recommended resource."
                    )}
                </p>

                <div class="meta">

                    <span>
                        ${escapeHTML(r.subject)}
                    </span>

                    <span>
                        ${escapeHTML(r.kind)}
                    </span>

                </div>

            </article>

        `;

    });

}


function updateSubjectFilter(data) {

    const select =
        $("subject");


    const current =
        select.value;


    const subjects =
        [
            ...new Set(
                data
                    .map(
                        item =>
                            item.subject
                    )
                    .filter(Boolean)
            )
        ];


    select.innerHTML =
        `<option value="">
            All Subjects
        </option>`;


    subjects.forEach(
        subject => {

            select.innerHTML += `

                <option value="${escapeHTML(subject)}">
                    ${escapeHTML(subject)}
                </option>

            `;

        }
    );


    select.value =
        current;

}


function clearFilters() {

    $("search").value = "";

    $("subject").value = "";

    $("semester").value = "";

    $("kind").value = "";


    loadResources();

}


/* =====================================================
   UPLOAD
===================================================== */

function openUpload() {

    $("uploadModal")
        .classList.add("show");

}


function closeUpload() {

    $("uploadModal")
        .classList.remove("show");

}


function showFileName(input) {

    if (
        input.files &&
        input.files.length
    ) {

        $("fileName")
            .textContent =
            input.files[0].name;

    }

}


$("uploadForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const formData =
                new FormData(this);


            try {

                const response =
                    await fetch(
                        "/api/upload",
                        {

                            method: "POST",

                            body:
                                formData

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.message ||
                        "Upload failed."
                    );

                    return;

                }


                alert(
                    "Resource uploaded 🚀"
                );


                this.reset();

                $("fileName")
                    .textContent =
                    "PDF, DOC, PPT, ZIP, images";


                closeUpload();

                loadResources();

                loadStats();

                loadAchievements();


            } catch (error) {

                alert(
                    "Upload failed."
                );

            }

        }
    );


/* =====================================================
   TESTS
===================================================== */

async function loadTests() {

    try {

        const response =
            await fetch("/api/tests");


        const tests =
            await response.json();


        const grid =
            $("testGrid");


        grid.innerHTML = "";


        if (!tests.length) {

            grid.innerHTML = `

                <div class="card">

                    <div class="icon">
                        🧠
                    </div>

                    <h3>
                        No tests yet
                    </h3>

                    <p>
                        Be the first to create one.
                    </p>

                </div>

            `;

            return;

        }


        tests.forEach(test => {

            grid.innerHTML += `

                <article class="card">

                    <div class="card-top">

                        <div class="icon">
                            🧠
                        </div>

                        <span class="tag">
                            ${escapeHTML(
                                test.subject
                            )}
                        </span>

                    </div>

                    <h3>
                        ${escapeHTML(
                            test.title
                        )}
                    </h3>

                    <p>
                        ${test.question_count}
                        questions
                    </p>

                    <button
                        onclick="takeTest(${test.id})"
                    >
                        Start →
                    </button>

                </article>

            `;

        });


    } catch (error) {

        console.log(
            "Tests error:",
            error
        );

    }

}


/* =====================================================
   TEST CREATION
===================================================== */

function openTestModal() {

    $("testModal")
        .classList.add("show");


    $("questionBuilder")
        .innerHTML = "";


    questions = [];

    addQuestion();

}


function closeTestModal() {

    $("testModal")
        .classList.remove("show");

}


function addQuestion() {

    const index =
        questions.length;


    questions.push({});


    $("questionBuilder")
        .insertAdjacentHTML(
            "beforeend",

            `

            <div
                class="card"
                style="margin-top:15px;"
                data-question="${index}"
            >

                <h3>
                    Question ${index + 1}
                </h3>


                <input
                    class="q-text"
                    placeholder="Question"
                >


                <input
                    class="q-a"
                    placeholder="Option A"
                >


                <input
                    class="q-b"
                    placeholder="Option B"
                >


                <input
                    class="q-c"
                    placeholder="Option C"
                >


                <input
                    class="q-d"
                    placeholder="Option D"
                >


                <select class="q-answer">

                    <option value="">
                        Correct answer
                    </option>

                    <option value="a">
                        A
                    </option>

                    <option value="b">
                        B
                    </option>

                    <option value="c">
                        C
                    </option>

                    <option value="d">
                        D
                    </option>

                </select>

            </div>

            `
        );

}


async function createTest() {

    const title =
        $("testTitle")
            .value.trim();


    const subject =
        $("testSubject")
            .value.trim();


    if (!title || !subject) {

        alert(
            "Enter title and subject."
        );

        return;

    }


    const blocks =
        document.querySelectorAll(
            "[data-question]"
        );


    const payloadQuestions = [];


    blocks.forEach(block => {

        payloadQuestions.push({

            question:
                block
                    .querySelector(".q-text")
                    .value.trim(),

            a:
                block
                    .querySelector(".q-a")
                    .value.trim(),

            b:
                block
                    .querySelector(".q-b")
                    .value.trim(),

            c:
                block
                    .querySelector(".q-c")
                    .value.trim(),

            d:
                block
                    .querySelector(".q-d")
                    .value.trim(),

            answer:
                block
                    .querySelector(".q-answer")
                    .value

        });

    });


    try {

        const response =
            await fetch(
                "/api/tests",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            title,
                            subject,
                            questions:
                                payloadQuestions

                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Could not create test."
            );

            return;

        }


        alert(
            "Test published! +10 XP ⚡"
        );


        closeTestModal();

        loadTests();

        loadDashboard();

        loadLeaderboard();

        loadAchievements();


    } catch (error) {

        alert(
            "Could not create test."
        );

    }

}


/* =====================================================
   TAKE TEST
===================================================== */

async function takeTest(testId) {

    try {

        const response =
            await fetch(
                `/api/tests/${testId}`
            );


        const data =
            await response.json();


        $("takeTestTitle")
            .textContent =
            data.test.title;


        const form =
            $("takeTestForm");


        form.innerHTML = "";


        data.questions.forEach(
            (question, index) => {

                form.innerHTML += `

                    <div
                        class="card"
                        style="margin-bottom:18px;"
                    >

                        <h3>
                            ${index + 1}.
                            ${escapeHTML(
                                question.question
                            )}
                        </h3>


                        ${option(
                            question.id,
                            "a",
                            question.a
                        )}

                        ${option(
                            question.id,
                            "b",
                            question.b
                        )}

                        ${option(
                            question.id,
                            "c",
                            question.c
                        )}

                        ${option(
                            question.id,
                            "d",
                            question.d
                        )}

                    </div>

                `;

            }
        );


        form.innerHTML += `

            <button
                class="main-btn"
                type="submit"
            >
                Submit Test ⚡
            </button>

        `;


        form.onsubmit =
            async function(event) {

                event.preventDefault();


                const answers = {};


                data.questions.forEach(
                    question => {

                        const selected =
                            document.querySelector(
                                `input[name="q${question.id}"]:checked`
                            );


                        if (selected) {

                            answers[
                                question.id
                            ] =
                                selected.value;

                        }

                    }
                );


                const resultResponse =
                    await fetch(
                        `/api/tests/${testId}/submit`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    answers
                                })

                        }
                    );


                const result =
                    await resultResponse.json();


                alert(
                    `Score: ${result.score}/${result.total}\n+${result.xp} XP ⚡`
                );


                closeTakeTest();

                loadDashboard();

                loadLeaderboard();

                loadAchievements();

            };


        $("takeTestModal")
            .classList.add("show");


    } catch (error) {

        alert(
            "Could not open test."
        );

    }

}


function option(
    id,
    value,
    text
) {

    return `

        <label
            style="
                display:block;
                margin:10px 0;
                padding:12px;
                border-radius:10px;
                cursor:pointer;
            "
        >

            <input
                type="radio"
                name="q${id}"
                value="${value}"
            >

            ${escapeHTML(text)}

        </label>

    `;

}


function closeTakeTest() {

    $("takeTestModal")
        .classList.remove("show");

}


/* =====================================================
   LEADERBOARD
===================================================== */

async function loadLeaderboard() {

    try {

        const response =
            await fetch(
                "/api/leaderboard"
            );


        const users =
            await response.json();


        const box =
            $("leaderboardList");


        box.innerHTML = "";


        users.forEach(
            (user, index) => {

                const medal =
                    index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `#${index + 1}`;


                box.innerHTML += `

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            padding:16px 8px;
                            border-bottom:1px solid rgba(255,255,255,.08);
                        "
                    >

                        <div>

                            <strong>
                                ${medal}
                                ${escapeHTML(
                                    user.name
                                )}
                            </strong>

                            <small
                                style="
                                    display:block;
                                    opacity:.65;
                                    margin-top:4px;
                                "
                            >
                                🔥 ${user.streak || 0}
                                day streak
                            </small>

                        </div>


                        <strong>
                            ${user.xp || 0} XP
                        </strong>

                    </div>

                `;

            }
        );


    } catch (error) {

        console.log(error);

    }

}


/* =====================================================
   ACHIEVEMENTS
===================================================== */

async function loadAchievements() {

    try {

        const response =
            await fetch(
                "/api/achievements"
            );


        const achievements =
            await response.json();


        const grid =
            $("achievementGrid");


        grid.innerHTML = "";


        if (!achievements.length) {

            grid.innerHTML = `

                <div class="card">

                    <h3>
                        🔒 Locked
                    </h3>

                    <p>
                        Study or create a resource
                        to unlock your first badge.
                    </p>

                </div>

            `;

            return;

        }


        achievements.forEach(
            achievement => {

                grid.innerHTML += `

                    <div class="card">

                        <div class="icon">
                            🏆
                        </div>

                        <h3>
                            ${escapeHTML(
                                achievement
                            )}
                        </h3>

                        <p>
                            Unlocked!
                        </p>

                    </div>

                `;

            }
        );


    } catch (error) {

        console.log(error);

    }

}


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        showStep();


        if (profile) {

            startApp();

        }

    }
);


/* =====================================================
   CLOSE MODALS BY CLICKING OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList.contains(
                "modal"
            )
        ) {

            event.target
                .classList.remove("show");

        }

    }
);