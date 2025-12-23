// Roadmap Logic
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase/Auth to be ready
    setTimeout(initRoadmap, 100);
});

let roadmapTasks = [];
let editingTaskId = null;
let collapsedGroups = new Set(); // Track collapsed task IDs

// Static data for roadmap markers (reverted from dynamic)
const roadmapMarkers = [
    { label: '1st Review to Go2Market', date: '2025-12-22', color_type: 'default' },
    { label: 'Go2Market', date: '2026-01-15', color_type: 'success' }
];

async function initRoadmap() {
    if (!window.db) {
        setTimeout(initRoadmap, 100);
        return;
    }

    // Load collapsed state from storage
    const savedCollapsed = localStorage.getItem('roadmap_collapsed');
    if (savedCollapsed) collapsedGroups = new Set(JSON.parse(savedCollapsed));

    // Load and apply saved column widths
    applySavedColumnWidths();

    await loadRoadmap();
    setupEventListeners();
    initTableResizers();
}

async function loadRoadmap() {
    const tableBody = document.getElementById('roadmapTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading milestones...</td></tr>';

    try {
        roadmapTasks = await window.db.getRoadmapTasks();
        renderRoadmap();
    } catch (error) {
        console.error('Error loading roadmap:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load roadmap. Please ensure the roadmap_tasks table exists.</td></tr>';
    }
}

function toggleGroup(taskId, e) {
    if (e) e.stopPropagation();
    if (collapsedGroups.has(taskId)) {
        collapsedGroups.delete(taskId);
    } else {
        collapsedGroups.add(taskId);
    }
    localStorage.setItem('roadmap_collapsed', JSON.stringify([...collapsedGroups]));
    renderRoadmap();
}

function expandAll() {
    collapsedGroups.clear();
    localStorage.setItem('roadmap_collapsed', JSON.stringify([]));
    renderRoadmap();
}

function collapseAll() {
    roadmapTasks.forEach(task => {
        const hasChildren = roadmapTasks.some(t => t.parent_id === task.id);
        if (hasChildren) {
            collapsedGroups.add(task.id);
        }
    });
    localStorage.setItem('roadmap_collapsed', JSON.stringify([...collapsedGroups]));
    renderRoadmap();
}

function renderRoadmap() {
    const tableBody = document.getElementById('roadmapTableBody');
    tableBody.innerHTML = '';

    if (roadmapTasks.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No milestones found. Add your first one!</td></tr>';
        return;
    }

    // Get top level tasks
    const topLevel = roadmapTasks.filter(t => !t.parent_id);
    topLevel.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(a.start_date) - new Date(b.start_date));

    topLevel.forEach(task => {
        renderBranch(task, 0);
    });

    renderGantt();
}

function renderBranch(task, level) {
    const children = roadmapTasks.filter(c => c.parent_id === task.id);
    children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(a.start_date) - new Date(b.start_date));

    const hasSubs = children.length > 0;
    const isCollapsed = collapsedGroups.has(task.id);

    renderTaskRow(task, level, hasSubs, isCollapsed);

    if (hasSubs && !isCollapsed) {
        children.forEach(child => {
            renderBranch(child, level + 1);
        });
    }
}

function getTaskProgress(task) {
    const children = roadmapTasks.filter(c => c.parent_id === task.id);
    if (children.length === 0) return task.progress || 0;
    const total = children.reduce((sum, child) => sum + getTaskProgress(child), 0);
    return Math.round(total / children.length);
}

function renderTaskRow(task, level, hasSubs = false, isCollapsed = false) {
    const tableBody = document.getElementById('roadmapTableBody');
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const calculatedProgress = getTaskProgress(task);

    const row = document.createElement('tr');
    row.className = `task-row level-${level}`;
    if (level === 0) row.classList.add('parent-group');
    row.style.cursor = 'pointer';
    row.setAttribute('draggable', 'true');
    row.dataset.id = task.id;

    // Draggable Events
    row.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        row.classList.add('dragging');
    };
    row.ondragend = () => row.classList.remove('dragging');

    row.ondragover = (e) => {
        e.preventDefault();
        const rect = row.getBoundingClientRect();
        const y = e.clientY - rect.top;
        row.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest');

        if (y < rect.height * 0.25) {
            row.classList.add('drag-over-top');
        } else if (y > rect.height * 0.75) {
            row.classList.add('drag-over-bottom');
        } else {
            row.classList.add('drag-over-nest');
        }
    };

    row.ondragleave = () => row.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest');

    row.ondrop = async (e) => {
        e.preventDefault();
        const dropType = row.classList.contains('drag-over-top') ? 'top' :
            row.classList.contains('drag-over-bottom') ? 'bottom' : 'nest';

        row.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest');

        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId === task.id) return;

        const draggedTask = roadmapTasks.find(t => t.id === draggedId);
        if (!draggedTask) return;

        let updates = {};
        if (dropType === 'nest') {
            updates = { parent_id: task.id };
        } else {
            // Reordering logic
            const targetParentId = task.parent_id || null;
            const siblings = roadmapTasks.filter(t => (t.parent_id || null) === targetParentId && t.id !== draggedId);
            siblings.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

            const targetIndex = siblings.findIndex(s => s.id === task.id);
            let newOrder = 0;

            if (dropType === 'top') {
                const prev = siblings[targetIndex - 1];
                const currentOrder = task.sort_order || 0;
                newOrder = prev ? ((prev.sort_order || 0) + currentOrder) / 2 : currentOrder - 1;
            } else {
                const next = siblings[targetIndex + 1];
                const currentOrder = task.sort_order || 0;
                newOrder = next ? (currentOrder + (next.sort_order || 0)) / 2 : currentOrder + 1;
            }

            updates = {
                parent_id: targetParentId,
                sort_order: newOrder
            };
        }

        try {
            const userEmail = (await window.supabaseClient.auth.getSession()).data.session?.user.email;
            await window.db.updateRoadmapTask(draggedId, updates, userEmail);
            await loadRoadmap();
        } catch (err) {
            console.error('Drop failed:', err);
        }
    };

    row.onclick = () => openModal(task);

    const indent = level * 32;
    const color = level === 0 ? 'inherit' : '#aaa';

    let iconHtml = '';
    if (hasSubs) {
        iconHtml = `<span class="toggle-icon">${isCollapsed ? '▶' : '▼'}</span> 📂`;
    } else {
        iconHtml = '<span style="width: 20px; display: inline-block; text-align: center;">•</span>';
    }

    row.innerHTML = `
        <td>
            <div class="task-name" style="padding-left: ${indent}px; color: ${color}">
                <span class="task-title-content" style="display: flex; align-items: center; gap: 8px;">
                    ${hasSubs ? `<div onclick="toggleGroup('${task.id}', event)" style="display: flex; align-items: center; gap: 4px;">${iconHtml}</div>` : iconHtml}
                    ${task.title}
                </span>
            </div>
            <div class="progress-bar-container" style="margin-left: ${indent + 28}px; width: calc(100% - ${indent + 28}px)">
                <div class="progress-bar-fill" style="width: ${calculatedProgress}%"></div>
            </div>
        </td>
        <td style="color: #888">${task.start_date}</td>
        <td style="color: #888">${task.end_date}</td>
        <td style="text-align: center;">${task.assigned_to || '-'}</td>
        <td style="font-weight: 700;">${calculatedProgress}%</td>
        <td style="color: #888">${diffDays}</td>
    `;
    tableBody.appendChild(row);
}

function renderGantt() {
    const ganttGrid = document.getElementById('ganttGrid');
    ganttGrid.innerHTML = '';

    if (roadmapTasks.length === 0) return;

    // Find date range
    const dates = roadmapTasks.flatMap(t => [new Date(t.start_date), new Date(t.end_date)]);
    if (dates.length === 0) return;

    // Full Range: Start from the earliest task
    const minDate = new Date(Math.min(...dates));
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() - 5); // Add 5 days buffer at start

    // End date: Max of tasks or at least 30 days from minDate
    const taskMaxDate = new Date(Math.max(...dates));
    // Ensure maxDate is at least Jan 25th 2026 to cover our new marker
    const targetEnd = new Date('2026-01-25T00:00:00').getTime();
    const maxDate = new Date(Math.max(taskMaxDate.getTime(), minDate.getTime() + (45 * 24 * 60 * 60 * 1000), targetEnd));
    maxDate.setDate(maxDate.getDate() + 10); // Add some padding

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    const dayWidth = 40; // px
    const ganttWidth = totalDays * dayWidth;

    ganttGrid.style.minWidth = `${ganttWidth}px`;

    // Auto-Scroll to "Day before yesterday" focus point
    const focusDate = new Date();
    focusDate.setDate(focusDate.getDate() - 2);
    const scrollDays = Math.max(0, Math.floor((focusDate - minDate) / (1000 * 60 * 60 * 24)));
    const scrollPos = scrollDays * dayWidth;

    // Apply scroll to the parent panel
    setTimeout(() => {
        const panel = document.querySelector('.gantt-panel');
        if (panel) panel.scrollLeft = scrollPos;
    }, 100);

    // Render Timeline
    const timeline = document.createElement('div');
    timeline.className = 'gantt-timeline';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(minDate);
        date.setDate(date.getDate() + i);

        const dayEl = document.createElement('div');
        dayEl.className = 'timeline-day';
        if (date.getTime() === today.getTime()) dayEl.classList.add('today');

        if (i === 0 || date.getDate() === 1 || (i % 5 === 0)) {
            dayEl.innerHTML = `${date.getDate()}<br>${date.toLocaleDateString('en-US', { month: 'short' })}`;
        }

        timeline.appendChild(dayEl);
    }
    ganttGrid.appendChild(timeline);

    // Render Today Marker (Full Column)
    const todayDiff = Math.round((today - minDate) / (1000 * 60 * 60 * 24));
    console.log('[DEBUG] Today Offset:', todayDiff);
    if (todayDiff >= 0 && todayDiff < totalDays) {
        const todayMarker = document.createElement('div');
        todayMarker.className = 'today-marker';
        todayMarker.style.left = `${todayDiff * dayWidth}px`;
        todayMarker.style.width = `${dayWidth}px`;
        ganttGrid.appendChild(todayMarker);
    }

    // Render Static Markers
    roadmapMarkers.forEach(marker => {
        const mDate = new Date(marker.date);
        const mDiff = Math.round((mDate - minDate) / (1000 * 60 * 60 * 24));

        if (mDiff >= 0 && mDiff < totalDays) {
            const markerEl = document.createElement('div');
            markerEl.className = `event-marker ${marker.color_type === 'success' ? 'success' : ''}`;
            markerEl.style.left = `${mDiff * dayWidth}px`;
            markerEl.style.width = `${dayWidth}px`;
            markerEl.innerHTML = `<div class="event-label">${marker.label}</div>`;
            ganttGrid.appendChild(markerEl);
        }
    });

    // Render Bars (Recursive ordering)
    const sortedTasks = [];
    const topLevelList = roadmapTasks.filter(t => !t.parent_id);
    topLevelList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(a.start_date) - new Date(b.start_date));

    function collectTasks(task) {
        sortedTasks.push(task);
        if (!collapsedGroups.has(task.id)) {
            const children = roadmapTasks.filter(c => c.parent_id === task.id);
            children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(a.start_date) - new Date(b.start_date));
            children.forEach(collectTasks);
        }
    }

    topLevelList.forEach(collectTasks);

    sortedTasks.forEach((task, index) => {
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);

        const left = (Math.ceil((start - minDate) / (1000 * 60 * 60 * 24))) * dayWidth;
        const width = (Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1) * dayWidth;
        const rowHeight = 60;
        const headerHeight = 90;
        const top = (index * rowHeight) + headerHeight + (rowHeight - 24) / 2; // Exact vertical center

        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        if (task.parent_id) bar.style.filter = 'opacity(0.8) saturate(0.8)';

        const calculatedProgress = getTaskProgress(task);
        bar.style.left = `${left}px`;
        bar.style.width = `${width}px`;
        bar.style.top = `${top}px`;
        bar.innerHTML = task.title;
        bar.title = `${task.title} (${task.start_date} to ${task.end_date}) - ${calculatedProgress}%`;

        // Add progress fill to Gantt bar
        if (calculatedProgress > 0) {
            const progressFill = document.createElement('div');
            progressFill.className = 'gantt-bar-fill';
            progressFill.style.width = `${calculatedProgress}%`;
            bar.appendChild(progressFill);

            // Re-append title to keep it on top
            const titleSpan = document.createElement('span');
            titleSpan.style.position = 'relative';
            titleSpan.style.zIndex = '2';
            titleSpan.innerHTML = task.title;
            bar.innerHTML = '';
            bar.appendChild(titleSpan);
            bar.appendChild(progressFill);
        }

        // Horizontal Dragging Logic
        let isDragging = false;
        let startX = 0;
        let originalLeft = left;

        bar.onmousedown = (e) => {
            if (e.button !== 0) return; // Left click only
            e.stopPropagation();
            isDragging = true;
            startX = e.clientX;
            originalLeft = parseFloat(bar.style.left);
            bar.classList.add('dragging-bar');

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                // Snap to dayWidth
                const snappedDx = Math.round(dx / dayWidth) * dayWidth;
                bar.style.left = `${originalLeft + snappedDx}px`;
            };

            const onMouseUp = async (upEvent) => {
                if (!isDragging) return;
                isDragging = false;
                bar.classList.remove('dragging-bar');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                const finalLeft = parseFloat(bar.style.left);
                if (finalLeft === originalLeft) {
                    // If no movement, open modal (existing behavior)
                    openModal(task);
                    return;
                }

                const daysShift = Math.round((finalLeft - originalLeft) / dayWidth);

                // Update dates
                const newStart = new Date(start);
                newStart.setDate(newStart.getDate() + daysShift);
                const newEnd = new Date(end);
                newEnd.setDate(newEnd.getDate() + daysShift);

                try {
                    const userEmail = (await window.supabaseClient.auth.getSession()).data.session?.user.email;
                    await window.db.updateRoadmapTask(task.id, {
                        start_date: newStart.toISOString().split('T')[0],
                        end_date: newEnd.toISOString().split('T')[0]
                    }, userEmail);
                    await loadRoadmap(); // Refresh
                } catch (err) {
                    console.error('Drag update failed:', err);
                    bar.style.left = `${originalLeft}px`; // Revert
                }
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        bar.onclick = (e) => {
            // bar.onmousedown already handles redirection to modal if no drag occurred
            e.stopPropagation();
        };

        ganttGrid.appendChild(bar);
    });
}

function openModal(task = null) {
    const modal = document.getElementById('roadmapModal');
    const title = document.getElementById('roadmapModalTitle');
    const delBtn = document.getElementById('deleteRoadmapTaskBtn');
    const parentSelect = document.getElementById('rtParent');
    const subtasksSection = document.getElementById('subtasksSection');
    const subtasksList = document.getElementById('modalSubtasksList');
    const linkSelect = document.getElementById('rtLinkSubtask');

    editingTaskId = task ? task.id : null;
    title.textContent = task ? 'Edit Milestone' : 'Add Project Milestone';
    delBtn.style.display = task ? 'flex' : 'none';

    // Populate Parent Select (All tasks except self)
    parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
    roadmapTasks.filter(t => t.id !== editingTaskId).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.title;
        parentSelect.appendChild(opt);
    });

    document.getElementById('rtTitle').value = task ? task.title : '';
    document.getElementById('rtStart').value = task ? task.start_date : '';
    document.getElementById('rtEnd').value = task ? task.end_date : '';
    document.getElementById('rtParent').value = (task && task.parent_id) ? task.parent_id : '';
    document.getElementById('rtAssigned').value = task ? task.assigned_to : '';

    // Progress calculation and read-only state
    const calculatedProgress = task ? getTaskProgress(task) : 0;
    const progressInput = document.getElementById('rtProgress');
    const hasChildren = task ? roadmapTasks.some(t => t.parent_id === task.id) : false;

    progressInput.value = calculatedProgress;
    progressInput.readOnly = hasChildren;
    progressInput.style.background = hasChildren ? 'rgba(255,255,255,0.05)' : '';
    progressInput.title = hasChildren ? 'Calculated from subtasks' : '';

    // Subtasks Management
    if (task) {
        subtasksSection.style.display = 'block';
        const subs = roadmapTasks.filter(t => t.parent_id === task.id);

        // Render current subtasks
        if (subs.length > 0) {
            subtasksList.innerHTML = subs.map(s => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>• ${s.title}</span>
                        <span style="font-size: 0.75rem; background: var(--accent-primary); color: white; padding: 1px 6px; border-radius: 10px;">${s.progress}%</span>
                    </div>
                    <button onclick="unlinkSubtask('${s.id}', event)" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; padding: 0 5px;">×</button>
                </div>
            `).join('');
        } else {
            subtasksList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic; padding: 4px;">No subtasks linked.</div>';
        }

        // Populate "Link" dropdown (Tasks that are NOT children, NOT self, and NOT current parent)
        linkSelect.innerHTML = '<option value="">-- Choose Task to Link --</option>';
        const currentSubIds = new Set(subs.map(s => s.id));
        roadmapTasks.filter(t => t.id !== task.id && t.id !== task.parent_id && !currentSubIds.has(t.id)).forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title;
            linkSelect.appendChild(opt);
        });
    } else {
        subtasksSection.style.display = 'none';
    }

    modal.classList.add('active');
}

async function unlinkSubtask(subtaskId, e) {
    if (e) e.stopPropagation();
    if (!confirm('Unlink this subtask from its parent?')) return;

    try {
        const userEmail = (await window.supabaseClient.auth.getSession()).data.session?.user.email;
        await window.db.updateRoadmapTask(subtaskId, { parent_id: null }, userEmail);

        // Refresh modal data
        const task = roadmapTasks.find(t => t.id === editingTaskId);
        await loadRoadmap();
        openModal(task);
    } catch (err) {
        console.error('Unlink failed:', err);
    }
}

function closeModal() {
    document.getElementById('roadmapModal').classList.remove('active');
    editingTaskId = null;
}

function setupEventListeners() {
    document.getElementById('addTaskBtn').onclick = () => openModal();
    document.getElementById('closeRoadmapModal').onclick = closeModal;
    document.getElementById('cancelRoadmapBtn').onclick = closeModal;

    // Linking logic
    document.getElementById('rtLinkSubtask').onchange = async (e) => {
        const targetId = e.target.value;
        if (!targetId || !editingTaskId) return;

        try {
            const userEmail = (await window.supabaseClient.auth.getSession()).data.session?.user.email;
            await window.db.updateRoadmapTask(targetId, { parent_id: editingTaskId }, userEmail);

            const task = roadmapTasks.find(t => t.id === editingTaskId);
            await loadRoadmap();
            openModal(task);
        } catch (err) {
            console.error('Linking failed:', err);
        }
    };

    document.getElementById('saveRoadmapTaskBtn').onclick = async () => {
        const title = document.getElementById('rtTitle').value;
        const start_date = document.getElementById('rtStart').value;
        const end_date = document.getElementById('rtEnd').value;
        const parent_id = document.getElementById('rtParent').value || null;
        const assigned_to = document.getElementById('rtAssigned').value;
        const progress = parseInt(document.getElementById('rtProgress').value) || 0;

        if (!title || !start_date || !end_date) {
            alert('Please fill in required fields (Title, Start, End)');
            return;
        }

        const taskData = { title, start_date, end_date, parent_id, assigned_to, progress };
        const userEmail = (await window.supabaseClient.auth.getSession()).data.session?.user.email;

        try {
            if (editingTaskId) {
                await window.db.updateRoadmapTask(editingTaskId, taskData, userEmail);
            } else {
                await window.db.createRoadmapTask(taskData, userEmail);
            }
            closeModal();
            await loadRoadmap();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error saving milestone. Check console for details.');
        }
    };

    document.getElementById('deleteRoadmapTaskBtn').onclick = async () => {
        if (!editingTaskId || !confirm('Are you sure you want to delete this milestone?')) return;

        const userEmail = (await window.supabaseClient.auth.getSession()).data.session?.user.email;
        try {
            await window.db.deleteRoadmapTask(editingTaskId, userEmail);
            closeModal();
            await loadRoadmap();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting milestone.');
        }
    };

    // Close on overlay click
    document.getElementById('roadmapModal').onclick = (e) => {
        if (e.target.id === 'roadmapModal') closeModal();
    };
}

function initTableResizers() {
    const resizers = document.querySelectorAll('.resizer');

    resizers.forEach(resizer => {
        const header = resizer.parentElement;
        let startX, startWidth;

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.clientX;
            startWidth = header.offsetWidth;

            resizer.classList.add('resizing');

            const onMouseMove = (moveEvent) => {
                const width = startWidth + (moveEvent.clientX - startX);
                if (width > 50) { // Minimum width
                    header.style.width = `${width}px`;
                    saveColumnWidths();
                }
            };

            const onMouseUp = () => {
                resizer.classList.remove('resizing');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    });
}

function saveColumnWidths() {
    const widths = {};
    const headers = document.querySelectorAll('.milestones-table th');
    headers.forEach((th, index) => {
        widths[index] = th.style.width;
    });
    localStorage.setItem('roadmap_column_widths', JSON.stringify(widths));
}

function applySavedColumnWidths() {
    const savedWidths = localStorage.getItem('roadmap_column_widths');
    if (savedWidths) {
        const widths = JSON.parse(savedWidths);
        const headers = document.querySelectorAll('.milestones-table th');
        headers.forEach((th, index) => {
            if (widths[index]) {
                th.style.width = widths[index];
            }
        });
    }
}
