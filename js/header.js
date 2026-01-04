/**
 * Shared Header Component
 * Dynamically injects the two-row header into the #header-container
 */

(function () {
    const headerHTML = `
    <header class="header">
        <div class="header-container">
            <!-- Row 1: Primary Navigation -->
            <div class="header-row top-row">
                <div class="header-left">
                    <div class="header-logo-container" onclick="window.location.href='index.html'">
                        <img src="${(localStorage.getItem('theme') === 'light') ? 'public/Rommaana-Original.png' : 'public/rommaana-logo-white.png'}" alt="Rommaana" class="logo" id="header-logo">
                        <span class="page-title" id="header-page-name">Stand-up</span>
                    </div>
                </div>

                <div class="header-center">
                    <nav class="nav-menu">
                        <div class="nav-item-container">
                            <a href="index.html" class="nav-item" id="nav-standup">Stand-up</a>
                        </div>
                        <div class="nav-item-container">
                            <a href="roadmap.html" class="nav-item" id="nav-roadmap">Roadmap</a>
                            <div class="submenu">
                                <a href="roadmap.html" class="submenu-item">Timeline</a>
                                <a href="calendar.html" class="submenu-item">Calendar View</a>
                                <a href="#" class="submenu-item">Board (Soon)</a>
                                <a href="#" class="submenu-item">List (Soon)</a>
                            </div>
                        </div>
                        <div class="nav-item-container">
                            <a href="analytics.html" class="nav-item" id="nav-analytics">Analytics</a>
                        </div>
                        <div class="nav-item-container">
                            <a href="activity.html" class="nav-item" id="nav-activity">Activity</a>
                        </div>
                    </nav>
                </div>

                <div class="header-right">
                    <button class="ai-btn" id="header-ai-btn">
                        <span>✨</span> AI Assistant
                    </button>
                    
                    <button class="btn btn-secondary btn-icon" id="header-theme-toggle" title="Toggle Theme">
                        🌙
                    </button>

                    <div class="user-menu-container" id="header-user-menu">
                        <div class="user-icon-trigger">
                            <div class="user-avatar" id="header-user-initial">U</div>
                            

                        </div>

                        <!-- User Dropdown (Click) -->
                        <div class="user-dropdown">
                            <a href="#" class="user-dropdown-item" id="header-manage-team">👥 Manage Team</a>
                            <a href="#" class="user-dropdown-item" id="header-change-password">🔑 Reset Password</a>
                            <a href="wiki.html" target="_blank" class="user-dropdown-item" id="header-wiki-link">📖 User Manual (Wiki)</a>
                            <a href="#" class="user-dropdown-item">ℹ️ More Info</a>
                            <div class="user-dropdown-divider"></div>
                            <a href="#" class="user-dropdown-item danger" id="header-logout">🚪 Logout</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Row 2: Page-specific Controls (Optional) -->
            <div class="header-row bottom-row" id="header-bottom-row">
                <!-- Content injected by JS based on page -->
            </div>
        </div>
    </header>
    `;

    // Inject Header
    const container = document.getElementById('header-container');
    if (container) {
        container.innerHTML = headerHTML;
    } else {
        const existingHeader = document.querySelector('header.header');
        if (existingHeader) {
            existingHeader.outerHTML = headerHTML;
        }
    }

    // Set Active State and Page Name
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const pageNameEl = document.getElementById('header-page-name');

    if (page === 'index.html' || page === '') {
        document.getElementById('nav-standup')?.classList.add('active');
        if (pageNameEl) pageNameEl.textContent = 'Stand-up';
        initStandupRow();
    } else if (page === 'roadmap.html' || page === 'calendar.html') {
        document.getElementById('nav-roadmap')?.classList.add('active');
        if (pageNameEl) pageNameEl.textContent = page === 'calendar.html' ? 'Roadmap Calendar' : 'Roadmap';
        if (page === 'roadmap.html') initRoadmapRow();
    } else if (page === 'analytics.html') {
        document.getElementById('nav-analytics')?.classList.add('active');
        if (pageNameEl) pageNameEl.textContent = 'Analytics';
    } else if (page === 'activity.html') {
        document.getElementById('nav-activity')?.classList.add('active');
        if (pageNameEl) pageNameEl.textContent = 'Activity Log';
    }

    // Theme Logic
    const themeBtn = document.getElementById('header-theme-toggle');
    if (themeBtn) {
        const updateThemeUI = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
            const logoEl = document.getElementById('header-logo');
            if (logoEl) {
                logoEl.src = theme === 'light' ? 'public/Rommaana-Original.png' : 'public/rommaana-logo-white.png';
            }
        };
        const currentTheme = localStorage.getItem('theme') || 'dark';
        updateThemeUI(currentTheme);

        themeBtn.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', next);
            updateThemeUI(next);
        };
    }

    // User Dropdown
    const userTrigger = document.querySelector('.user-icon-trigger');
    const userMenu = document.getElementById('header-user-menu');
    if (userTrigger && userMenu) {
        userTrigger.onclick = (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        };
        document.addEventListener('click', () => userMenu.classList.remove('active'));
    }

    // Wiki Context Link
    const wikiLink = document.getElementById('header-wiki-link');
    if (wikiLink) {
        const getWikiContext = () => {
            const path = window.location.pathname;
            const page = path.split('/').pop() || 'index.html';
            if (page === 'index.html' || page === '') return '#standup';
            if (page === 'roadmap.html' || page === 'calendar.html') return '#roadmap';
            if (page === 'analytics.html') return '#analytics';
            if (page === 'activity.html') return '#activity';
            return '#welcome';
        };
        wikiLink.href = 'wiki.html' + getWikiContext();
    }

    // Logout
    document.getElementById('header-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.auth) await window.auth.signOut();
    });

    // World Clocks Logic
    function initClocks() {
        updateClocks();
        setInterval(updateClocks, 1000);
    }

    function updateClocks() {
        const clocks = document.querySelectorAll('.digital-clock-container');
        clocks.forEach(clock => {
            const timezone = clock.dataset.timezone;
            if (!timezone) return;

            const now = new Date();
            const options = { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
            const timeString = now.toLocaleTimeString('en-US', options);
            const [hours, minutes] = timeString.split(':');

            // Day/Night Logic (6:00 - 18:00 is Day)
            const hourInt = parseInt(hours, 10);
            const isDay = hourInt >= 6 && hourInt < 18;

            clock.classList.remove('is-day', 'is-night');
            clock.classList.add(isDay ? 'is-day' : 'is-night');

            const timeDisplay = clock.querySelector('.digital-time');
            if (timeDisplay) {
                // Determine icon
                const icon = isDay ? '☀️' : '🌙';

                timeDisplay.innerHTML = `
                    <span class="day-night-icon" style="margin-right: 6px; font-size: 0.8rem; opacity: 0.8;">${icon}</span>
                    <span class="time-unit">${hours}</span>
                    <span class="separator">:</span>
                    <span class="time-unit">${minutes}</span>
                `;
            }
        });
    }

    function initStandupRow() {
        const bottomRow = document.getElementById('header-bottom-row');
        if (!bottomRow) return;
        bottomRow.style.display = 'flex';
        bottomRow.innerHTML = `
            <div class="header-left">
                <div class="week-info">
                    <button class="btn btn-secondary btn-icon" id="prevWeekBtn" title="Previous Week">◀</button>
                    <div>
                        <span class="week-badge" id="weekNumber">WEEK --</span>
                        <span class="date-range" id="dateRange">-- --- - -- ---</span>
                    </div>
                    <button class="btn btn-secondary btn-icon" id="nextWeekBtn" title="Next Week">▶</button>
                </div>
            </div>
            <div class="header-center">
                <div class="header-clocks-inline">
                    <div class="digital-clock-group">
                        <div class="digital-clock-container clock-sa" data-timezone="Asia/Riyadh" title="Riyadh">
                            <div class="clock-label">Riyadh</div>
                            <div class="digital-time">--:--</div>
                        </div>
                        <div class="digital-clock-container clock-es" data-timezone="Europe/Madrid" title="Madrid">
                            <div class="clock-label">Madrid</div>
                            <div class="digital-time">--:--</div>
                        </div>
                        <div class="digital-clock-container clock-uk" data-timezone="Europe/London" title="London">
                            <div class="clock-label">London</div>
                            <div class="digital-time">--:--</div>
                        </div>
                        <div class="digital-clock-container clock-mx" data-timezone="America/Mexico_City" title="Mexico">
                            <div class="clock-label">Mexico</div>
                            <div class="digital-time">--:--</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="header-right" id="header-right-col"></div>
        `;
        initClocks();
    }

    function initRoadmapRow() {
        const bottomRow = document.getElementById('header-bottom-row');
        if (!bottomRow) return;
        bottomRow.style.display = 'flex';
        bottomRow.innerHTML = `
            <div class="header-left" style="display: flex; align-items: center; padding-left: 20px;">
                 <div class="roadmap-filter-container" style="position: relative;">
                    <button class="btn btn-secondary" id="roadmapFilterBtn" style="gap: 6px;">
                        <span>🚩</span> Select Items
                    </button>
                    <!-- Dropdown Content -->
                    <div class="roadmap-filter-dropdown" id="roadmapFilterDropdown">
                        <div class="picker-header">
                            <h3>Filter Tasks</h3>
                            <div class="search-box">
                                <input type="text" id="roadmapTaskSearch" placeholder="Search tasks...">
                            </div>
                            <div class="picker-actions">
                                <button class="btn btn-secondary btn-tiny" id="filterSelectAll">All</button>
                                <button class="btn btn-secondary btn-tiny" id="filterSelectNone">None</button>
                                <button class="btn btn-secondary btn-tiny" id="filterHideDone">Hide Done</button>
                            </div>
                        </div>
                        <div class="task-list" id="roadmapFilterList">
                            <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.8rem;">Loading...</div>
                        </div>
                        <div class="picker-footer" style="padding: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; background: rgba(0,0,0,0.1);">
                            <button class="btn btn-primary" id="filterDoneBtn" style="padding: 4px 16px; font-size: 0.75rem; height: auto; width: auto;">Done</button>
                        </div>
                    </div>
                 </div>
            </div>
            <div class="header-center">
                <button class="btn btn-primary" id="addTaskBtn">
                    <span>➕</span> Create New Milestone
                </button>
            </div>
            <div class="header-right"></div>
        `;
    }

    // User Session
    if (window.supabaseClient) {
        window.supabaseClient.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                const user = data.session.user;

                document.getElementById('header-user-initial').textContent = (user.user_metadata?.full_name || user.email)[0].toUpperCase();

                // Admin-only features (Activity Log)
                const isAdmin = user.email === 'david.groeve@lovepomegranate.com';
                const navActivity = document.getElementById('nav-activity');

                if (navActivity) {
                    if (!isAdmin) {
                        navActivity.parentElement.style.display = 'none';
                    }
                }

                // If on activity.html and not admin, redirect
                const path = window.location.pathname;
                const page = path.split('/').pop() || 'index.html';
                if (page === 'activity.html' && !isAdmin) {
                    window.location.href = 'index.html';
                }
            }
        });
    }
})();
