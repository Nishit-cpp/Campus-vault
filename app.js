/* =====================================================
   CAMPUS VAULT - FRONTEND
===================================================== */

let step = 1;
let profile = null;
let selectedWeak = "";
let questions = [];

try {
    profile = JSON.parse(localStorage.getItem("campusProfile"));
} catch (error) {
    profile = null;
}

const branchSubjects = {
    "CSE": ["MOAM", "FOLIH", "EEE Lab", "C Programming", "Engineering Mathematics", "Engineering Physics", "Engineering Chemistry", "Data Structures", "Digital Logic", "Discrete Math", "Operating Systems", "DBMS"],
    "ECE": ["Network Theory", "Electronic Devices", "EEE Lab", "Signals & Systems", "Digital Circuits", "Microprocessors", "Control Systems"],
    "MECH": ["Engineering Mechanics", "Thermodynamics", "Fluid Mechanics", "Machine Drawing", "Heat Transfer"],
    "CIVIL": ["Solid Mechanics", "Surveying", "Structural Analysis", "Geotechnical Engg", "Transportation Engg"],
    "EEE": ["Circuit Theory", "Electrical Machines", "Power Systems", "Control Systems", "Power Electronics"]
};

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
    const el = $(id); 
    if (el) { 
        el.scrollIntoView({ behavior: "smooth", block: "start" }); 
    } 
}

/* ================= DARK MODE LOGIC ================= */
function initTheme() {
    const isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
        document.body.classList.add("dark-theme");
        if ($("themeToggle")) $("themeToggle").textContent = "☀️";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("darkMode", isDark);
    if ($("themeToggle")) $("themeToggle").textContent = isDark ? "☀️" : "🌙";
}

/* ================= ONBOARDING ================= */
function showStep() {
    const area = $("formArea");
    const q = $("question");
    const text = $("questionText");
    const stepText = $("stepText");
    
    if (!area) return;

    if (step === 1) {
        stepText.textContent = "STEP 1 OF 3"; 
        q.textContent = "Configure Profile"; 
        text.textContent = "Initialize your system parameters.";
        area.innerHTML = `
            <div class="input-group">
                <input id="name" placeholder="Name">
                <select id="course">
                    <option value="">Course</option>
                    <option>B.Tech</option>
                    <option>B.Sc</option>
                    <option>BCA</option>
                </select>
                <select id="branch">
                    <option value="">Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">Mechanical</option>
                    <option value="CIVIL">Civil</option>
                </select>
                <select id="year">
                    <option value="">Year</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                </select>
                <select id="semester">
                    <option value="">Semester</option>
                    <option>Semester 1</option>
                    <option>Semester 2</option>
                    <option>Semester 3</option>
                    <option>Semester 4</option>
                </select>
            </div>
        `;
    } else if (step === 2) {
        stepText.textContent = "STEP 2 OF 3"; 
        q.textContent = "Where do you want to improve?"; 
        text.textContent = "Pick your focus.";
        area.innerHTML = `
            <div class="choices">
                <div class="choice" onclick="pick(this,'Programming')">💻 Programming</div>
                <div class="choice" onclick="pick(this,'Mathematics')">📐 Mathematics</div>
                <div class="choice" onclick="pick(this,'Core Subjects')">📚 Core Subjects</div>
                <div class="choice" onclick="pick(this,'Problem Solving')">🧩 Problem Solving</div>
            </div>
            <input id="weak" placeholder="Or type your own target subject (e.g. MOAM)">
            <input id="strong" placeholder="What's your strength?">
        `;
    } else if (step === 3) {
        stepText.textContent = "STEP 3 OF 3"; 
        q.textContent = "Execution Plan"; 
        text.textContent = "Set operating limits.";
        area.innerHTML = `
            <div class="choices">
                <div class="choice" onclick="pickGoal(this,'Score better in exams')">📚 Academics</div>
                <div class="choice" onclick="pickGoal(this,'Build projects')">🛠 Projects</div>
                <div class="choice" onclick="pickGoal(this,'Prepare for placements')">💼 Placements</div>
            </div>
            <select id="hours">
                <option value="">Daily target</option>
                <option>30 minutes/day</option>
                <option>1 hour/day</option>
                <option>2 hours/day</option>
            </select>
            <input id="goal" placeholder="Or type your own goal...">
        `;
    }
}

function pick(element, value) { 
    document.querySelectorAll(".choice").forEach(i => i.classList.remove("selected")); 
    element.classList.add("selected"); 
    selectedWeak = value; 
    if ($("weak")) $("weak").value = value; 
}

function pickGoal(element, value) { 
    document.querySelectorAll(".choice").forEach(i => i.classList.remove("selected")); 
    element.classList.add("selected"); 
    if ($("goal")) $("goal").value = value; 
}

async function nextStep() {
    if (step === 1) {
        const name = $("name").value.trim();
        const course = $("course").value;
        const branch = $("branch").value;
        const year = $("year").value;
        const semester = $("semester").value;
        
        if (!name || !course || !branch || !year || !semester) { 
            alert("Required parameters missing."); 
            return; 
        }
        profile = { name, course, branch, year, semester };
        step = 2; 
        showStep();
    } else if (step === 2) {
        profile.weak = $("weak").value.trim() || selectedWeak || "Programming"; 
        profile.strong = $("strong").value.trim();
        step = 3; 
        showStep();
    } else if (step === 3) {
        profile.goal = $("goal").value.trim(); 
        profile.hours = $("hours").value;
        
        if (!profile.goal || !profile.hours) { 
            alert("Choose your goal and daily target."); 
            return; 
        }
        
        localStorage.setItem("campusProfile", JSON.stringify(profile));
        await saveProfileToBackend();
        startApp();
    }
}

async function saveProfileToBackend() {
    try {
        let target = 60;
        if (profile.hours === "30 minutes/day") target = 30;
        if (profile.hours === "1 hour/day") target = 60;
        if (profile.hours === "2 hours/day") target = 120;
        
        await fetch("/api/profile", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ ...profile, daily_target: target }) 
        });
    } catch (error) { 
        console.log(error); 
    }
}

/* ================= APP INITIALIZATION ================= */
function startApp() {
    if ($("onboarding")) $("onboarding").classList.add("hidden");
    if ($("app")) $("app").classList.remove("hidden");
    
    if ($("studentName")) $("studentName").textContent = profile.name;
    if ($("weakArea")) $("weakArea").textContent = profile.weak;
    if ($("studyHours")) $("studyHours").textContent = profile.hours;
    if ($("goalTitle")) $("goalTitle").textContent = profile.goal;
    
    let plan = `As a ${profile.year} ${profile.course} ${profile.branch} student, your primary focus is to ${profile.goal.toLowerCase()}. `;
    plan += `Since you want to improve in ${profile.weak}, dedicate your target of ${profile.hours} specifically to active practice and foundational review in this area. `;
    if ($("goalText")) $("goalText").textContent = plan;
    
    if($("branchFilter") && profile.branch) {
        $("branchFilter").value = profile.branch;
        updateDynamicSubjects();
    }
    
    loadResources(); 
    loadStats(); 
    loadDashboard(); 
    loadTests(); 
    loadLeaderboard(); 
    loadAchievements();
}

function showProfile() {
    $("profileInfo").innerHTML = `
        <div class="user-details" style="margin-bottom: 20px;">
            <p style="margin-bottom:8px;"><strong>Name:</strong> ${escapeHTML(profile.name)}</p>
            <p style="margin-bottom:8px;"><strong>Config:</strong> ${escapeHTML(profile.year)} ${escapeHTML(profile.course)} ${escapeHTML(profile.branch)}</p>
            <p style="margin-bottom:8px;"><strong>Focus:</strong> ${escapeHTML(profile.weak)}</p>
            <p style="margin-bottom:8px;"><strong>Goal:</strong> ${escapeHTML(profile.goal)}</p>
        </div>
        <button class="main-btn" onclick="logoutUser()" style="background: #ef4444; border-color: #ef4444;">Log Out / Reset</button>
    `;
    $("profileModal").classList.add("show");
}

function logoutUser() { 
    localStorage.removeItem("campusProfile"); 
    location.reload(); 
}

function closeProfile() { 
    $("profileModal").classList.remove("show"); 
}

/* ================= DASHBOARD & STATS ================= */
async function loadStats() {
    try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if ($("total")) $("total").textContent = data.total;
    } catch (error) { 
        console.log(error); 
    }
}

async function loadDashboard() {
    try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        
        if ($("xp")) $("xp").textContent = data.user.xp || 0;
        if ($("streak")) $("streak").textContent = data.user.streak || 0;
        if ($("studyStreak")) $("studyStreak").textContent = data.user.streak || 0;
        if ($("level")) $("level").textContent = data.level || 1;
        if ($("journeyProgress")) $("journeyProgress").style.width = (data.user.xp % 100) + "%";

        let totalMinutes = 0;
        if (data.recent) {
            data.recent.forEach(session => totalMinutes += Number(session.minutes || 0));
        }
        if ($("totalStudy")) $("totalStudy").textContent = totalMinutes + " min";
        
        renderStudyGraph(data.recent || []);
    } catch (error) { 
        console.log(error); 
    }
}

function renderStudyGraph(sessions) {
    const graph = $("studyGraph");
    if (!graph) return;
    
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); 
        d.setDate(d.getDate() - i);
        days.push({ 
            key: d.toISOString().slice(0, 10), 
            label: d.toLocaleDateString(undefined, { weekday: "short" }), 
            minutes: 0 
        });
    }
    
    sessions.forEach(session => {
        const key = String(session.created_at).slice(0, 10);
        const day = days.find(item => item.key === key);
        if (day) day.minutes += Number(session.minutes || 0);
    });
    
    const max = Math.max(60, ...days.map(d => d.minutes));
    
    graph.innerHTML = days.map(day => {
        const height = Math.max(8, (day.minutes / max) * 100);
        return `
            <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:7px;">
                <small style="font-size:10px;">${day.minutes}m</small>
                <div style="height:90px; width:100%; display:flex; align-items:flex-end; justify-content:center;">
                    <div style="height:${height}%; width:22px; border-radius:4px; background:var(--accent);"></div>
                </div>
                <small style="font-size:11px;">${day.label}</small>
            </div>
        `;
    }).join("");
}

/* ================= MODALS & FORMS ================= */
function openStudyModal() { $("studyModal").classList.add("show"); }
function closeStudyModal() { $("studyModal").classList.remove("show"); }
function openUpload() { $("uploadModal").classList.add("show"); }
function closeUpload() { $("uploadModal").classList.remove("show"); }
function showFileName(input) { 
    if (input.files.length && $("fileName")) $("fileName").textContent = input.files[0].name; 
}

/* ================= DYNAMIC DROPDOWNS & RESOURCES ================= */
function updateDynamicSubjects() {
    const branch = $("branchFilter").value;
    const subjectSelect = $("subject");
    if (!subjectSelect) return;
    
    subjectSelect.innerHTML = `<option value="">All Subjects</option>`;
    if (branch && branchSubjects[branch]) {
        branchSubjects[branch].forEach(sub => {
            subjectSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
    }
}

function resourceIcon(kind) {
    const icons = { Notes: "📚", PYQ: "📝", Lab: "🧪", Practice: "⚡", Assignment: "📋", Reference: "🔗" };
    return icons[kind] || "📄";
}

async function loadResources() {
    try {
        const s = $("search").value || "";
        const b = $("branchFilter").value || "";
        const sub = $("subject").value || "";
        const sem = $("semester").value || "";
        const k = $("kind").value || "";
        
        const url = `/api/resources?search=${encodeURIComponent(s)}&branch=${encodeURIComponent(b)}&subject=${encodeURIComponent(sub)}&semester=${encodeURIComponent(sem)}&kind=${encodeURIComponent(k)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        const grid = $("resourceGrid");
        
        if (!grid) return;
        grid.innerHTML = "";
        
        if (!data.length) { 
            grid.innerHTML = `<div class="card"><p>No resources found. Be the first to upload one!</p></div>`; 
            return; 
        }
        
        data.forEach(r => {
            const actions = r.stored 
                ? `<div class="actions"><a href="/api/resource/${r.id}/open" target="_blank">Open</a> <a href="/api/resources/${r.id}/download">Download</a></div>` 
                : `<span style="font-size:12px; color:var(--text-muted);">Demo resource</span>`;
                
            grid.innerHTML += `
                <div class="card">
                    <div class="card-top">
                        <div class="icon">${resourceIcon(r.kind)}</div>
                        <span class="mono-tag">${escapeHTML(r.kind)}</span>
                    </div>
                    <h3 style="margin: 12px 0 8px;">${escapeHTML(r.title)}</h3>
                    <p style="font-size: 13px; color: var(--text-muted); min-height:40px;">${escapeHTML(r.description || "Student shared resource.")}</p>
                    <div class="meta" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border); font-size: 12px;">
                        <span>${escapeHTML(r.branch || 'General')} | ${escapeHTML(r.subject)}</span>
                    </div>
                    <div class="meta" style="margin-top: 5px;">
                        <span>↓ ${r.downloads || 0}</span>
                        ${actions}
                    </div>
                </div>
            `;
        });
    } catch (error) { 
        console.log(error); 
    }
}

function clearFilters() { 
    if($("search")) $("search").value = ""; 
    if($("branchFilter")) $("branchFilter").value = ""; 
    if($("subject")) $("subject").value = ""; 
    if($("semester")) $("semester").value = ""; 
    if($("kind")) $("kind").value = ""; 
    updateDynamicSubjects(); 
    loadResources(); 
}

/* ================= RESTORED TESTS FEATURE ================= */
async function loadTests() {
    try {
        const res = await fetch("/api/tests"); 
        const tests = await res.json();
        const grid = $("testGrid"); 
        
        if (!grid) return;
        grid.innerHTML = "";
        
        if (!tests.length) { 
            grid.innerHTML = `<div class="card"><div class="icon">🧠</div><h3 style="margin-top:12px;">No tests yet</h3><p>Be the first to create one.</p></div>`; 
            return; 
        }
        
        tests.forEach(test => {
            grid.innerHTML += `
                <article class="card">
                    <div class="card-top">
                        <div class="icon">🧠</div>
                        <span class="mono-tag">${escapeHTML(test.subject)}</span>
                    </div>
                    <h3 style="margin-top:12px;">${escapeHTML(test.title)}</h3>
                    <p style="margin-bottom:12px;">${test.question_count} questions</p>
                    <button class="outline-btn" style="width:100%;" onclick="takeTest(${test.id})">Take Test →</button>
                </article>
            `;
        });
    } catch (error) { 
        console.log(error); 
    }
}

function openTestModal() { 
    $("testModal").classList.add("show"); 
    $("questionBuilder").innerHTML = ""; 
    questions = []; 
    addQuestion(); 
}

function closeTestModal() { 
    $("testModal").classList.remove("show"); 
}

function addQuestion() {
    const index = questions.length; 
    questions.push({});
    $("questionBuilder").insertAdjacentHTML("beforeend", `
        <div class="card" style="margin-top:15px; padding: 15px;" data-question="${index}">
            <h3 style="margin-top:0; font-size:14px;">Question ${index + 1}</h3>
            <input class="q-text" placeholder="Question">
            <div class="two">
                <input class="q-a" placeholder="Option A">
                <input class="q-b" placeholder="Option B">
                <input class="q-c" placeholder="Option C">
                <input class="q-d" placeholder="Option D">
            </div>
            <select class="q-answer">
                <option value="">Correct answer</option>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
            </select>
        </div>
    `);
}

async function createTest() {
    const title = $("testTitle").value.trim();
    const subject = $("testSubject").value.trim();
    
    if (!title || !subject) { 
        alert("Enter title and subject."); 
        return; 
    }
    
    const blocks = document.querySelectorAll("[data-question]");
    const payloadQuestions = [];
    
    blocks.forEach(block => {
        payloadQuestions.push({
            question: block.querySelector(".q-text").value.trim(),
            a: block.querySelector(".q-a").value.trim(), 
            b: block.querySelector(".q-b").value.trim(),
            c: block.querySelector(".q-c").value.trim(), 
            d: block.querySelector(".q-d").value.trim(),
            answer: block.querySelector(".q-answer").value
        });
    });

    try {
        const res = await fetch("/api/tests", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ title, subject, questions: payloadQuestions }) 
        });
        const result = await res.json();
        
        if (!res.ok) { 
            alert(result.message || "Could not create test."); 
            return; 
        }
        
        alert("Test published! +10 XP ⚡");
        closeTestModal(); 
        loadTests(); 
        loadDashboard(); 
        loadLeaderboard(); 
        loadAchievements();
    } catch (error) { 
        alert("Could not create test."); 
    }
}

async function takeTest(testId) {
    try {
        const res = await fetch(`/api/tests/${testId}`); 
        const data = await res.json();
        
        $("takeTestTitle").textContent = data.test.title;
        const form = $("takeTestForm"); 
        form.innerHTML = "";

        data.questions.forEach((q, index) => {
            form.innerHTML += `
                <div class="card" style="margin-bottom:15px; padding: 15px;">
                    <h3 style="margin-top:0;">${index + 1}. ${escapeHTML(q.question)}</h3>
                    ${option(q.id, "a", q.a)}
                    ${option(q.id, "b", q.b)}
                    ${option(q.id, "c", q.c)}
                    ${option(q.id, "d", q.d)}
                </div>
            `;
        });
        form.innerHTML += `<button class="main-btn" type="submit">Submit Answers ⚡</button>`;
        
        form.onsubmit = async function(e) {
            e.preventDefault();
            const answers = {};
            data.questions.forEach(q => {
                const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
                if (selected) answers[q.id] = selected.value;
            });

            const resultRes = await fetch(`/api/tests/${testId}/submit`, { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ answers }) 
            });
            const result = await resultRes.json();
            
            alert(`Score: ${result.score}/${result.total}\n+${result.xp} XP ⚡`);
            closeTakeTest(); 
            loadDashboard(); 
            loadLeaderboard(); 
            loadAchievements();
        };
        $("takeTestModal").classList.add("show");
    } catch (error) { 
        alert("Could not open test."); 
    }
}

function option(id, value, text) {
    return `
        <label style="display:block; margin:8px 0; padding:10px; background:var(--bg-main); border:1px solid var(--border); border-radius:6px; cursor:pointer;">
            <input type="radio" name="q${id}" value="${value}"> ${escapeHTML(text)}
        </label>
    `;
}

function closeTakeTest() { 
    $("takeTestModal").classList.remove("show"); 
}

/* ================= RESTORED LEADERBOARD & ACHIEVEMENTS ================= */
async function loadLeaderboard() {
    try {
        const res = await fetch("/api/leaderboard"); 
        const users = await res.json();
        const box = $("leaderboardList"); 
        
        if (!box) return;
        box.innerHTML = "";
        
        users.forEach((user, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
            box.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border);">
                    <div>
                        <strong style="font-size:16px;">${medal} ${escapeHTML(user.name)}</strong>
                        <small style="display:block; color:var(--text-muted); margin-top:4px;">🔥 ${user.streak || 0} day streak</small>
                    </div>
                    <strong style="color:var(--accent); font-size:18px;">${user.xp || 0} XP</strong>
                </div>
            `;
        });
    } catch (error) { 
        console.log(error); 
    }
}

async function loadAchievements() {
    try {
        const res = await fetch("/api/achievements"); 
        const achievements = await res.json();
        const grid = $("achievementGrid"); 
        
        if (!grid) return;
        grid.innerHTML = "";
        
        if (!achievements.length) {
            grid.innerHTML = `
                <div class="card">
                    <div class="icon" style="opacity:0.5;">🔒</div>
                    <h3 style="margin-top:12px;">Locked</h3>
                    <p>Study or upload a resource to unlock your first badge.</p>
                </div>
            `;
            return;
        }
        
        achievements.forEach(achievement => {
            grid.innerHTML += `
                <div class="card">
                    <div class="icon">🏆</div>
                    <h3 style="margin-top:12px;">${escapeHTML(achievement)}</h3>
                    <p style="color:var(--accent); font-weight:bold;">Unlocked!</p>
                </div>
            `;
        });
    } catch (error) { 
        console.log(error); 
    }
}

/* ================= EVENT LISTENERS (SAFE MOUNTING) ================= */
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    showStep();
    if (profile) startApp();

    const studyForm = $("studyForm");
    if (studyForm) {
        studyForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const subject = $("studySubject").value.trim();
            const minutes = Number($("studyMinutes").value);
            const note = $("studyNote").value.trim();
            
            if (!subject || minutes <= 0) return;
            
            try {
                const res = await fetch("/api/study", { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ subject, minutes, note }) 
                });
                const result = await res.json();
                
                alert(`Session saved! +${result.earned} XP ⚡`);
                this.reset(); 
                closeStudyModal(); 
                loadDashboard(); 
                loadLeaderboard(); 
                loadAchievements();
            } catch (error) { 
                alert("Something went wrong."); 
            }
        });
    }

    const uploadForm = $("uploadForm");
    if (uploadForm) {
        uploadForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            try {
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (res.ok) { 
                    alert("Resource uploaded 🚀"); 
                    this.reset(); 
                    if($("fileName")) $("fileName").textContent = "PDF, DOC, PPT, ZIP, images"; 
                    closeUpload(); 
                    loadResources(); 
                    loadStats(); 
                    loadAchievements(); 
                }
            } catch (error) { 
                alert("Upload failed."); 
            }
        });
    }
});

document.addEventListener("click", e => { 
    if (e.target.classList.contains("modal")) e.target.classList.remove("show"); 
});