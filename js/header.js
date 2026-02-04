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
                        <div class="nav-item-container" id="nav-activity-container">
                            <a href="activity.html" class="nav-item" id="nav-activity">Activity</a>
                            <div class="submenu" id="activity-submenu">
                                <a href="activity.html" class="submenu-item">Activity Log</a>
                                <a href="progress.html" class="submenu-item">Team Progress</a>
                            </div>
                        </div>
                    </nav>
                </div>

                <div class="header-right">

                    
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

            <!-- Page Title Subtitle (Hidden on mobile) -->
            <div class="header-row bottom-row" id="header-bottom-row">
                <!-- Content injected by JS based on page -->
            </div>
        </div>
    </header>

    <!-- Global Change Password Modal -->
    <div class="modal" id="changePasswordModal">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Change Password</h3>
                <button class="close-modal" id="cancelChangePasswordBtnXs">×</button>
            </div>
            <form id="changePasswordForm">
                <!-- Accessibility: Duplicate hidden username field -->
                <input type="text" name="username" autocomplete="username" style="display:none;">
                <div class="form-group" style="margin-top: 1rem;">
                    <label for="changeOldPassword">Current Password</label>
                    <input type="password" id="changeOldPassword" name="oldPassword" placeholder="Enter current password" required autocomplete="current-password" style="width: 100%; padding: 8px; margin-top: 4px; border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border);">
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label for="changeNewPassword">New Password</label>
                    <input type="password" id="changeNewPassword" name="newPassword" placeholder="Enter new password" required autocomplete="new-password" style="width: 100%; padding: 8px; margin-top: 4px; border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border);">
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label for="changeConfirmPassword">Confirm Password</label>
                    <input type="password" id="changeConfirmPassword" name="confirmPassword" placeholder="Confirm new password" required autocomplete="new-password" style="width: 100%; padding: 8px; margin-top: 4px; border-radius: 4px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border);">
                </div>
                <div class="modal-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="btn btn-secondary" id="cancelChangePasswordBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveChangePasswordBtn">Update</button>
                </div>
            </form>
        </div>
    </div>
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
    } else if (page === 'activity.html' || page === 'progress.html') {
        document.getElementById('nav-activity')?.classList.add('active');
        if (pageNameEl) pageNameEl.textContent = page === 'progress.html' ? 'Team Progress' : 'Activity Log';
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

    // --- User Dropdown & Password Modal ---
    const userTrigger = document.querySelector('.user-icon-trigger');
    const userMenu = document.getElementById('header-user-menu');
    const changePwdBtn = document.getElementById('header-change-password');
    const changePwdModal = document.getElementById('changePasswordModal');
    const changePwdForm = document.getElementById('changePasswordForm');
    const cancelChangePwdBtn = document.getElementById('cancelChangePasswordBtn');
    const cancelChangePwdBtnXs = document.getElementById('cancelChangePasswordBtnXs');
    const saveChangePwdBtn = document.getElementById('saveChangePasswordBtn');

    const closeChangePwdModal = () => {
        changePwdModal?.classList.remove('active');
    };

    if (userTrigger && userMenu) {
        userTrigger.onclick = (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        };
        document.addEventListener('click', () => userMenu.classList.remove('active'));
    }

    if (changePwdBtn && changePwdModal) {
        changePwdBtn.onclick = (e) => {
            e.preventDefault();
            changePwdModal.classList.add('active');
            userMenu?.classList.remove('active');
            changePwdForm?.reset();
        };
    }

    if (cancelChangePwdBtn) cancelChangePwdBtn.onclick = closeChangePwdModal;
    if (cancelChangePwdBtnXs) cancelChangePwdBtnXs.onclick = closeChangePwdModal;

    if (changePwdForm) {
        changePwdForm.onsubmit = async (e) => {
            e.preventDefault();
            const oldPwd = document.getElementById('changeOldPassword').value;
            const newPwd = document.getElementById('changeNewPassword').value;
            const confirmPwd = document.getElementById('changeConfirmPassword').value;

            if (newPwd !== confirmPwd) {
                alert('New passwords do not match');
                return;
            }

            const originalText = saveChangePwdBtn.textContent;
            saveChangePwdBtn.textContent = 'Verifying...';
            saveChangePwdBtn.disabled = true;

            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                if (!session) throw new Error('No active session found');
                const userEmail = session.user.email;

                const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                    email: userEmail,
                    password: oldPwd
                });
                if (signInError) throw new Error('Incorrect current password');

                const { error: updateError } = await window.supabaseClient.auth.updateUser({
                    password: newPwd
                });
                if (updateError) throw updateError;

                alert('Password updated successfully!');
                closeChangePwdModal();
            } catch (err) {
                alert(err.message);
            } finally {
                saveChangePwdBtn.textContent = originalText;
                saveChangePwdBtn.disabled = false;
            }
        };
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
                    <div class="week-display-container" id="weekPickerTrigger" style="cursor: pointer; display: flex; flex-direction: row; align-items: center; gap: 10px; padding: 4px 12px; border-radius: var(--radius-sm); transition: background 0.2s;">
                        <span class="week-badge" id="weekNumber">WEEK --</span>
                        <span class="date-range" id="dateRange" style="font-weight: 500;">-- --- - -- ---</span>
                        <span class="year-badge" id="yearBadge" style="font-size: 0.85rem; font-weight: 700; color: #991b1b; opacity: 0.9;">----</span>
                        <span class="mobile-week-label" id="mobileWeekLabel" style="display: none; font-weight: 600; font-size: 0.9rem;">W-- --- ----</span>
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
            <div class="header-right" id="header-right-col">
                <button class="mobile-clock-btn" id="mobileClockBtn" title="World Clocks">🕒</button>
            </div>

            <!-- Clocks Modal (Mobile) -->
            <div class="modal" id="clocksModal">
                <div class="modal-content" style="max-width: 350px;">
                    <div class="modal-header">
                        <h3>World Clocks</h3>
                        <button class="close-modal" id="closeClocksModal">×</button>
                    </div>
                    <div class="clocks-modal-list">
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
        `;

        // Mobile Clock Toggle
        const mobileClockBtn = document.getElementById('mobileClockBtn');
        const clocksModal = document.getElementById('clocksModal');
        const closeClocksModal = document.getElementById('closeClocksModal');

        if (mobileClockBtn && clocksModal) {
            mobileClockBtn.onclick = () => clocksModal.classList.add('active');
        }
        if (closeClocksModal && clocksModal) {
            closeClocksModal.onclick = () => clocksModal.classList.remove('active');
        }

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
            <div class="header-right" style="display: flex; align-items: center; padding-right: 20px;">
                <button class="btn btn-secondary" id="roadmapExportBtn" style="gap: 6px;">
                    <span>📤</span> Export
                </button>
            </div>
        `;
    }

    // User Session
    if (window.supabaseClient) {
        window.supabaseClient.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                const user = data.session.user;

                document.getElementById('header-user-initial').textContent = (user.user_metadata?.full_name || user.email)[0].toUpperCase();

                // Admin-only features (Activity Log & Progress)
                // Admin-only features (Activity Log & Progress)
                const isAdmin = user.email === 'david.groeve@lovepomegranate.com';
                const navActivityContainer = document.getElementById('nav-activity-container');

                if (navActivityContainer && !isAdmin) {
                    navActivityContainer.style.display = 'none';
                }

                // If on restricted page and not admin, redirect
                const path = window.location.pathname;
                const page = path.split('/').pop() || 'index.html';
                const restrictedPages = ['activity.html', 'progress.html'];
                if (restrictedPages.includes(page) && !isAdmin) {
                    window.location.href = 'index.html';
                }
            }
        });
    }
})();
