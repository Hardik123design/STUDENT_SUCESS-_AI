// Student Academic Monitoring System - UI Interactions & Routing
document.addEventListener("DOMContentLoaded", function () {

    // DOM Elements
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

    // Route titles and headers
    const routes = {
        overview: { title: "Dashboard Overview", label: "OVERVIEW" },
        students: { title: "Student Records", label: "STUDENTS" },
        analytics: { title: "Batch Analytics", label: "ANALYTICS" },
        risk: { title: "Risk Assessment", label: "RISK" },
        ai: { title: "Predictive Analysis", label: "PREDICTIONS" }
    };

    // Notification toast handler
    let toastTimer = null;
    function showNotification(msg) {
        if (!toast || !toastText) return;
        toastText.textContent = msg;
        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 2500);
    }

    // Tab view switching
    function switchTab(viewId) {
        if (!routes[viewId]) return;

        // Toggle active page
        viewSections.forEach(function (sec) {
            sec.classList.remove("is-active");
            if (sec.dataset.view === viewId) {
                sec.classList.add("is-active");
            }
        });

        // Toggle nav button states
        navButtons.forEach(function (btn) {
            btn.classList.toggle("active", btn.dataset.page === viewId);
        });

        // Update headers
        if (pageTitle) pageTitle.textContent = routes[viewId].title;
        if (currentSection) currentSection.textContent = routes[viewId].label;

        // Collapse mobile menu & search if open
        if (sidebar) sidebar.classList.remove("open");
        closeSearchDialog();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Sidebar navigation click events
    navButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const page = this.dataset.page;
            if (page) switchTab(page);
        });
    });

    // In-page navigation buttons
    const actionLinks = document.querySelectorAll("[data-go-page]");
    actionLinks.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const page = this.dataset.goPage;
            if (page) switchTab(page);
        });
    });

    // Mobile drawer toggle
    if (mobileMenu && sidebar) {
        mobileMenu.addEventListener("click", function () {
            sidebar.classList.toggle("open");
        });
    }

    // Close mobile drawer on outside click
    document.addEventListener("click", function (e) {
        if (!sidebar || !mobileMenu) return;
        if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !mobileMenu.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });

    // Search dialog controls
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
        searchModal.addEventListener("click", function (e) {
            if (e.target === searchModal) closeSearchDialog();
        });
    }

    // Keyboard shortcuts: Ctrl+K to search, Esc to close
    document.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            openSearchDialog();
        }
        if (e.key === "Escape") {
            closeSearchDialog();
            if (sidebar) sidebar.classList.remove("open");
        }
    });

    // Global quick search input
    if (globalSearch) {
        globalSearch.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                const query = this.value.trim();
                if (!query) {
                    showNotification("Please enter a search term.");
                    return;
                }
                showNotification("No results found for '" + query + "'. Connect database first.");
            }
        });
    }

    // Student list search bar
    if (studentSearch) {
        studentSearch.addEventListener("input", function () {
            if (this.value.trim().length > 0) {
                showNotification("Searching local table... (Awaiting record data)");
            }
        });
    }

    // Risk category filter buttons
    const filterBtns = document.querySelectorAll(".filter-button");
    filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            filterBtns.forEach(function (b) { b.classList.remove("active"); });
            this.classList.add("active");

            const filterType = this.dataset.filter;
            if (filterType === "all") {
                showNotification("Showing all categories.");
            } else {
                showNotification("Filter set to: " + this.textContent.trim());
            }
        });
    });

    // Prediction query box
    function handleModelQuery() {
        if (!aiPrompt) return;
        const query = aiPrompt.value.trim();
        if (!query) {
            showNotification("Please enter a roll number or question.");
            aiPrompt.focus();
            return;
        }

        showNotification("Running inference script for: " + query + " (Model offline)");
        aiPrompt.value = "";
    }

    if (aiSend) aiSend.addEventListener("click", handleModelQuery);
    if (aiPrompt) {
        aiPrompt.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                handleModelQuery();
            }
        });
    }

    // Generic button alerts
    const toastTriggers = document.querySelectorAll("[data-toast]");
    toastTriggers.forEach(function (btn) {
        btn.addEventListener("click", function () {
            showNotification(this.dataset.toast);
        });
    });

    // Footer copyright year
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // Default initialization
    switchTab("overview");
});