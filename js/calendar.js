// Calendar Roadmap Logic
let roadmapTasks = [];
let selectedTaskIds = new Set();
let hideCompleted = false;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase/Auth to be ready
    setTimeout(initCalendar, 100);
});

async function initCalendar() {
    if (!window.db) {
        setTimeout(initCalendar, 100);
        return;
    }

    // Check session
    const session = await window.auth.protectRoute();
    if (!session) return;

    await loadData();
    setupEventListeners();
}

async function loadData() {
    try {
        const data = await window.db.getRoadmapTasks();
        // Sort tasks for consistency
        roadmapTasks = data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        // Default: select all
        selectedTaskIds = new Set(roadmapTasks.map(t => t.id));

        renderSidebar();
        renderCalendars();
    } catch (error) {
        console.error('Error loading roadmap tasks:', error);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('taskSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderSidebar();
        });
    }
}

function renderSidebar() {
    const sidebarList = document.getElementById('sidebarTaskList');
    if (!sidebarList) return;

    if (roadmapTasks.length === 0) {
        sidebarList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.8rem;">No tasks found.</div>';
        return;
    }

    const filtered = roadmapTasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery);
        const matchesCompleted = !hideCompleted || t.progress < 100;
        return matchesSearch && matchesCompleted;
    });

    sidebarList.innerHTML = '';

    // Group by Milestones (Level 0) for better organization
    const milestones = filtered.filter(t => !t.parent_id);

    milestones.forEach(m => {
        sidebarList.appendChild(createSidebarItem(m, 0));
        // Find children
        const children = filtered.filter(t => t.parent_id === m.id);
        children.forEach(c => {
            sidebarList.appendChild(createSidebarItem(c, 1));
            // Find sub-children (level 2)
            const subChildren = filtered.filter(t => t.parent_id === c.id);
            subChildren.forEach(sc => {
                sidebarList.appendChild(createSidebarItem(sc, 2));
            });
        });
    });

    // Add orphaned tasks (those whose parents don't match the filter but they do)
    const renderIds = new Set(sidebarList.querySelectorAll('.task-item').forEach(el => el.dataset.id));
    filtered.filter(t => !renderIds.has(t.id)).forEach(t => {
        sidebarList.appendChild(createSidebarItem(t, 0));
    });
}

function createSidebarItem(task, level) {
    const item = document.createElement('div');
    const isChecked = selectedTaskIds.has(task.id);
    const typeLevel = getTaskLevel(task);
    const dotClass = typeLevel === 0 ? 'dot-milestone' : (typeLevel === 1 ? 'dot-task' : 'dot-subtask');

    item.className = `task-item ${isChecked ? 'active' : ''}`;
    item.dataset.id = task.id;
    item.style.paddingLeft = `${level * 12 + 8}px`;

    item.innerHTML = `
        <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="toggleTaskSelection('${task.id}', event)">
        <div class="item-type-dot ${dotClass}"></div>
        <div class="item-label" title="${task.title}">${task.title}</div>
        ${task.progress === 100 ? '<span style="font-size: 0.6rem; opacity: 0.5;">✓</span>' : ''}
    `;

    item.onclick = (e) => {
        if (e.target.tagName !== 'INPUT') {
            toggleTaskSelection(task.id);
        }
    };

    return item;
}

function toggleTaskSelection(id, event) {
    if (event) event.stopPropagation();

    if (selectedTaskIds.has(id)) {
        selectedTaskIds.delete(id);
    } else {
        selectedTaskIds.add(id);
    }

    renderSidebar();
    renderCalendars();
}

function selectAllTasks(select) {
    if (select) {
        selectedTaskIds = new Set(roadmapTasks.map(t => t.id));
    } else {
        selectedTaskIds.clear();
    }
    renderSidebar();
    renderCalendars();
}

function toggleCompletedFilter() {
    hideCompleted = !hideCompleted;
    const btn = document.getElementById('toggleCompletedBtn');
    btn.textContent = hideCompleted ? 'Show Done' : 'Hide Done';
    renderSidebar();
    renderCalendars();
}

function scrollToMonth(monthId) {
    const el = document.getElementById(`month-${monthId}`);
    if (el) {
        const offset = 100; // Header offset
        const bodyRect = document.querySelector('.calendar-main').getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition + document.querySelector('.calendar-main').scrollTop - 20;

        document.querySelector('.calendar-main').scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function renderCalendars() {
    renderMonth(2025, 11); // December
    renderMonth(2026, 0);  // January
}

function renderMonth(year, month) {
    const monthId = `month-${year}-${month < 10 ? '0' + month : month}`;
    const grid = document.querySelector(`#${monthId} .calendar-grid`);
    if (!grid) return;

    // Clear existing days (keep headers)
    const headers = grid.querySelectorAll('.day-header');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Day calculations
    const startDayIdx = firstDay.getDay(); // Sunday = 0

    // Add empty cells for days before the first
    for (let i = 0; i < startDayIdx; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell other-month';
        grid.appendChild(emptyCell);
    }

    // Add actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const currentDate = new Date(year, month, d);
        const dayIdx = currentDate.getDay();
        const isWeekend = (dayIdx === 5 || dayIdx === 6); // Fri, Sat

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        if (isWeekend) cell.classList.add('weekend');
        if (currentDate.getTime() === today.getTime()) cell.classList.add('today');

        cell.innerHTML = `
            <span class="day-number">${d}</span>
            <div class="tasks-container"></div>
        `;

        const container = cell.querySelector('.tasks-container');
        const dayStr = currentDate.toISOString().split('T')[0];

        const dayTasks = getTasksForDate(dayStr);
        dayTasks.forEach(task => {
            const taskEl = document.createElement('div');
            const level = getTaskLevel(task);
            let typeClass = level === 0 ? 'milestone' : (level === 1 ? 'task' : 'subtask');

            // Subtask color rotation (if multiple subtasks exist for same parent)
            if (level >= 2 && task.parent_id) {
                // Get all subtasks belonging to this parent
                const siblings = roadmapTasks.filter(t => t.parent_id === task.parent_id);
                // Find index of current subtask among siblings
                const siblingIndex = siblings.findIndex(s => s.id === task.id);
                if (siblingIndex > 0) {
                    typeClass = `subtask-${(siblingIndex % 3) + 1}`; // subtask-1, subtask-2, subtask-3
                } else {
                    typeClass = 'subtask'; // default Amber for first subtask
                }
            }

            taskEl.className = `task-tag ${typeClass}`;
            if (task.progress === 100) taskEl.classList.add('completed');

            // Check if multi-day and positioning
            const isStart = task.start_date === dayStr;
            const isEnd = task.end_date === dayStr;
            if (task.start_date !== task.end_date) {
                if (isStart) taskEl.classList.add('multi-day-start');
                else if (isEnd) taskEl.classList.add('multi-day-end');
                else taskEl.classList.add('multi-day-middle');
            }

            // Shows full title (CSS handles wrapping)
            taskEl.textContent = task.title;
            taskEl.title = `${task.title} (${task.start_date} to ${task.end_date}) - ${task.progress}%`;
            taskEl.onclick = () => {
                window.location.href = `roadmap.html?task=${task.id}`;
            };
            container.appendChild(taskEl);
        });

        grid.appendChild(cell);
    }

    // Fill the rest of the week if needed
    const remainingDays = 7 - ((startDayIdx + lastDay.getDate()) % 7);
    if (remainingDays < 7) {
        for (let i = 0; i < remainingDays; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell other-month';
            grid.appendChild(emptyCell);
        }
    }
}

function getTaskLevel(task) {
    if (!task.parent_id) return 0;
    let level = 0;
    let current = task;
    while (current.parent_id) {
        level++;
        const parent = roadmapTasks.find(t => t.id === current.parent_id);
        if (!parent) break;
        current = parent;
    }
    return level;
}

function getTasksForDate(dateStr) {
    return roadmapTasks.filter(task => {
        // Essential filter: Is it selected?
        if (!selectedTaskIds.has(task.id)) return false;

        // Date range check
        return dateStr >= task.start_date && dateStr <= task.end_date;
    });
}
