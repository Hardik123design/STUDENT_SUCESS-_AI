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
        ai: { title: "Predictive Analysis", label: "PREDICTIONS" }
    };
    let students = [];
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
            if (index === 0) item.lastChild.textContent = connected ? " Backend connected" : " Backend offline";
            if (index === 1) item.lastChild.textContent = connected ? " Live student data" : " Data unavailable";
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
            escapeHtml(student.coding_score) + '</p></section><section class="student-insight-section scenario-section">' +
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
        tableBody.innerHTML = flagged.length ? flagged.map(function (student) {
            const drivers = Array.isArray(student.risk_drivers) && student.risk_drivers.length
                ? student.risk_drivers.map(function (driver) {
                    return driver.message;
                }).join(" ")
                : "No individual factor threshold triggered.";
            return '<tr><td><strong>' + escapeHtml(student.student_id) + '</strong><small class="table-subtext">' +
                escapeHtml(student.department || "") + '</small></td><td>' + escapeHtml(student.success_score) +
                '</td><td>' + escapeHtml(student.attendance) + '%</td><td>' +
                '<span class="student-risk risk-' + riskClass(student.placement_risk) + '">' +
                escapeHtml(student.placement_risk || "UNKNOWN") + '</span></td><td>' +
                escapeHtml(drivers) + '</td><td><span class="student-risk risk-' +
                riskClass(student.risk) + '">' + escapeHtml(student.risk) + '</span></td><td><strong>' +
                escapeHtml(student.segment_label || "Unclassified") + '</strong><small class="table-subtext">' +
                escapeHtml(student.recommended_action || "") + '</small></td></tr>';
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
        setText("placementRiskCount", summary.placement_risk_students == null
            ? "--"
            : summary.placement_risk_students);
        const coreScore = document.querySelector(".core-score span");
        if (coreScore) coreScore.textContent = Number(summary.average_success_score).toFixed(0);
        const coreLabel = document.querySelector(".core-label");
        if (coreLabel) coreLabel.textContent = "AVERAGE SUCCESS SCORE";
        const coreChip = document.querySelector(".core-top .live-chip");
        if (coreChip) coreChip.textContent = "LIVE DATA";
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

    async function loadSegmentAnalytics() {
        const container = document.getElementById("segmentGrid");
        if (!container) return;
        const segments = await apiRequest("/analytics/segments");
        if (!Array.isArray(segments)) throw new Error("Student segments returned an unexpected response.");
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

    async function loadDashboard() {
        setConnectionState(false, "Connecting to backend…");
        try {
            const results = await Promise.all([
                apiRequest("/students"),
                apiRequest("/summary")
            ]);
            if (!Array.isArray(results[0])) throw new Error("Student records returned an unexpected response.");
            students = results[0];
            renderSummary(results[1]);
            renderStudentDirectory();
            renderPriorityTable();
            renderRiskTable();
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
            showNotification("Backend connection failed. Start the Flask API and reload.");
        }
    }

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
    if (footerYear) footerYear.textContent = new Date().getFullYear();
    const exportButton = document.getElementById("exportInterventionPlan");
    if (exportButton) exportButton.addEventListener("click", exportInterventionPlan);
    switchTab("overview");
    loadDashboard();
});
