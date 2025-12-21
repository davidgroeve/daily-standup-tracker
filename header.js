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
                            
                            <!-- User Info Popover (Hover) -->
                            <div class="user-info-popover">
                                <span class="popover-user-email" id="header-user-email">user@example.com</span>
                                <span class="popover-user-name" id="header-user-display-name">Team Member</span>
                            </div>
                        </div>

                        <!-- User Dropdown (Click) -->
                        <div class="user-dropdown">
                            <a href="#" class="user-dropdown-item">👤 Profile</a>
                            <a href="#" class="user-dropdown-item" id="header-change-password">🔑 Reset Password</a>
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
    } else if (page === 'roadmap.html') {
        document.getElementById('nav-roadmap')?.classList.add('active');
        if (pageNameEl) pageNameEl.textContent = 'Roadmap';
        initRoadmapRow();
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
            document.documentElement.setAttribute('data-theme', next);
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
        const clocks = document.querySelectorAll('.analog-clock');
        clocks.forEach(clock => {
            const timezone = clock.dataset.timezone;
            if (!timezone) return;
            const now = new Date();
            const options = { timeZone: timezone, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
            const timeString = now.toLocaleTimeString('en-US', options);
            const [hours, minutes, seconds] = timeString.split(':').map(Number);

            const hourHand = clock.querySelector('.hour-hand');
            const minuteHand = clock.querySelector('.minute-hand');
            const secondHand = clock.querySelector('.second-hand');

            if (hourHand && minuteHand && secondHand) {
                const hourDeg = (hours % 12) * 30 + minutes * 0.5;
                const minuteDeg = minutes * 6 + seconds * 0.1;
                const secondDeg = seconds * 6;
                hourHand.style.transform = `rotate(${hourDeg}deg)`;
                minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
                secondHand.style.transform = `rotate(${secondDeg}deg)`;
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
                <div class="zoom-control" title="Adjust Column Width">
                    <label>Zoom</label>
                    <input type="range" class="zoom-slider" id="gridZoomSlider" min="200" max="600" value="280">
                </div>
            </div>
            <div class="header-center">
                <div class="header-clocks-inline">
                    <div class="clock-wrapper" title="Riyadh"><div class="analog-clock header-clock clock-sa" data-timezone="Asia/Riyadh"><div class="clock-face"><div class="clock-center"></div><div class="hand hour-hand"></div><div class="hand minute-hand"></div><div class="hand second-hand"></div></div></div></div>
                    <div class="clock-wrapper" title="Madrid"><div class="analog-clock header-clock clock-es" data-timezone="Europe/Madrid"><div class="clock-face"><div class="clock-center"></div><div class="hand hour-hand"></div><div class="hand minute-hand"></div><div class="hand second-hand"></div></div></div></div>
                    <div class="clock-wrapper" title="London"><div class="analog-clock header-clock clock-uk" data-timezone="Europe/London"><div class="clock-face"><div class="clock-center"></div><div class="hand hour-hand"></div><div class="hand minute-hand"></div><div class="hand second-hand"></div></div></div></div>
                    <div class="clock-wrapper" title="Mexico"><div class="analog-clock header-clock clock-mx" data-timezone="America/Mexico_City"><div class="clock-face"><div class="clock-center"></div><div class="hand hour-hand"></div><div class="hand minute-hand"></div><div class="hand second-hand"></div></div></div></div>
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
            <div class="header-left"></div>
            <div class="header-center">
                <button class="btn btn-primary" id="addTaskBtn">
                    <span>➕</span> Create New Milestone
                </button>
            </div>
            <div class="header-right"></div>
        `;
    }

    // User Session
    if (window.supabase) {
        window.supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                const user = data.session.user;
                document.getElementById('header-user-email').textContent = user.email;
                document.getElementById('header-user-display-name').textContent = user.user_metadata?.full_name || user.email.split('@')[0];
                document.getElementById('header-user-initial').textContent = (user.user_metadata?.full_name || user.email)[0].toUpperCase();
            }
        });
    }
})();
