// Student Academic Monitoring System - UI Interactions & API Integration
document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "https://student-sucess-ai.onrender.com";
    const navButtons = document.querySelectorAll(".nav-item");
    const viewSections = document.querySelectorAll(".page");
    const pageTitle = document.getElementById("pageTitle");
    const currentSection = document.getElementById("currentSection");
    const sidebar = document.getElementById("sidebar");
    const mobileMenu = document.getElementById("mobileMenu");
    const searchTrigger = document.getElementById("searchTrigger");
    const searchModal = document.getElementById("searchModal");
    const closeSearch = document.getElementById("closeSearch");
    const globalSearch = document.getElementById("globalSearch");
    const studentSearch = document.getElementById("studentSearch");
    const aiPrompt = document.getElementById("aiPrompt");
    const aiSend = document.getElementById("aiSend");
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toastText");
    const footerYear = document.getElementById("footerYear");
    const studentDirectory = document.getElementById("studentDirectory");
    const studentEmpty = document.getElementById("studentEmpty");
    const segmentFilterNotice = document.getElementById("segmentFilterNotice");

    const routes = {
        overview: { title: "Dashboard Overview", label: "OVERVIEW" },
        students: { title: "Student Records", label: "STUDENTS" },
        analytics: { title: "Batch Analytics", label: "ANALYTICS" },
        risk: { title: "Risk Assessment", label: "RISK" },
        ai: { title: "Predictive Analysis", label: "PREDICTIONS" },
        actions: { title: "Intervention Action Center", label: "ACTION CENTER" },
        learning: { title: "Peer Learning Exchange", label: "PEER LEARNING" },
        data: { title: "Data Lab", label: "DATA LAB" },
        settings: { title: "Settings", label: "SETTINGS" },
        help: { title: "Help Center", label: "HELP CENTER" }
    };
    const ACTION_STORAGE_KEY = "studentSuccessDemo.actions.v1";
    const LEARNING_STORAGE_KEY = "studentSuccessDemo.learning.v1";
    const SETTINGS_STORAGE_KEY = "studentSuccessDemo.settings.v1";
    const demoLearningPosts = [
        { id: "demo-python", alias: "Code buddy", intent: "teach", topic: "Python basics", details: "Happy to help with loops, functions, and a small first project.", mode: "Online group", demo: true, interested: false },
        { id: "demo-interview", alias: "Future ready", intent: "learn", topic: "Interview practice", details: "Looking for a friendly peer to practise common placement questions.", mode: "In-person group", demo: true, interested: false },
        { id: "demo-design", alias: "Creative corner", intent: "teach", topic: "Canva & presentation design", details: "Can show simple ways to make clear, polished project slides.", mode: "Either", demo: true, interested: false }
    ];
    let students = [];
    let backendStudents = [];
    let importedDataset = false;
    let interventionRecords = {};
    let learningPosts = demoLearningPosts.slice();
    let dashboardSettings = { tableDensity: "comfortable", reducedMotion: false };
    let learningFilter = "all";
    let activeFilter = "all";
    let activeSegment = "";
    let toastTimer = null;

    function showNotification(message) {
        if (!toast || !toastText) return;
        toastText.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3200);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    function readLocalRecords(key, fallback, validator) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!validator(parsed)) throw new Error("Saved demo data has an unexpected format.");
            return parsed;
        } catch (error) {
            showNotification("Browser-only demo data could not be read: " + error.message);
            return fallback;
        }
    }

    function saveLocalRecords(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            showNotification("Could not save this demo update in this browser: " + error.message);
            return false;
        }
    }

    dashboardSettings = Object.assign(
        { tableDensity: "comfortable", reducedMotion: false },
        readLocalRecords(SETTINGS_STORAGE_KEY, {}, function (value) {
            return value !== null && typeof value === "object" && !Array.isArray(value) &&
                ["comfortable", "compact"].includes(value.tableDensity || "comfortable") &&
                typeof (value.reducedMotion == null ? false : value.reducedMotion) === "boolean";
        })
    );

    function applyDashboardSettings() {
        document.body.dataset.tableDensity = dashboardSettings.tableDensity;
        document.body.classList.toggle("reduce-motion", dashboardSettings.reducedMotion);
        const densityControl = document.getElementById("tableDensity");
        const motionControl = document.getElementById("reducedMotion");
        if (densityControl) densityControl.value = dashboardSettings.tableDensity;
        if (motionControl) motionControl.checked = dashboardSettings.reducedMotion;
    }

    function persistDashboardSettings() {
        if (saveLocalRecords(SETTINGS_STORAGE_KEY, dashboardSettings)) {
            applyDashboardSettings();
            showNotification("Dashboard preference saved on this device.");
        }
    }

    interventionRecords = Object.assign(Object.create(null),
        readLocalRecords(ACTION_STORAGE_KEY, {}, function (value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
        }));
    learningPosts = readLocalRecords(LEARNING_STORAGE_KEY, demoLearningPosts.slice(), function (value) {
        return Array.isArray(value) && value.every(function (post) {
            return post && typeof post.id === "string" &&
                ["teach", "learn"].includes(post.intent) &&
                typeof post.alias === "string" && typeof post.topic === "string";
        });
    });

    async function apiRequest(path) {
        const response = await fetch(API_BASE_URL + path, {
            headers: { Accept: "application/json" }
        });
        if (!response.ok) {
            throw new Error("Backend request failed (" + response.status + ").");
        }
        return response.json();
    }

    function setConnectionState(connected, message) {
        const card = document.getElementById("connectionCard");
        const messageNode = document.getElementById("connectionMessage");
        const statusText = connected ? "CONNECTED" : "DISCONNECTED";
        if (card) card.dataset.state = connected ? "connected" : "disconnected";
        if (messageNode) messageNode.textContent = message;
        document.querySelectorAll("#studentsConnectionBadge, #analyticsConnectionBadge").forEach(function (badge) {
            badge.textContent = statusText;
            badge.classList.toggle("is-connected", connected);
        });
        document.querySelectorAll(".hero-meta span").forEach(function (item, index) {
            if (index === 0) item.lastChild.textContent = importedDataset
                ? " Session CSV active"
                : connected ? " Backend connected" : " Backend offline";
            if (index === 1) item.lastChild.textContent = importedDataset
                ? " Not uploaded"
                : connected ? " Live student data" : " Data unavailable";
        });
    }

    function switchTab(viewId) {
        if (!routes[viewId]) return;
        viewSections.forEach(function (section) {
            section.classList.toggle("is-active", section.dataset.view === viewId);
        });
        navButtons.forEach(function (button) {
            button.classList.toggle("active", button.dataset.page === viewId);
        });
        if (pageTitle) pageTitle.textContent = routes[viewId].title;
        if (currentSection) currentSection.textContent = routes[viewId].label;
        if (sidebar) sidebar.classList.remove("open");
        closeSearchDialog();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            if (this.dataset.page) switchTab(this.dataset.page);
        });
    });
    document.querySelectorAll("[data-go-page]").forEach(function (button) {
        button.addEventListener("click", function () {
            if (this.dataset.goPage) switchTab(this.dataset.goPage);
        });
    });

    if (mobileMenu && sidebar) {
        mobileMenu.addEventListener("click", function () {
            sidebar.classList.toggle("open");
        });
    }
    document.addEventListener("click", function (event) {
        if (!sidebar || !mobileMenu) return;
        if (sidebar.classList.contains("open") && !sidebar.contains(event.target) && !mobileMenu.contains(event.target)) {
            sidebar.classList.remove("open");
        }
    });

    function openSearchDialog() {
        if (!searchModal) return;
        searchModal.classList.add("open");
        searchModal.setAttribute("aria-hidden", "false");
        setTimeout(function () {
            if (globalSearch) globalSearch.focus();
        }, 50);
    }
    function closeSearchDialog() {
        if (!searchModal) return;
        searchModal.classList.remove("open");
        searchModal.setAttribute("aria-hidden", "true");
    }
    if (searchTrigger) searchTrigger.addEventListener("click", openSearchDialog);
    if (closeSearch) closeSearch.addEventListener("click", closeSearchDialog);
    if (searchModal) {
        searchModal.addEventListener("click", function (event) {
            if (event.target === searchModal) closeSearchDialog();
        });
    }
    document.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openSearchDialog();
        }
        if (event.key === "Escape") {
            closeSearchDialog();
            if (sidebar) sidebar.classList.remove("open");
        }
    });

    function riskClass(risk) {
        const normalized = String(risk || "").toUpperCase();
        if (normalized === "HIGH") return "high";
        if (normalized === "MEDIUM") return "medium";
        return "stable";
    }

    function displayScore(score) {
        return (Math.round((score + Number.EPSILON) * 10) / 10).toFixed(1);
    }

    function renderStudentDirectory() {
        if (!studentDirectory) return;
        const query = studentSearch ? studentSearch.value.trim().toLowerCase() : "";
        const matchingStudents = students.filter(function (student) {
            const matchesFilter = activeFilter === "all" || riskClass(student.risk) === activeFilter;
            const searchableText = [
                student.student_id, student.department, student.risk, student.risk_factors,
                student.segment_label, student.risk_drivers && student.risk_drivers.map(function (driver) {
                    return driver.message;
                }).join(" ")
            ].join(" ").toLowerCase();
            const matchesSegment = !activeSegment || student.segment === activeSegment;
            return matchesFilter && matchesSegment && searchableText.includes(query);
        });

        if (studentEmpty) studentEmpty.hidden = students.length > 0;
        if (segmentFilterNotice) {
            segmentFilterNotice.hidden = !activeSegment;
            const activeSegmentLabel = document.getElementById("activeSegmentLabel");
            if (activeSegmentLabel) {
                const match = students.find(function (student) {
                    return student.segment === activeSegment;
                });
                activeSegmentLabel.textContent = match ? match.segment_label : activeSegment;
            }
        }
        studentDirectory.innerHTML = matchingStudents.length ? matchingStudents.map(function (student) {
            const id = escapeHtml(student.student_id);
            const risk = escapeHtml(student.risk || "UNKNOWN");
            return '<button class="student-record" type="button" data-student-id="' + id + '">' +
                '<span class="student-record-avatar">' + escapeHtml(String(student.student_id || "?").slice(-2)) + '</span>' +
                '<span class="student-record-main"><strong>' + id + '</strong>' +
                '<small>' + escapeHtml(student.segment_label || student.department || "Department unavailable") + '</small></span>' +
                '<span class="student-record-score">' + escapeHtml(student.success_score) + '<small>score</small></span>' +
                '<span class="student-risk risk-' + riskClass(student.risk) + '">' + risk + '</span></button>';
        }).join("") : (students.length ? '<p class="directory-empty">No students match this search or risk filter.</p>' : "");

        studentDirectory.querySelectorAll("[data-student-id]").forEach(function (button) {
            button.addEventListener("click", function () {
                const selected = students.find(function (student) {
                    return String(student.student_id) === button.dataset.studentId;
                });
                if (selected) renderStudentDetails(selected);
            });
        });
    }

    function renderStudentDetails(student) {
        const inspector = document.querySelector(".student-inspector");
        if (!inspector) return;
        const scoreBreakdown = Array.isArray(student.score_breakdown) ? student.score_breakdown : [];
        const riskDrivers = Array.isArray(student.risk_drivers) ? student.risk_drivers : [];
        const scenarioPlans = {
            academic_recovery: [
                { key: "cgpa", increase: 0.5 },
                { key: "attendance", increase: 5 }
            ],
            academic_placement_support: [
                { key: "placement_score", increase: 10 },
                { key: "coding_score", increase: 10 }
            ],
            placement_ready: [
                { key: "placement_score", increase: 5 },
                { key: "coding_score", increase: 5 }
            ],
            engagement_support: [
                { key: "attendance", increase: 5 },
                { key: "lms_score", increase: 10 },
                { key: "engagement", increase: 10 }
            ],
            balanced_progress: [
                { key: "skills_score", increase: 5 },
                { key: "feedback_score", increase: 5 }
            ]
        };
        const factorByKey = {};
        scoreBreakdown.forEach(function (factor) {
            factorByKey[factor.key] = factor;
        });
        const scenarioAdjustments = [];
        const scenarioInputs = (scenarioPlans[student.segment] || []).filter(function (plan) {
            return factorByKey[plan.key];
        }).map(function (plan) {
            const factor = factorByKey[plan.key];
            const isCgpa = plan.key === "cgpa";
            const currentValue = Number(factor.value) || 0;
            const maxIncrease = Math.max(0, Math.min(isCgpa ? 1 : 20, (isCgpa ? 10 : 100) - currentValue));
            const initialIncrease = Math.min(plan.increase, maxIncrease);
            scenarioAdjustments.push({
                increase: initialIncrease,
                weight: Number(factor.weight) || 0,
                multiplier: isCgpa ? 10 : 1
            });
            return '<label class="scenario-control" for="scenario-' + escapeHtml(plan.key) + '">' +
                '<span>' + escapeHtml(factor.label) + '</span><strong><output id="scenario-value-' +
                escapeHtml(plan.key) + '">' + initialIncrease.toFixed(isCgpa ? 1 : 0) +
                '</output>' + (isCgpa ? '/10' : ' pts') + '</strong><input type="range" id="scenario-' +
                escapeHtml(plan.key) + '" data-scenario-factor="' + escapeHtml(plan.key) +
                '" data-weight="' + escapeHtml(factor.weight) + '" data-multiplier="' +
                (isCgpa ? "10" : "1") + '" min="0" max="' +
                maxIncrease + '" step="' + (isCgpa ? "0.1" : "1") + '" value="' +
                initialIncrease + '"></label>';
        }).join("");
        const currentScore = Number(student.success_score) || 0;
        const currentIntervention = interventionRecords[String(student.student_id)] || {};
        const studentPeers = students.filter(function (candidate) {
            return String(candidate.department || "") === String(student.department || "") &&
                String(candidate.student_id) !== String(student.student_id);
        });
        const graphMetrics = [
            { label: "Student success score", key: "success_score", scale: 1, unit: "/100" },
            { label: "Academic performance (CGPA)", key: "cgpa", scale: 10, unit: "/10" },
            { label: "Attendance", key: "attendance", scale: 1, unit: "%" },
            { label: "LMS performance", key: "lms_score", scale: 1, unit: "%" },
            { label: "Engagement", key: "engagement", scale: 1, unit: "%" },
            { label: "Coding", key: "coding_score", scale: 1, unit: "%" },
            { label: "Skills", key: "skills_score", scale: 1, unit: "%" },
            { label: "Placement readiness", key: "placement_score", scale: 1, unit: "%" },
            { label: "Student feedback", key: "feedback_score", scale: 1, unit: "%" }
        ];
        const indicatorData = graphMetrics.map(function (metric) {
            const rawStudentValue = student[metric.key];
            const studentValue = rawStudentValue === null || rawStudentValue === undefined || rawStudentValue === ""
                ? null : Number(rawStudentValue);
            const peerValues = studentPeers.map(function (peer) {
                const rawValue = peer[metric.key];
                return rawValue === null || rawValue === undefined || rawValue === "" ? NaN : Number(rawValue);
            }).filter(Number.isFinite);
            const averageValue = peerValues.length
                ? peerValues.reduce(function (sum, value) { return sum + value; }, 0) / peerValues.length
                : null;
            const studentPercent = Number.isFinite(studentValue)
                ? Math.max(0, Math.min(100, studentValue * metric.scale))
                : null;
            const averagePercent = Number.isFinite(averageValue)
                ? Math.max(0, Math.min(100, averageValue * metric.scale))
                : null;
            return {
                label: metric.label,
                unit: metric.unit,
                studentValue: Number.isFinite(studentValue) ? studentValue : null,
                averageValue: averageValue,
                studentPercent: studentPercent,
                averagePercent: averagePercent,
                difference: Number.isFinite(studentValue) && Number.isFinite(averageValue)
                    ? (studentValue - averageValue) * metric.scale
                    : null
            };
        });
        const comparisons = [
            { label: "Success score", key: "success_score", suffix: " pts" },
            { label: "CGPA", key: "cgpa", suffix: "" },
            { label: "Attendance", key: "attendance", suffix: "%" },
            { label: "Placement readiness", key: "placement_score", suffix: " pts" }
        ].map(function (metric) {
            const peerValues = studentPeers.map(function (peer) {
                const value = peer[metric.key];
                return value === null || value === undefined || value === "" ? NaN : Number(value);
            }).filter(Number.isFinite);
            const average = peerValues.length
                ? peerValues.reduce(function (sum, value) { return sum + value; }, 0) / peerValues.length
                : null;
            const currentValue = Number(student[metric.key]);
            const difference = Number.isFinite(currentValue) && Number.isFinite(average)
                ? currentValue - average
                : null;
            return '<div class="comparison-row"><span>' + escapeHtml(metric.label) +
                '</span><strong>' + (difference === null ? "—" :
                    (difference >= 0 ? "+" : "") + difference.toFixed(1) + escapeHtml(metric.suffix)) +
                '</strong><small>vs department peers avg. ' +
                (average === null ? "unavailable" : average.toFixed(1) + escapeHtml(metric.suffix)) +
                '</small></div>';
        }).join("");
        const indicatorGraph = indicatorData.map(function (metric) {
            const studentDisplay = metric.studentValue === null
                ? "Unavailable" : metric.studentValue.toFixed(1) + metric.unit;
            const averageDisplay = metric.averageValue === null
                ? "Unavailable" : metric.averageValue.toFixed(1) + metric.unit;
            const gapDisplay = metric.difference === null
                ? "No peer comparison"
                : (metric.difference >= 0 ? "+" : "") + metric.difference.toFixed(1) +
                    (metric.unit === "/10" ? " normalized pts" : " pts") + " vs peers";
            const studentBar = metric.studentPercent === null ? "" :
                '<i class="student-graph-student" style="width:' + metric.studentPercent.toFixed(1) + '%"></i>';
            const averageBar = metric.averagePercent === null ? "" :
                '<i class="student-graph-average" style="width:' + metric.averagePercent.toFixed(1) + '%"></i>';
            return '<div class="student-graph-row" role="group" aria-label="' +
                escapeHtml(metric.label + ": student " + studentDisplay +
                    ", department peers average " + averageDisplay + ", " + gapDisplay) + '">' +
                '<div class="student-graph-label"><span>' + escapeHtml(metric.label) +
                '</span><strong>' + escapeHtml(studentDisplay) +
                '</strong></div><div class="student-graph-bars"><div class="student-graph-bar-line">' +
                '<span>Student</span><div class="student-graph-track" aria-hidden="true">' +
                studentBar + '</div></div><div class="student-graph-bar-line">' +
                '<span>Department</span><div class="student-graph-track" aria-hidden="true">' +
                averageBar + '</div><strong>' + escapeHtml(averageDisplay) +
                '</strong></div><small class="student-graph-gap">' + escapeHtml(gapDisplay) +
                '</small></div></div>';
        }).join("");
        const comparedIndicators = indicatorData.filter(function (metric) {
            return metric.difference !== null && metric.label !== "Student success score";
        });
        const abovePeerCount = comparedIndicators.filter(function (metric) {
            return metric.difference > 0;
        }).length;
        const strongestIndicator = comparedIndicators.reduce(function (strongest, metric) {
            return !strongest || metric.difference > strongest.difference ? metric : strongest;
        }, null);
        const focusIndicator = comparedIndicators.reduce(function (focus, metric) {
            return !focus || metric.difference < focus.difference ? metric : focus;
        }, null);
        const studentAnalysis = comparedIndicators.length
            ? '<div class="student-analysis-summary"><div><span>Indicators above peers</span><strong>' +
                abovePeerCount + ' / ' + comparedIndicators.length + '</strong></div><div><span>Strongest relative indicator</span><strong>' +
                (strongestIndicator ? escapeHtml(strongestIndicator.label) : "Unavailable") +
                (strongestIndicator ? ' <small>' +
                    (strongestIndicator.difference >= 0 ? "+" : "") +
                    strongestIndicator.difference.toFixed(1) + ' pts</small>' : '') +
                '</strong></div><div><span>Largest support opportunity</span><strong>' +
                (focusIndicator && focusIndicator.difference < 0 ? escapeHtml(focusIndicator.label) :
                    "No below-average indicators") +
                (focusIndicator && focusIndicator.difference < 0
                    ? ' <small>' + focusIndicator.difference.toFixed(1) + ' pts</small>'
                    : '') +
                '</strong></div></div>'
            : '<p class="student-graph-note">No other student records are available for a department comparison.</p>';
        const detailedMetrics = [
            ["LMS activity", student.lms_score, "/100"],
            ["Engagement", student.engagement, "/100"],
            ["Coding", student.coding_score, "/100"],
            ["Skills", student.skills_score, "/100"],
            ["Placement readiness", student.placement_score, "/100"],
            ["Feedback", student.feedback_score, "/100"]
        ].map(function (metric) {
            return '<div><span>' + escapeHtml(metric[0]) + '</span><strong>' +
                escapeHtml(metric[1]) + escapeHtml(metric[2]) + '</strong></div>';
        }).join("");
        const initialLift = scenarioAdjustments.reduce(function (sum, adjustment) {
            return sum + adjustment.increase * adjustment.multiplier * adjustment.weight;
        }, 0);
        const riskBandForScore = function (score) {
            if (score >= 80) return "LOW";
            if (score >= 60) return "MEDIUM";
            return "HIGH";
        };
        const initialProjectedScore = Math.min(100, currentScore + initialLift);
        const breakdownMarkup = scoreBreakdown.map(function (factor) {
            const normalizedValue = Math.max(0, Math.min(100, Number(factor.normalized_value) || 0));
            const value = Number(factor.value) || 0;
            return '<div class="score-factor"><div class="score-factor-heading"><span>' +
                escapeHtml(factor.label) + '</span><strong>' + value.toFixed(1) +
                escapeHtml(factor.unit || "%") + '</strong></div>' +
                '<div class="score-factor-track"><i style="width:' + normalizedValue + '%"></i></div><small>' +
                escapeHtml((Number(factor.weight) * 100).toFixed(0)) + '% weight · +' +
                escapeHtml(Number(factor.contribution).toFixed(2)) + ' score points</small></div>';
        }).join("");
        const riskMarkup = riskDrivers.length
            ? '<ul class="insight-list">' + riskDrivers.map(function (driver) {
                return '<li>' + escapeHtml(driver.message) + '</li>';
            }).join("") + '</ul>'
            : '<p class="insight-clear">No individual risk-driver threshold is currently triggered.</p>';
        inspector.innerHTML =
            '<div class="inspector-top"><span class="panel-kicker">STUDENT DETAILS</span>' +
            '<span class="live-chip">' + escapeHtml(student.risk || "UNKNOWN") + '</span></div>' +
            '<div class="profile-placeholder"><div class="profile-avatar">' +
            escapeHtml(String(student.student_id || "?").slice(-2)) + '</div><h3>' +
            escapeHtml(student.student_id) + '</h3><p>' + escapeHtml(student.department || "Department unavailable") +
            '</p></div><div class="placeholder-stats">' +
            '<div><span>CGPA</span><strong>' + escapeHtml(student.cgpa) + '</strong></div>' +
            '<div><span>ATTENDANCE</span><strong>' + escapeHtml(student.attendance) + '%</strong></div>' +
            '<div><span>LMS SCORE</span><strong>' + escapeHtml(student.lms_score) + '</strong></div>' +
            '<div><span>SUCCESS SCORE</span><strong>' + escapeHtml(student.success_score) + '</strong></div>' +
            '</div><section class="student-insight-section"><span class="panel-kicker">SUCCESS SCORE EXPLANATION</span>' +
            '<p class="insight-intro">Weighted 0–100 score. Each contribution equals the normalized indicator multiplied by its published weight.</p>' +
            '<div class="score-breakdown">' + (breakdownMarkup || '<p class="insight-clear">Score contributions are unavailable.</p>') +
            '</div></section><section class="student-insight-section"><span class="panel-kicker">RISK DRIVERS</span>' +
            riskMarkup + '</section><section class="student-insight-section segment-explanation"><span class="panel-kicker">SUPPORT SEGMENT</span>' +
            '<h4>' + escapeHtml(student.segment_label || "Unclassified") + '</h4><p>' +
            escapeHtml(student.segment_description || "") + '</p><strong>Suggested faculty action</strong><p>' +
            escapeHtml(student.recommended_action || "Review the student record with faculty.") +
            '</p><strong>Placement risk</strong><p>' + escapeHtml(student.placement_risk || "Unavailable") +
            ' · placement score ' + escapeHtml(student.placement_score) + ', coding score ' +
            escapeHtml(student.coding_score) + '</p></section><section class="student-insight-section">' +
            '<span class="panel-kicker">INDICATOR PROFILE</span><div class="profile-metric-grid">' +
            detailedMetrics + '</div></section><section class="student-insight-section">' +
            '<span class="panel-kicker">DEPARTMENT CONTEXT</span><p class="insight-intro">' +
            escapeHtml(studentPeers.length) + ' other student records in this department. Comparisons use department peers and exclude the selected student.</p>' +
            '<div class="comparison-list">' + comparisons + '</div></section>' +
            '<section class="student-insight-section student-graph-section"><div class="student-graph-heading">' +
            '<div><span class="panel-kicker">FULL INDIVIDUAL STUDENT ANALYSIS</span><h4>Performance across all indicators</h4></div>' +
            '<span class="student-graph-scale">9 measures · 0–100 graph scale</span></div>' +
            studentAnalysis + '<div class="student-indicator-graph">' + indicatorGraph + '</div>' +
            '<p class="student-graph-note">Bars compare the selected student with other current records in the same department. CGPA is normalized from 0–10 for the graph; its displayed value stays on the original scale. This is not a semester trend or prediction.</p></section>' +
            '<section class="student-insight-section intervention-followup"><span class="panel-kicker">FACULTY FOLLOW-UP · BROWSER-ONLY</span>' +
            '<label for="followupStatus">Case status</label><select id="followupStatus" data-followup-student="' +
            escapeHtml(student.student_id) + '"><option value="Not started"' +
            (currentIntervention.status === "Not started" || !currentIntervention.status ? " selected" : "") +
            '>Not started</option><option value="Contacted"' +
            (currentIntervention.status === "Contacted" ? " selected" : "") +
            '>Contacted</option><option value="In progress"' +
            (currentIntervention.status === "In progress" ? " selected" : "") +
            '>In progress</option><option value="Resolved"' +
            (currentIntervention.status === "Resolved" ? " selected" : "") +
            '>Resolved</option></select><label for="followupDate">Follow-up date</label><input id="followupDate" type="date" value="' +
            escapeHtml(currentIntervention.dueDate || "") + '"><label for="followupNote">Brief non-sensitive note <span>(max 240 characters)</span></label>' +
            '<textarea id="followupNote" maxlength="240" rows="3" placeholder="Record a short next step; do not include private details.">' +
            escapeHtml(currentIntervention.note || "") + '</textarea><button class="secondary-button" id="saveStudentFollowup" type="button">Save follow-up</button>' +
            '<small class="followup-updated">' + (currentIntervention.updatedAt ?
                "Last updated " + escapeHtml(new Date(currentIntervention.updatedAt).toLocaleString()) :
                "No follow-up saved yet") + '</small></section><section class="student-insight-section scenario-section">' +
            '<span class="panel-kicker">WHAT-IF PLANNING SANDBOX</span><p class="insight-intro">Starter targets are editable examples. Explore the weighted-score arithmetic if proposed gains are achieved.</p>' +
            '<div class="scenario-controls">' + (scenarioInputs || '<p class="insight-clear">Scenario factors are unavailable for this student.</p>') +
            '</div><div class="scenario-result"><div><span>ILLUSTRATIVE SCORE</span><strong id="scenarioScore">' +
            displayScore(initialProjectedScore) + '</strong></div><div><span>CHANGE</span><strong id="scenarioChange">+' +
            (initialProjectedScore - currentScore).toFixed(2) + ' pts</strong></div><span class="student-risk risk-' +
            riskClass(riskBandForScore(initialProjectedScore)) + '" id="scenarioBand">' +
            riskBandForScore(initialProjectedScore) + ' band</span></div>' +
            '<p class="scenario-disclaimer">Assumes chosen gains are achieved. Illustrative arithmetic only—not a prediction, causal estimate, or saved change. Faculty must validate feasible targets.</p></section>';

        const scenarioSection = inspector.querySelector(".scenario-section");
        if (scenarioSection) {
            scenarioSection.querySelectorAll("[data-scenario-factor]").forEach(function (input) {
                input.addEventListener("input", function () {
                    const improvement = Number(input.value) || 0;
                    const multiplier = Number(input.dataset.multiplier) || 1;
                    const weight = Number(input.dataset.weight) || 0;
                    const valueOutput = document.getElementById("scenario-value-" + input.dataset.scenarioFactor);
                    if (valueOutput) {
                        valueOutput.textContent = improvement.toFixed(multiplier === 10 ? 1 : 0);
                    }
                    const lift = Array.from(scenarioSection.querySelectorAll("[data-scenario-factor]"))
                        .reduce(function (sum, control) {
                            return sum + (Number(control.value) || 0) *
                                (Number(control.dataset.multiplier) || 1) *
                                (Number(control.dataset.weight) || 0);
                        }, 0);
                    const projectedScore = Math.min(100, currentScore + lift);
                    const change = projectedScore - currentScore;
                    const band = riskBandForScore(projectedScore);
                    const scoreOutput = document.getElementById("scenarioScore");
                    const changeOutput = document.getElementById("scenarioChange");
                    const bandOutput = document.getElementById("scenarioBand");
                    if (scoreOutput) scoreOutput.textContent = displayScore(projectedScore);
                    if (changeOutput) changeOutput.textContent = "+" + change.toFixed(2) + " pts";
                    if (bandOutput) {
                        bandOutput.textContent = band + " band";
                        bandOutput.className = "student-risk risk-" + riskClass(band);
                    }
                });
            });
        }
        const saveFollowup = inspector.querySelector("#saveStudentFollowup");
        if (saveFollowup) saveFollowup.addEventListener("click", function () {
            const status = inspector.querySelector("#followupStatus").value;
            const dueDate = inspector.querySelector("#followupDate").value;
            const note = inspector.querySelector("#followupNote").value.trim();
            if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
                showNotification("Choose a valid follow-up date.");
                return;
            }
            interventionRecords[String(student.student_id)] = {
                status: status,
                dueDate: dueDate,
                note: note,
                updatedAt: new Date().toISOString()
            };
            if (saveLocalRecords(ACTION_STORAGE_KEY, interventionRecords)) {
                renderStudentDetails(student);
                renderActionCenter();
                showNotification("Follow-up saved in this browser.");
            }
        });
    }

    function renderPriorityTable() {
        const tableBody = document.getElementById("priorityStudents");
        if (!tableBody) return;
        const flagged = students.filter(function (student) {
            return ["HIGH", "MEDIUM"].includes(String(student.risk || "").toUpperCase());
        }).slice(0, 5);
        tableBody.innerHTML = flagged.length ? flagged.map(function (student) {
            return '<tr><td><strong>' + escapeHtml(student.student_id) + '</strong><small class="table-subtext">' +
                escapeHtml(student.department || "") + '</small></td><td>' + escapeHtml(student.success_score) +
                '</td><td>' + escapeHtml(student.attendance) + '%</td><td>' + escapeHtml(student.lms_score) +
                '</td><td><span class="student-risk risk-' + riskClass(student.risk) + '">' +
                escapeHtml(student.risk) + '</span></td><td><button class="table-action" type="button" data-open-student="' +
                escapeHtml(student.student_id) + '">View</button></td></tr>';
        }).join("") : '<tr class="empty-row"><td colspan="6"><div class="table-empty"><strong>No students flagged</strong>' +
            '<span>All available records are currently in good standing.</span></div></td></tr>';
        tableBody.querySelectorAll("[data-open-student]").forEach(function (button) {
            button.addEventListener("click", function () {
                const selected = students.find(function (student) {
                    return String(student.student_id) === button.dataset.openStudent;
                });
                if (selected) {
                    switchTab("students");
                    renderStudentDetails(selected);
                }
            });
        });
    }

    function renderRiskTable() {
        const tableBody = document.getElementById("riskStudents");
        if (!tableBody) return;
        const flagged = getInterventionCandidates();
        setText("riskRecordCount", flagged.length);
        tableBody.innerHTML = flagged.length ? flagged.map(function (student) {
            const riskDrivers = Array.isArray(student.risk_drivers) ? student.risk_drivers : [];
            const drivers = riskDrivers.length
                ? '<details class="risk-driver-details"><summary>View ' + riskDrivers.length +
                    (riskDrivers.length === 1 ? ' risk factor' : ' risk factors') +
                    '</summary><ul>' + riskDrivers.map(function (driver) {
                        return '<li>' + escapeHtml(driver.message) + '</li>';
                    }).join("") + '</ul></details>'
                : '<span class="risk-driver-clear">No individual factor threshold triggered</span>';
            const recommendedAction = student.recommended_action || "";
            const successScore = Number(student.success_score);
            const scoreWidth = Number.isFinite(successScore)
                ? Math.max(0, Math.min(100, successScore))
                : 0;
            const risk = String(student.risk || "UNKNOWN");
            return '<tr class="risk-row risk-row-' + riskClass(risk) + '"><td><div class="risk-student-cell">' +
                '<span class="risk-student-mark">' + escapeHtml(String(student.student_id || "?").slice(-2)) +
                '</span><div><strong>' + escapeHtml(student.student_id) + '</strong><small class="table-subtext">' +
                escapeHtml(student.department || "Department unavailable") + '</small></div></div></td>' +
                '<td><div class="risk-score-cell"><strong>' +
                (Number.isFinite(successScore) ? escapeHtml(successScore.toFixed(1)) : "—") +
                '</strong><span class="risk-score-track"><i style="width:' + scoreWidth.toFixed(1) +
                '%"></i></span></div></td><td><span class="risk-attendance-value">' +
                escapeHtml(student.attendance) + '%</span></td><td>' +
                '<span class="student-risk risk-' + riskClass(student.placement_risk) + '">' +
                escapeHtml(student.placement_risk || "UNKNOWN") + '</span></td><td>' +
                drivers + '</td><td><span class="student-risk risk-' +
                riskClass(risk) + '">' + escapeHtml(risk) + '</span></td><td><span class="risk-segment-label">' +
                escapeHtml(student.segment_label || "Unclassified") + '</span><small class="table-subtext">' +
                '<span class="risk-next-step" title="' + escapeHtml(recommendedAction) + '">' +
                escapeHtml(recommendedAction || "Faculty review recommended.") +
                '</span></small></td></tr>';
        }).join("") : '<tr class="empty-row"><td colspan="7"><div class="table-empty">' +
            '<strong>No students flagged</strong><span>All available records are currently in good standing.</span>' +
            '</div></td></tr>';
    }

    function getInterventionCandidates() {
        return students.filter(function (student) {
            return ["HIGH", "MEDIUM"].includes(String(student.risk || "").toUpperCase()) ||
                ["HIGH", "MEDIUM"].includes(String(student.placement_risk || "").toUpperCase());
        });
    }

    function csvCell(value) {
        const text = String(value == null ? "" : value);
        const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? "'" + text : text;
        return '"' + safeText.replace(/"/g, '""') + '"';
    }

    function exportInterventionPlan() {
        const candidates = getInterventionCandidates();
        if (!candidates.length) {
            showNotification("No academic or placement support cases are available to export.");
            return;
        }
        const rows = [
            ["Student ID", "Department", "Success Score", "Academic Risk", "Placement Risk",
                "Risk Drivers", "Support Segment", "Suggested Faculty Action"],
            ...candidates.map(function (student) {
                const drivers = Array.isArray(student.risk_drivers)
                    ? student.risk_drivers.map(function (driver) { return driver.message; }).join("; ")
                    : "";
                return [
                    student.student_id,
                    student.department,
                    student.success_score,
                    student.risk,
                    student.placement_risk,
                    drivers,
                    student.segment_label,
                    student.recommended_action
                ];
            })
        ];
        const csv = "\uFEFF" + rows.map(function (row) {
            return row.map(csvCell).join(",");
        }).join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "student-intervention-shortlist-" +
            new Date().toISOString().slice(0, 10) + ".csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
        showNotification("Exported " + candidates.length + " support cases to CSV.");
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function renderSummary(summary) {
        const high = Number(summary.high_risk_students) || 0;
        const medium = Number(summary.medium_risk_students) || 0;
        const low = Number(summary.low_risk_students) || 0;
        const total = Number(summary.total_students) || students.length;
        const averageAttendance = students.length
            ? students.reduce(function (totalValue, student) {
                return totalValue + (Number(student.attendance) || 0);
            }, 0) / students.length
            : 0;
        const averageLms = students.length
            ? students.reduce(function (totalValue, student) {
                return totalValue + (Number(student.lms_score) || 0);
            }, 0) / students.length
            : 0;

        setText("averageScore", summary.average_success_score + "%");
        setText("totalStudents", total + " students in records");
        setText("criticalAlerts", high);
        setText("averageAttendance", averageAttendance.toFixed(1) + "%");
        setText("averageLmsScore", averageLms.toFixed(1) + "%");
        setText("highRiskCount", high);
        setText("mediumRiskCount", medium);
        setText("lowRiskCount", low);
        setText("highRiskCaption", high + " students flagged");
        setText("mediumRiskCaption", medium + " students flagged");
        setText("lowRiskCaption", low + " students recorded");
        setText("flaggedStudents", high + medium);
        setText("riskHighCount", high);
        setText("riskMediumCount", medium);
        setText("riskLowCount", low);
        setText("riskTotalStudents", total);
        setText("placementRiskCount", summary.placement_risk_students == null
            ? "--"
            : summary.placement_risk_students);
        const riskDistribution = document.getElementById("riskDistribution");
        if (riskDistribution) {
            const distributionTotal = high + medium + low;
            [
                ["riskHighBar", high],
                ["riskMediumBar", medium],
                ["riskLowBar", low]
            ].forEach(function (entry) {
                const bar = document.getElementById(entry[0]);
                if (bar) {
                    const percent = distributionTotal
                        ? Math.max(0, Math.min(100, entry[1] / distributionTotal * 100))
                        : 0;
                    bar.style.width = percent.toFixed(1) + "%";
                }
            });
            riskDistribution.setAttribute(
                "aria-label",
                "Current risk distribution: " + high + " high, " + medium +
                    " medium, " + low + " low across " + distributionTotal + " records."
            );
        }
        const coreScore = document.querySelector(".core-score span");
        if (coreScore) coreScore.textContent = Number(summary.average_success_score).toFixed(0);
        const coreLabel = document.querySelector(".core-label");
        if (coreLabel) coreLabel.textContent = "AVERAGE SUCCESS SCORE";
        const coreChip = document.querySelector(".core-top .live-chip");
        if (coreChip) coreChip.textContent = importedDataset ? "SESSION CSV" : "LIVE DATA";
        const historyChart = document.querySelector(".chart-placeholder");
        if (historyChart) historyChart.setAttribute("hidden", "");
    }

    async function loadDepartmentAnalytics() {
        const chart = document.getElementById("departmentAnalytics");
        if (!chart) return;
        const departments = await apiRequest("/analytics/departments");
        if (!Array.isArray(departments)) throw new Error("Department analytics returned an unexpected response.");
        if (!departments.length) {
            chart.innerHTML = "<strong>No department records found</strong>";
            return;
        }
        const maxScore = Math.max.apply(null, departments.map(function (department) {
            return Number(department.average_success_score) || 0;
        })) || 1;
        chart.innerHTML = '<div class="department-bars">' + departments.map(function (department) {
            const score = Number(department.average_success_score) || 0;
            return '<div class="department-bar"><span>' + escapeHtml(department.department) + '</span>' +
                '<div><i style="height:' + Math.max(5, score / maxScore * 100) + '%"></i></div>' +
                '<strong>' + score.toFixed(1) + '</strong><small>' +
                escapeHtml(department.total_students) + ' students</small></div>';
        }).join("") + '</div>';
    }

    async function loadScoringMethodology() {
        const factorsContainer = document.getElementById("scoringFactors");
        const note = document.getElementById("scoreMethodNote");
        const methodology = await apiRequest("/analytics/scoring");
        if (!Array.isArray(methodology.factors) || methodology.factors.length === 0) {
            throw new Error("Scoring methodology returned no factors.");
        }
        if (factorsContainer) {
            factorsContainer.innerHTML = methodology.factors.map(function (factor) {
                const weight = Number(factor.weight) || 0;
                return '<div class="signal-row"><span>' + escapeHtml(factor.label) +
                    '</span><strong>' + (weight * 100).toFixed(0) + '%</strong></div>' +
                    '<div class="signal-progress"><span style="width:' + Math.min(100, weight * 500) +
                    '%"></span></div>';
            }).join("");
        }
        if (note) {
            const thresholds = methodology.risk_thresholds || {};
            note.textContent = "Risk bands: LOW " + (thresholds.LOW || "—") +
                " · MEDIUM " + (thresholds.MEDIUM || "—") + " · HIGH " +
                (thresholds.HIGH || "—") + ". " + (methodology.note || "");
        }
    }

    function renderSegmentCards(segments) {
        const container = document.getElementById("segmentGrid");
        if (!container) return;
        container.innerHTML = segments.map(function (segment) {
            return '<button class="segment-card" type="button" data-segment="' +
                escapeHtml(segment.segment) + '"><span>' + escapeHtml(segment.label) +
                '</span><strong>' + escapeHtml(segment.student_count) + '</strong><small>Avg. score ' +
                escapeHtml(segment.average_success_score) + '</small><small>' +
                escapeHtml(segment.description) + '</small></button>';
        }).join("");
        container.querySelectorAll("[data-segment]").forEach(function (button) {
            button.addEventListener("click", function () {
                activeSegment = button.dataset.segment || "";
                activeFilter = "all";
                document.querySelectorAll(".filter-button").forEach(function (filterButton) {
                    filterButton.classList.toggle("active", filterButton.dataset.filter === "all");
                });
                switchTab("students");
                renderStudentDirectory();
                if (studentSearch) studentSearch.focus();
            });
        });
    }

    async function loadSegmentAnalytics() {
        const segments = await apiRequest("/analytics/segments");
        if (!Array.isArray(segments)) throw new Error("Student segments returned an unexpected response.");
        renderSegmentCards(segments);
    }

    function makeLocalSummary(records) {
        const high = records.filter(function (student) { return student.risk === "HIGH"; }).length;
        const medium = records.filter(function (student) { return student.risk === "MEDIUM"; }).length;
        const low = records.filter(function (student) { return student.risk === "LOW"; }).length;
        const average = records.length ? records.reduce(function (sum, student) {
            return sum + Number(student.success_score || 0);
        }, 0) / records.length : 0;
        return {
            total_students: records.length,
            high_risk_students: high,
            medium_risk_students: medium,
            low_risk_students: low,
            placement_risk_students: records.filter(function (student) {
                return ["HIGH", "MEDIUM"].includes(student.placement_risk);
            }).length,
            average_success_score: Number(average.toFixed(2))
        };
    }

    function renderLocalAnalytics() {
        const departmentMap = Object.create(null);
        const segmentMap = Object.create(null);
        students.forEach(function (student) {
            const department = String(student.department || "Unspecified");
            if (!departmentMap[department]) departmentMap[department] = { count: 0, score: 0 };
            departmentMap[department].count += 1;
            departmentMap[department].score += Number(student.success_score) || 0;
            const segmentKey = student.segment || "unclassified";
            if (!segmentMap[segmentKey]) {
                segmentMap[segmentKey] = {
                    segment: segmentKey,
                    label: student.segment_label || "Unclassified",
                    description: student.segment_description || "",
                    student_count: 0,
                    score: 0
                };
            }
            segmentMap[segmentKey].student_count += 1;
            segmentMap[segmentKey].score += Number(student.success_score) || 0;
        });
        const departments = Object.keys(departmentMap).map(function (name) {
            const summary = departmentMap[name];
            return {
                department: name,
                total_students: summary.count,
                average_success_score: summary.score / summary.count
            };
        });
        renderDepartmentChart(departments);
        const segments = Object.keys(segmentMap).map(function (key) {
            const segment = segmentMap[key];
            return Object.assign({}, segment, {
                average_success_score: (segment.score / segment.student_count).toFixed(1)
            });
        });
        renderSegmentCards(segments);
        renderDataQualitySummary();
    }

    function renderDepartmentChart(departments) {
        const chart = document.getElementById("departmentAnalytics");
        if (!chart) return;
        if (!departments.length) {
            chart.innerHTML = "<strong>No department records found</strong>";
            return;
        }
        const maxScore = Math.max.apply(null, departments.map(function (department) {
            return Number(department.average_success_score) || 0;
        })) || 1;
        chart.innerHTML = '<div class="department-bars">' + departments.map(function (department) {
            const score = Number(department.average_success_score) || 0;
            return '<div class="department-bar"><span>' + escapeHtml(department.department) + '</span>' +
                '<div><i style="height:' + Math.max(5, score / maxScore * 100) + '%"></i></div>' +
                '<strong>' + score.toFixed(1) + '</strong><small>' +
                escapeHtml(department.total_students) + ' students</small></div>';
        }).join("") + '</div>';
    }

    function renderDataQualitySummary() {
        const container = document.getElementById("dataQualityCards");
        if (!container) return;
        const avgAttendance = students.length ? students.reduce(function (sum, student) {
            return sum + (Number(student.attendance) || 0);
        }, 0) / students.length : 0;
        const missingMetrics = students.reduce(function (count, student) {
            return count + ["cgpa", "attendance", "lms_score", "engagement", "coding_score",
                "skills_score", "placement_score", "feedback_score"].filter(function (key) {
                return student[key] == null || student[key] === "";
            }).length;
        }, 0);
        container.innerHTML =
            '<article class="panel data-quality-card"><span>RECORDS IN VIEW</span><strong>' + students.length +
            '</strong><small>' + (importedDataset ? "Session-only CSV data" : "Connected backend dataset") +
            '</small></article><article class="panel data-quality-card"><span>EMPTY INDICATORS</span><strong>' +
            missingMetrics + '</strong><small>Across eight scored factors</small></article>' +
            '<article class="panel data-quality-card"><span>MEAN ATTENDANCE</span><strong>' +
            avgAttendance.toFixed(1) + '%</strong><small>Calculated from current view</small></article>';
    }

    function renderActionCenter() {
        const caseList = document.getElementById("actionCaseList");
        const filter = document.getElementById("actionStatusFilter");
        if (!caseList) return;
        const cases = getInterventionCandidates();
        const resolved = cases.filter(function (student) {
            return interventionRecords[String(student.student_id)] &&
                interventionRecords[String(student.student_id)].status === "Resolved";
        });
        const open = cases.filter(function (student) {
            return !resolved.includes(student);
        });
        const today = new Date().toISOString().slice(0, 10);
        const due = open.filter(function (student) {
            const record = interventionRecords[String(student.student_id)] || {};
            return record.dueDate && record.dueDate <= today;
        });
        setText("actionOpenCount", open.length);
        setText("actionDueCount", due.length);
        setText("actionResolvedCount", resolved.length);
        const mode = filter ? filter.value : "open";
        const visible = cases.filter(function (student) {
            const isResolved = resolved.includes(student);
            return mode === "all" || (mode === "resolved" ? isResolved : !isResolved);
        });
        caseList.innerHTML = visible.length ? visible.map(function (student) {
            const id = String(student.student_id);
            const record = interventionRecords[id] || {};
            const riskTypes = [];
            if (["HIGH", "MEDIUM"].includes(student.risk)) riskTypes.push("Academic " + student.risk);
            if (["HIGH", "MEDIUM"].includes(student.placement_risk)) riskTypes.push("Placement " + student.placement_risk);
            return '<article class="panel action-case" data-case-id="' + escapeHtml(id) + '">' +
                '<div class="action-case-heading"><div><span class="panel-kicker">' +
                escapeHtml(student.department || "Department unavailable") + ' · SCORE ' +
                escapeHtml(student.success_score) + '</span><h3>' + escapeHtml(id) +
                '</h3></div><span class="student-risk risk-' + riskClass(student.risk) + '">' +
                escapeHtml(riskTypes.join(" / ") || student.risk) + '</span></div>' +
                '<p class="action-case-recommendation">' + escapeHtml(student.recommended_action ||
                "Review current student indicators and agree a support step.") + '</p>' +
                '<div class="action-case-fields"><label>Status<select data-case-status>' +
                ["Not started", "Contacted", "In progress", "Resolved"].map(function (status) {
                    return '<option' + ((record.status || "Not started") === status ? " selected" : "") +
                        '>' + status + '</option>';
                }).join("") + '</select></label><label>Follow-up date<input type="date" data-case-date value="' +
                escapeHtml(record.dueDate || "") + '"></label></div>' +
                '<label class="action-note-label">Brief non-sensitive note<textarea data-case-note maxlength="240" rows="2" placeholder="Next step only; no private details.">' +
                escapeHtml(record.note || "") + '</textarea></label><div class="action-case-footer">' +
                '<small>' + (record.updatedAt ? "Updated " +
                    escapeHtml(new Date(record.updatedAt).toLocaleString()) : "No follow-up saved") +
                '</small><button class="secondary-button" type="button" data-save-case="' +
                escapeHtml(id) + '">Save update</button></div></article>';
        }).join("") : '<div class="panel action-empty"><strong>' +
            (mode === "resolved" ? "No resolved cases yet." : "No open support cases.") +
            '</strong><span>Support cases are based on current academic and placement rules.</span></div>';
    }

    function parseCsv(text) {
        const rows = [];
        let row = [];
        let cell = "";
        let quoted = false;
        const source = text.replace(/^\uFEFF/, "");
        for (let index = 0; index < source.length; index += 1) {
            const character = source[index];
            if (quoted) {
                if (character === '"' && source[index + 1] === '"') {
                    cell += '"';
                    index += 1;
                } else if (character === '"') {
                    quoted = false;
                } else {
                    cell += character;
                }
            } else if (character === '"' && cell.length === 0) {
                quoted = true;
            } else if (character === ",") {
                row.push(cell);
                cell = "";
            } else if (character === "\n" || character === "\r") {
                if (character === "\r" && source[index + 1] === "\n") index += 1;
                row.push(cell);
                if (row.some(function (item) { return item.trim() !== ""; })) rows.push(row);
                row = [];
                cell = "";
            } else {
                cell += character;
            }
        }
        if (quoted) throw new Error("CSV contains an unclosed quoted value.");
        if (cell.length || row.length) {
            row.push(cell);
            if (row.some(function (item) { return item.trim() !== ""; })) rows.push(row);
        }
        return rows;
    }

    const csvFields = ["student_id", "department", "cgpa", "attendance", "lms_score",
        "engagement", "coding_score", "skills_score", "placement_score", "feedback_score"];
    let validatedCsvRecords = null;

    function createImportedStudent(row) {
        const weights = {
            cgpa: 0.20, attendance: 0.15, lms_score: 0.15, engagement: 0.10,
            coding_score: 0.10, skills_score: 0.10, placement_score: 0.10, feedback_score: 0.10
        };
        const labels = {
            cgpa: ["Academic performance (CGPA)", 10],
            attendance: ["Attendance", 1],
            lms_score: ["LMS performance", 1],
            engagement: ["Engagement", 1],
            coding_score: ["Coding", 1],
            skills_score: ["Skills", 1],
            placement_score: ["Placement readiness", 1],
            feedback_score: ["Student feedback", 1]
        };
        const scoreBreakdown = Object.keys(weights).map(function (key) {
            const normalized = Number(row[key]) * labels[key][1];
            return {
                key: key,
                label: labels[key][0],
                value: Number(row[key]),
                normalized_value: normalized,
                unit: key === "cgpa" ? "/10" : "%",
                weight: weights[key],
                contribution: normalized * weights[key]
            };
        });
        const score = scoreBreakdown.reduce(function (sum, factor) {
            return sum + factor.contribution;
        }, 0);
        row.success_score = Number(score.toFixed(2));
        row.risk = score >= 80 ? "LOW" : score >= 60 ? "MEDIUM" : "HIGH";
        row.placement_risk = row.placement_score < 50 || row.coding_score < 50 ? "HIGH" :
            row.placement_score < 70 || row.coding_score < 60 ? "MEDIUM" : "LOW";
        const rules = [
            ["cgpa", "CGPA", 6.5], ["attendance", "Attendance", 75],
            ["lms_score", "LMS performance", 60], ["engagement", "Engagement", 50],
            ["placement_score", "Placement readiness", 60], ["coding_score", "Coding", 50],
            ["skills_score", "Skills", 50], ["feedback_score", "Feedback", 50]
        ];
        row.risk_drivers = rules.filter(function (rule) {
            return row[rule[0]] < rule[2];
        }).map(function (rule) {
            return { key: rule[0], message: rule[1] + " is " + row[rule[0]] +
                ", below the support threshold of " + rule[2] + "." };
        });
        if (!row.risk_drivers.length && row.risk !== "LOW") {
            row.risk_drivers.push({
                key: "success_score",
                message: "The overall success score is below the " + row.risk.toLowerCase() +
                    "-risk band threshold of " + (row.risk === "HIGH" ? 60 : 80) + "."
            });
        }
        if (row.cgpa >= 8 && row.placement_score < 65) row.segment = "academic_placement_support";
        else if (row.cgpa >= 7 && row.placement_score >= 75 && row.coding_score >= 70) row.segment = "placement_ready";
        else if (row.cgpa < 6.5 || row.success_score < 60) row.segment = "academic_recovery";
        else if (row.attendance < 75 || row.lms_score < 60 || row.engagement < 50) row.segment = "engagement_support";
        else row.segment = "balanced_progress";
        const segments = {
            academic_placement_support: ["Strong academics, placement support", "Strong CGPA with a placement-readiness gap.", "Offer aptitude practice, coding interviews, and mock-placement sessions."],
            placement_ready: ["Placement ready", "Strong academic foundation, coding, and placement-readiness scores.", "Connect with relevant placement opportunities and advanced interview practice."],
            academic_recovery: ["Academic recovery", "Low overall success score or CGPA indicates a need for academic support.", "Review subject-level performance and agree on a faculty-led study plan."],
            engagement_support: ["Engagement support", "Attendance, LMS activity, or engagement is below its support threshold.", "Check for barriers to participation and set a short-term engagement goal."],
            balanced_progress: ["Balanced progress", "No segment-specific support trigger is currently present.", "Continue regular progress reviews and encourage development opportunities."]
        };
        row.segment_label = segments[row.segment][0];
        row.segment_description = segments[row.segment][1];
        row.recommended_action = segments[row.segment][2];
        row.score_breakdown = scoreBreakdown;
        return row;
    }

    function validateCsv(text) {
        const rows = parseCsv(text);
        if (!rows.length) throw new Error("The CSV file is empty.");
        const headers = rows[0].map(function (header) { return header.trim().toLowerCase(); });
        const missingHeaders = csvFields.filter(function (field) { return !headers.includes(field); });
        if (missingHeaders.length) {
            return { records: [], errors: ["Missing required columns: " + missingHeaders.join(", ")],
                rowCount: Math.max(0, rows.length - 1), missing: 0, invalid: 0, duplicates: 0, previewRows: [] };
        }
        const indexes = {};
        csvFields.forEach(function (field) { indexes[field] = headers.indexOf(field); });
        const candidates = [];
        const rowErrors = [];
        let missing = 0;
        let invalid = 0;
        const ids = Object.create(null);
        let duplicates = 0;
        rows.slice(1).forEach(function (cells, rowIndex) {
            const record = {};
            csvFields.forEach(function (field) {
                record[field] = (cells[indexes[field]] || "").trim();
            });
            const csvRow = rowIndex + 2;
            let rowValid = true;
            if (!record.student_id || !record.department) {
                missing += 1;
                rowErrors.push("Row " + csvRow + ": student ID or department is missing.");
                rowValid = false;
            }
            csvFields.slice(2).forEach(function (field) {
                if (record[field] === "") {
                    missing += 1;
                    rowErrors.push("Row " + csvRow + ": " + field + " is missing.");
                    rowValid = false;
                    return;
                }
                const value = Number(record[field]);
                const max = field === "cgpa" ? 10 : 100;
                if (!Number.isFinite(value) || value < 0 || value > max) {
                    invalid += 1;
                    rowErrors.push("Row " + csvRow + ": " + field + " must be between 0 and " + max + ".");
                    rowValid = false;
                    return;
                }
                record[field] = value;
            });
            const normalizedId = record.student_id.toLowerCase();
            if (normalizedId) {
                if (ids[normalizedId]) {
                    duplicates += 1;
                    rowErrors.push("Row " + csvRow + ": duplicate student ID '" + record.student_id + "'.");
                    rowValid = false;
                } else {
                    ids[normalizedId] = true;
                }
            }
            if (rowValid) candidates.push(createImportedStudent(record));
        });
        return {
            records: candidates,
            errors: rowErrors,
            rowCount: rows.length - 1,
            missing: missing,
            invalid: invalid,
            duplicates: duplicates,
            previewRows: candidates.slice(0, 6),
            allValid: candidates.length > 0 && candidates.length === rows.length - 1
        };
    }

    function showCsvValidation(result, fileName) {
        const report = document.getElementById("csvQualityReport");
        const preview = document.getElementById("csvPreview");
        const applyButton = document.getElementById("applyCsvImport");
        if (!report || !preview || !applyButton) return;
        const errorsMarkup = result.errors.length ? '<ul class="csv-errors">' +
            result.errors.slice(0, 8).map(function (error) {
                return "<li>" + escapeHtml(error) + "</li>";
            }).join("") + (result.errors.length > 8 ? "<li>And " +
                (result.errors.length - 8) + " more issue(s).</li>" : "") + '</ul>' : "";
        report.innerHTML = '<div class="csv-report-grid"><div><strong>' + result.rowCount +
            '</strong><span>DATA ROWS</span></div><div><strong>' + result.missing +
            '</strong><span>MISSING VALUES</span></div><div><strong>' + result.invalid +
            '</strong><span>INVALID VALUES</span></div><div><strong>' + result.duplicates +
            '</strong><span>DUPLICATE IDs</span></div></div><p class="' +
            (result.allValid ? "csv-valid" : "csv-invalid") + '">' +
            (result.allValid ? "All rows passed validation. Review the preview before importing." :
                "Import is blocked until every row has valid required values and a unique student ID.") +
            '</p>' + errorsMarkup;
        preview.hidden = !result.previewRows.length;
        preview.innerHTML = result.previewRows.length ? '<strong>Preview · first ' +
            result.previewRows.length + ' valid record(s)</strong><div class="table-wrap"><table><thead><tr>' +
            '<th>STUDENT</th><th>DEPARTMENT</th><th>CGPA</th><th>ATTENDANCE</th><th>SUCCESS SCORE</th><th>RISK</th>' +
            '</tr></thead><tbody>' + result.previewRows.map(function (student) {
                return '<tr><td>' + escapeHtml(student.student_id) + '</td><td>' +
                    escapeHtml(student.department) + '</td><td>' + escapeHtml(student.cgpa) +
                    '</td><td>' + escapeHtml(student.attendance) + '%</td><td>' +
                    escapeHtml(student.success_score) + '</td><td>' + escapeHtml(student.risk) + '</td></tr>';
            }).join("") + '</tbody></table></div>' : "";
        applyButton.disabled = !result.allValid;
        setText("csvFileName", fileName);
    }

    function renderPeerLearning() {
        const board = document.getElementById("learningPostList");
        if (!board) return;
        const posts = learningPosts.filter(function (post) {
            return learningFilter === "all" || post.intent === learningFilter;
        });
        board.innerHTML = posts.length ? posts.map(function (post) {
            const isOffer = post.intent === "teach";
            return '<article class="learning-post ' + (isOffer ? "learning-offer" : "learning-request") + '">' +
                '<div class="learning-post-top"><span class="learning-kind">' +
                (isOffer ? "CAN TEACH" : "WANTS TO LEARN") + '</span><span class="learning-mode">' +
                escapeHtml(post.mode || "Either") + '</span></div><h4>' + escapeHtml(post.topic) +
                '</h4><p>' + escapeHtml(post.details || (isOffer ? "Open to sharing this skill with a peer." :
                    "Looking for a peer to learn this skill together.")) + '</p><div class="learning-post-footer"><span>By ' +
                escapeHtml(post.alias) + (post.demo ? " · SAMPLE" : "") + '</span>' +
                (isOffer ? '<button type="button" class="interest-button" data-interest="' +
                    escapeHtml(post.id) + '">' + (post.interested ? "Request sent ✓" : "I'm interested →") +
                    '</button>' : '<span class="learning-peer-only">Peer request</span>') +
                '</div></article>';
        }).join("") : '<div class="panel action-empty"><strong>No posts in this view yet.</strong>' +
            '<span>Be the first to post an offer or learning request.</span></div>';
    }

    async function loadDashboard() {
        setConnectionState(false, "Connecting to backend…");
        try {
            const results = await Promise.all([
                apiRequest("/students"),
                apiRequest("/summary")
            ]);
            if (!Array.isArray(results[0])) throw new Error("Student records returned an unexpected response.");
            students = results[0];
            backendStudents = results[0].slice();
            importedDataset = false;
            renderSummary(results[1]);
            renderStudentDirectory();
            renderPriorityTable();
            renderRiskTable();
            renderActionCenter();
            renderPeerLearning();
            renderDataQualitySummary();
            setText("dataLabBadge", "BACKEND DATA");
            const restoreButton = document.getElementById("restoreBackendData");
            if (restoreButton) restoreButton.hidden = true;
            setConnectionState(true, "Backend connected · " + students.length + " students loaded");
            loadDepartmentAnalytics().catch(function (error) {
                const chart = document.getElementById("departmentAnalytics");
                if (chart) chart.innerHTML = "<strong>Department analytics unavailable</strong><span>" +
                    escapeHtml(error.message) + "</span>";
            });
            loadScoringMethodology().catch(function (error) {
                const factors = document.getElementById("scoringFactors");
                if (factors) factors.innerHTML = '<p class="insight-error">' +
                    escapeHtml(error.message) + '</p>';
            });
            loadSegmentAnalytics().catch(function (error) {
                const segments = document.getElementById("segmentGrid");
                if (segments) segments.innerHTML = '<p class="insight-error">' +
                    escapeHtml(error.message) + '</p>';
            });
        } catch (error) {
            setConnectionState(false, "Cannot reach API at " + API_BASE_URL + " · " + error.message);
            if (studentEmpty) {
                studentEmpty.hidden = false;
                const paragraph = studentEmpty.querySelector("p");
                if (paragraph) paragraph.textContent = "Start the Flask backend, then reload this page.";
            }
            const riskTable = document.getElementById("riskStudents");
            if (riskTable) {
                riskTable.innerHTML = '<tr class="empty-row"><td colspan="7">Risk records unavailable until the backend connects.</td></tr>';
            }
            renderActionCenter();
            renderPeerLearning();
            renderDataQualitySummary();
            showNotification("Backend connection failed. Start the Flask API and reload.");
        }
    }

    const actionFilter = document.getElementById("actionStatusFilter");
    if (actionFilter) actionFilter.addEventListener("change", renderActionCenter);
    const actionList = document.getElementById("actionCaseList");
    if (actionList) actionList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-save-case]");
        if (!button) return;
        const card = button.closest("[data-case-id]");
        if (!card) return;
        const id = button.dataset.saveCase;
        interventionRecords[id] = {
            status: card.querySelector("[data-case-status]").value,
            dueDate: card.querySelector("[data-case-date]").value,
            note: card.querySelector("[data-case-note]").value.trim(),
            updatedAt: new Date().toISOString()
        };
        if (saveLocalRecords(ACTION_STORAGE_KEY, interventionRecords)) {
            renderActionCenter();
            showNotification("Case update saved in this browser.");
        }
    });

    const learningForm = document.getElementById("learningPostForm");
    if (learningForm) learningForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const formData = new FormData(learningForm);
        const alias = String(formData.get("alias") || "").trim();
        const topic = String(formData.get("topic") || "").trim();
        const details = String(formData.get("details") || "").trim();
        if (!alias || !topic) {
            showNotification("Add a nickname and a skill or topic before posting.");
            return;
        }
        const post = {
            id: "post-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
            alias: alias,
            intent: String(formData.get("intent") || "teach"),
            topic: topic,
            details: details,
            mode: String(formData.get("mode") || "Either"),
            demo: false,
            interested: false
        };
        learningPosts.unshift(post);
        if (saveLocalRecords(LEARNING_STORAGE_KEY, learningPosts)) {
            learningForm.reset();
            renderPeerLearning();
            showNotification("Your post is now on this browser's learning board.");
        }
    });
    const learningBoard = document.getElementById("learningPostList");
    if (learningBoard) learningBoard.addEventListener("click", function (event) {
        const button = event.target.closest("[data-interest]");
        if (!button) return;
        const post = learningPosts.find(function (item) { return item.id === button.dataset.interest; });
        if (!post) return;
        post.interested = !post.interested;
        if (saveLocalRecords(LEARNING_STORAGE_KEY, learningPosts)) {
            renderPeerLearning();
            showNotification(post.interested ? "Interest noted locally. Contact details are intentionally not collected." :
                "Interest request removed.");
        }
    });
    document.querySelectorAll("[data-learning-filter]").forEach(function (button) {
        button.addEventListener("click", function () {
            learningFilter = button.dataset.learningFilter || "all";
            document.querySelectorAll("[data-learning-filter]").forEach(function (filterButton) {
                filterButton.classList.toggle("active", filterButton === button);
            });
            renderPeerLearning();
        });
    });

    const csvInput = document.getElementById("studentCsvFile");
    if (csvInput) csvInput.addEventListener("change", function () {
        const file = csvInput.files && csvInput.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            showNotification("Choose a .csv file to continue.");
            return;
        }
        file.text().then(function (text) {
            const result = validateCsv(text);
            validatedCsvRecords = result.allValid ? result.records : null;
            showCsvValidation(result, file.name);
        }).catch(function (error) {
            validatedCsvRecords = null;
            showNotification("Could not read this CSV file: " + error.message);
        });
    });
    const csvDropzone = document.getElementById("csvDropzone");
    if (csvDropzone && csvInput) {
        ["dragenter", "dragover"].forEach(function (eventName) {
            csvDropzone.addEventListener(eventName, function (event) {
                event.preventDefault();
                csvDropzone.classList.add("is-dragging");
            });
        });
        ["dragleave", "drop"].forEach(function (eventName) {
            csvDropzone.addEventListener(eventName, function (event) {
                event.preventDefault();
                csvDropzone.classList.remove("is-dragging");
            });
        });
        csvDropzone.addEventListener("drop", function (event) {
            const files = event.dataTransfer && event.dataTransfer.files;
            if (!files || !files.length) return;
            try {
                const transfer = new DataTransfer();
                transfer.items.add(files[0]);
                csvInput.files = transfer.files;
                csvInput.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (error) {
                showNotification("Could not attach the dropped CSV: " + error.message);
            }
        });
    }
    const applyCsvImport = document.getElementById("applyCsvImport");
    if (applyCsvImport) applyCsvImport.addEventListener("click", function () {
        if (!validatedCsvRecords || !validatedCsvRecords.length) {
            showNotification("Validate a complete CSV before importing.");
            return;
        }
        students = validatedCsvRecords;
        importedDataset = true;
        activeFilter = "all";
        activeSegment = "";
        if (studentSearch) studentSearch.value = "";
        document.querySelectorAll(".filter-button").forEach(function (button) {
            button.classList.toggle("active", button.dataset.filter === "all");
        });
        renderSummary(makeLocalSummary(students));
        renderStudentDirectory();
        renderPriorityTable();
        renderRiskTable();
        renderActionCenter();
        renderLocalAnalytics();
        setText("dataLabBadge", "SESSION CSV");
        const restoreButton = document.getElementById("restoreBackendData");
        if (restoreButton) restoreButton.hidden = false;
        setConnectionState(true, "Session-only CSV active · " + students.length + " records · not uploaded");
        showNotification("Validated CSV is now active in this browser session only.");
    });
    const restoreBackendData = document.getElementById("restoreBackendData");
    if (restoreBackendData) restoreBackendData.addEventListener("click", function () {
        if (!backendStudents.length) {
            showNotification("Backend records are not available. Reconnect and reload to restore them.");
            return;
        }
        students = backendStudents.slice();
        importedDataset = false;
        validatedCsvRecords = null;
        renderSummary(makeLocalSummary(students));
        renderStudentDirectory();
        renderPriorityTable();
        renderRiskTable();
        renderActionCenter();
        renderLocalAnalytics();
        setText("dataLabBadge", "BACKEND DATA");
        restoreBackendData.hidden = true;
        setConnectionState(true, "Backend connected · " + students.length + " students loaded");
        showNotification("Backend records restored.");
    });
    const downloadTemplate = document.getElementById("downloadCsvTemplate");
    if (downloadTemplate) downloadTemplate.addEventListener("click", function () {
        const sample = [
            csvFields.join(","),
            "DEMO001,Computer Science,8.2,88,76,72,68,80,65,82",
            "DEMO002,Computer Science,6.1,70,55,44,48,60,52,74"
        ].join("\r\n");
        const url = URL.createObjectURL(new Blob([sample], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "student-success-demo-template.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });

    if (studentSearch) {
        studentSearch.addEventListener("input", renderStudentDirectory);
    }
    document.querySelectorAll(".filter-button").forEach(function (button) {
        button.addEventListener("click", function () {
            document.querySelectorAll(".filter-button").forEach(function (filterButton) {
                filterButton.classList.remove("active");
            });
            button.classList.add("active");
            activeFilter = button.dataset.filter || "all";
            activeSegment = "";
            renderStudentDirectory();
        });
    });
    const clearSegmentFilter = document.getElementById("clearSegmentFilter");
    if (clearSegmentFilter) {
        clearSegmentFilter.addEventListener("click", function () {
            activeSegment = "";
            renderStudentDirectory();
        });
    }

    function findStudent(query) {
        const normalizedQuery = query.trim().toLowerCase();
        return students.find(function (student) {
            return [student.student_id, student.department].some(function (field) {
                return String(field || "").toLowerCase() === normalizedQuery;
            });
        });
    }

    if (globalSearch) {
        globalSearch.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;
            const query = globalSearch.value.trim();
            if (!query) {
                showNotification("Enter a student ID or department to search.");
                return;
            }
            const pageMatch = Object.keys(routes).find(function (page) {
                return page === query.toLowerCase() || routes[page].title.toLowerCase() === query.toLowerCase();
            });
            if (pageMatch) {
                closeSearchDialog();
                switchTab(pageMatch);
                return;
            }
            const student = findStudent(query);
            closeSearchDialog();
            if (student) {
                switchTab("students");
                renderStudentDetails(student);
            } else {
                showNotification("No matching student or department found for '" + query + "'.");
            }
        });
    }

    function handleModelQuery() {
        if (!aiPrompt) return;
        const query = aiPrompt.value.trim();
        if (!query) {
            showNotification("Enter a student ID to view their record.");
            aiPrompt.focus();
            return;
        }
        const student = findStudent(query);
        const output = document.querySelector(".ai-empty");
        if (!student) {
            showNotification("Student not found. Try an ID such as STU001.");
            return;
        }
        if (output) {
            const drivers = Array.isArray(student.risk_drivers) ? student.risk_drivers : [];
            const driverText = drivers.length
                ? drivers.map(function (driver) { return driver.message; }).join(" ")
                : "No individual risk-driver threshold is currently triggered.";
            output.innerHTML = '<div class="ai-wave"><span></span><span></span><span></span><span></span>' +
                '<span></span><span></span><span></span><span></span></div><h3>' +
                escapeHtml(student.student_id) + ' · ' + escapeHtml(student.risk) + ' RISK</h3><p>' +
                escapeHtml(driverText) + '</p><p><strong>' + escapeHtml(student.segment_label || "") +
                '</strong> — ' + escapeHtml(student.recommended_action || "") + '</p><div class="ai-tags">' +
                '<span>Success score: ' + escapeHtml(student.success_score) + '</span><span>CGPA: ' +
                escapeHtml(student.cgpa) + '</span><span>Attendance: ' + escapeHtml(student.attendance) +
                '%</span><span>Placement: ' + escapeHtml(student.placement_score) +
                '</span><span>Placement risk: ' + escapeHtml(student.placement_risk || "Unavailable") +
                '</span></div><p class="prediction-note">Rule-based support insights from current records—not a validated predictive model. Faculty should review context before acting.</p>';
        }
        aiPrompt.value = "";
    }
    if (aiSend) aiSend.addEventListener("click", handleModelQuery);
    if (aiPrompt) {
        aiPrompt.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                handleModelQuery();
            }
        });
    }

    document.querySelectorAll("[data-toast]").forEach(function (button) {
        button.addEventListener("click", function () {
            showNotification(button.dataset.toast);
        });
    });

    applyDashboardSettings();
    const tableDensity = document.getElementById("tableDensity");
    if (tableDensity) tableDensity.addEventListener("change", function () {
        dashboardSettings.tableDensity = tableDensity.value;
        persistDashboardSettings();
    });
    const reducedMotion = document.getElementById("reducedMotion");
    if (reducedMotion) reducedMotion.addEventListener("change", function () {
        dashboardSettings.reducedMotion = reducedMotion.checked;
        persistDashboardSettings();
    });

    const clearDemoData = document.getElementById("clearDemoData");
    if (clearDemoData) clearDemoData.addEventListener("click", function () {
        if (!window.confirm("Clear locally saved intervention follow-ups and Peer Learning posts from this browser? This cannot be undone.")) {
            return;
        }
        try {
            window.localStorage.removeItem(ACTION_STORAGE_KEY);
            window.localStorage.removeItem(LEARNING_STORAGE_KEY);
        } catch (error) {
            showNotification("Could not clear browser-only demo data: " + error.message);
            return;
        }
        interventionRecords = Object.create(null);
        learningPosts = demoLearningPosts.slice();
        renderActionCenter();
        renderPeerLearning();
        const selectedStudentHeading = document.querySelector(".student-inspector .profile-placeholder h3");
        if (selectedStudentHeading) {
            const selected = students.find(function (student) {
                return String(student.student_id) === selectedStudentHeading.textContent;
            });
            if (selected) renderStudentDetails(selected);
        }
        showNotification("Local demo data cleared. Your display preferences were kept.");
    });

    const helpSearch = document.getElementById("helpSearch");
    if (helpSearch) helpSearch.addEventListener("input", function () {
        const query = helpSearch.value.trim().toLowerCase();
        const topics = Array.from(document.querySelectorAll("[data-help-topic]"));
        let visibleCount = 0;
        topics.forEach(function (topic) {
            const matches = topic.textContent.toLowerCase().includes(query);
            topic.hidden = !matches;
            if (matches) visibleCount += 1;
        });
        const noResults = document.getElementById("helpNoResults");
        if (noResults) noResults.hidden = visibleCount > 0;
    });

    if (footerYear) footerYear.textContent = new Date().getFullYear();
    const exportButton = document.getElementById("exportInterventionPlan");
    if (exportButton) exportButton.addEventListener("click", exportInterventionPlan);
    switchTab("overview");
    loadDashboard();
});
