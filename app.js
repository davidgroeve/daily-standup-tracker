// Global State
let state = {
  teamMembers: [],
  updates: {}, // { memberId_date: { content: [...], timestamp: '' } }
  goals: [],
  roadmapTasks: [],
  leaves: [],
  currentWeekStart: null,
  editingMember: null,
  editingUpdate: null,
  editingGoal: null,
  editingLeave: null,
  isLoading: false,
  currentUserEmail: 'Unknown'
};

// Collapsible Sections
function toggleSection(section) {
  const sectionEl = document.getElementById(section + 'Section');
  if (sectionEl) {
    sectionEl.classList.toggle('collapsed');
    // Save state to localStorage
    const collapsed = sectionEl.classList.contains('collapsed');
    localStorage.setItem(section + 'Collapsed', collapsed);
  }
}

function restoreCollapsedState() {
  ['goals', 'leaves'].forEach(section => {
    const collapsed = localStorage.getItem(section + 'Collapsed') === 'true';
    const sectionEl = document.getElementById(section + 'Section');
    if (sectionEl && collapsed) {
      sectionEl.classList.add('collapsed');
    }
  });
}

// Available colors for team members
const COLORS = [
  { name: 'gustavo', value: '#FFB5C5' },
  { name: 'david', value: '#B5E7F5' },
  { name: 'amitava', value: '#F5B5E7' },
  { name: 'abdelilah', value: '#E7B5F5' },
  { name: 'patito', value: '#B5F5D4' },
  { name: 'oscar', value: '#F5E7B5' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  initializeWeek();

  // Get current user email
  try {
    const user = await window.auth.getUser();
    if (user && user.email) {
      state.currentUserEmail = user.email;
    }
  } catch (e) {
    console.error('Error fetching user:', e);
  }

  await loadDataFromDB();
  restoreCollapsedState(); // Restore collapsed sections
  renderAll();
  attachEventListeners();

  // Refresh Logs Listener
  const refreshBtn = document.getElementById('refreshLogsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const list = document.getElementById('changeLogsList');
      if (list) list.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Refreshing...</p>';
      loadAndRenderChangeLogs();
    });
  }

  // Header Nav & Leaves Interaction
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'prevWeekBtn') navigateWeek(-1);
    if (e.target.id === 'nextWeekBtn') navigateWeek(1);

    const leavesTrigger = e.target.closest('#header-right-col');
    if (leavesTrigger) {
      openLeavesDetailModal();
    }
  });


  // Change Password Logic
  const changePwdBtn = document.getElementById('changePasswordBtn');
  const changePwdModal = document.getElementById('changePasswordModal');
  const cancelChangePwdBtn = document.getElementById('cancelChangePasswordBtn');
  const cancelChangePwdBtnXs = document.getElementById('cancelChangePasswordBtnXs');
  const saveChangePwdBtn = document.getElementById('saveChangePasswordBtn');

  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      changePwdModal.style.display = 'flex';
      document.getElementById('changeOldPassword').value = '';
      document.getElementById('changeNewPassword').value = '';
      document.getElementById('changeConfirmPassword').value = '';
    });
  }

  const closeChangePwdModal = () => {
    if (changePwdModal) changePwdModal.style.display = 'none';
  };

  if (cancelChangePwdBtn) cancelChangePwdBtn.addEventListener('click', closeChangePwdModal);
  if (cancelChangePwdBtnXs) cancelChangePwdBtnXs.addEventListener('click', closeChangePwdModal);

  if (saveChangePwdBtn) {
    saveChangePwdBtn.addEventListener('click', async () => {
      const oldPwd = document.getElementById('changeOldPassword').value;
      const newPwd = document.getElementById('changeNewPassword').value;
      const confirmPwd = document.getElementById('changeConfirmPassword').value;

      if (!oldPwd || !newPwd || !confirmPwd) {
        alert('Please fill in all fields');
        return;
      }

      if (newPwd !== confirmPwd) {
        alert('New passwords do not match');
        return;
      }

      const originalText = saveChangePwdBtn.textContent;
      saveChangePwdBtn.textContent = 'Verifying...';
      saveChangePwdBtn.disabled = true;

      try {
        // 1. Verify Old Password by Signing In
        const { error: signInError } = await window.auth.signIn(state.currentUserEmail, oldPwd);
        if (signInError) {
          throw new Error('Incorrect current password');
        }

        // 2. Update to New Password
        saveChangePwdBtn.textContent = 'Updating...';
        const { error: updateError } = await window.auth.updatePassword(newPwd);
        if (updateError) throw updateError;

        alert('Password updated successfully!');
        closeChangePwdModal();
      } catch (e) {
        alert(e.message);
      } finally {
        saveChangePwdBtn.textContent = originalText;
        saveChangePwdBtn.disabled = false;
      }
    });
  }
});



// Add this line inside attachEventListeners or logic
document.getElementById('showHolidayCalendarBtn')?.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent toggling section
  openHolidayCalendar();
});

// Date Utilities
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday is day 0, so subtract day to get to Sunday
  return new Date(d.setDate(diff));
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatDate(date, format = 'short') {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  } else if (format === 'day') {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  // Return YYYY-MM-DD in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Initialize week
function initializeWeek() {
  const saved = localStorage.getItem('dailyStandupCurrentWeek');
  if (saved) {
    state.currentWeekStart = new Date(saved);
  } else {
    state.currentWeekStart = getWeekStart(new Date());
  }
}

// Load data from Supabase
async function loadDataFromDB() {
  state.isLoading = true;
  try {
    // Load team members
    state.teamMembers = await window.db.getTeamMembers();

    // Load updates
    state.updates = await window.db.getUpdates();

    // Load goals for current week
    const weekStart = formatDate(state.currentWeekStart, 'iso');
    state.goals = await window.db.getGoals(weekStart);

    // Load leaves
    state.leaves = await window.db.getLeaves();

    // Load roadmap tasks
    state.roadmapTasks = await window.db.getRoadmapTasks();
  } catch (error) {
    console.error('Error loading data from database:', error);
    // Fallback to localStorage if DB fails
    loadFromLocalStorage();
  }
  state.isLoading = false;
}

// Fallback to localStorage
function loadFromLocalStorage() {
  console.warn('Falling back to localStorage');
  const saved = localStorage.getItem('dailyStandupState');

  // Show a visible warning toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  toast.innerHTML = `
    <strong>⚠️ Offline Mode</strong><br>
    Could not connect to database.<br>
    Viewing local data only.
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);

  if (saved) {
    const parsed = JSON.parse(saved);
    state.teamMembers = parsed.teamMembers || [];
    state.updates = parsed.updates || {};
    state.goals = parsed.goals || [];
    state.leaves = parsed.leaves || [];
  }
}

// Navigation
async function navigateWeek(direction) {
  state.currentWeekStart = addDays(state.currentWeekStart, direction * 7);
  localStorage.setItem('dailyStandupCurrentWeek', state.currentWeekStart.toISOString());

  // Reload goals for new week
  const weekStart = formatDate(state.currentWeekStart, 'iso');
  state.goals = await window.db.getGoals(weekStart);

  renderAll();
}

// Render Functions
function renderAll() {
  renderWeekInfo();
  renderTeamMembers();
  renderGrid();
  renderGoals();
  renderLeaves();
  loadAndRenderChangeLogs();
}

function getTaskProgress(task) {
  const children = state.roadmapTasks.filter(c => c.parent_id === task.id);
  if (children.length === 0) return task.progress || 0;
  const total = children.reduce((sum, child) => sum + getTaskProgress(child), 0);
  return Math.round(total / children.length);
}

// Helper to parse 'YYYY-MM-DD' as local date midnight
function parseLocal(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

async function loadAndRenderChangeLogs() {
  const list = document.getElementById('changeLogsList');
  if (!list) return;

  try {
    const logs = await window.db.getChangeLogs(20);

    if (logs.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No recent activity.</p>';
      return;
    }

    list.innerHTML = logs.map(log => {
      const date = new Date(log.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      let actionClass = 'action-update';
      if (log.action === 'create') actionClass = 'action-create';
      if (log.action === 'delete') actionClass = 'action-delete';

      return `
                <div class="change-log-item">
                    <div class="change-meta">
                        <span class="change-user">${log.user_email.split('@')[0]}</span>
                        <span class="change-time">${dateStr} ${timeStr}</span>
                    </div>
                    <div class="change-desc">
                        ${log.description || 'No description'}
                    </div>
                    <span class="change-action-badge ${actionClass}">${log.action}</span>
                </div>
            `;
    }).join('');
  } catch (e) {
    console.error('Error loading logs:', e);
    list.innerHTML = '<p style="color: #ef4444; text-align: center;">Failed to load activity log.</p>';
  }
}

function renderWeekInfo() {
  const weekNum = getWeekNumber(state.currentWeekStart);
  const weekEnd = addDays(state.currentWeekStart, 4); // Thursday

  document.getElementById('weekNumber').textContent = `WEEK ${weekNum}`;
  document.getElementById('dateRange').textContent =
    `${formatDate(state.currentWeekStart)} - ${formatDate(weekEnd)}`;
}

function renderTeamMembers() {
  const container = document.getElementById('teamMembersList');
  container.innerHTML = state.teamMembers.map(member => `
    <div class="team-member-tag" style="background: ${member.color}; color: #000;" 
         onclick="editTeamMember('${member.id}')" title="Click to edit">
      ${member.name}
      <span class="remove-member" onclick="event.stopPropagation(); removeTeamMember('${member.id}')" title="Remove">×</span>
    </div>
  `).join('');
}

function renderLeaves() {
  const container = document.getElementById('leavesList');
  // Filter leaves to show only those affecting this week
  const weekStart = new Date(state.currentWeekStart);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Assuming Sunday-Saturday week
  weekEnd.setHours(23, 59, 59, 999);

  const activeLeaves = state.leaves.filter(leave => {
    const start = parseLocal(leave.start_date);
    const end = parseLocal(leave.end_date);
    if (!start || !end) return false;
    // Determine overlap: (StartA <= EndB) and (EndA >= StartB)
    return start <= weekEnd && end >= weekStart;
  });

  const countBadge = document.getElementById('leavesCount');
  if (countBadge) countBadge.textContent = activeLeaves.length;

  const calBtn = document.getElementById('showHolidayCalendarBtn');
  if (calBtn) calBtn.style.display = 'block';

  if (!container) return; // Guard clause in case element doesn't exist yet

  if (activeLeaves.length === 0) {
    if (container) container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No leaves this week.</p>';
    renderLeavesInHeader([]);
    return;
  }

  renderLeavesInHeader(activeLeaves);

  if (!container) return;

  const typeColors = {
    'holiday': '#FFB5C5', // Pinkish
    'sick': '#F56565',    // Red
    'personal': '#B5E7F5', // Blueish
    'other': '#E2E8F0'    // Grey
  };

  const typeEmojis = {
    'holiday': '🏖️',
    'sick': '🤒',
    'personal': '🏠',
    'other': '📅'
  };

  container.innerHTML = activeLeaves.map((leave, index) => {
    // Find member to get their color/name if needed, though we joined in DB query
    const memberName = leave.team_members ? leave.team_members.name : 'Unknown';
    const memberColor = leave.team_members ? leave.team_members.color : '#ccc';

    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    const dateStr = startDate.toDateString() === endDate.toDateString()
      ? formatDate(startDate)
      : `${formatDate(startDate)} - ${formatDate(endDate)}`;

    return `
    <div class="leave-card" style="border-left: 4px solid ${memberColor}" onclick="editLeave('${leave.id}')">
      <div class="leave-actions">
        <button class="btn btn-secondary btn-small btn-icon" onclick="event.stopPropagation(); removeLeave('${leave.id}')" title="Remove">×</button>
      </div>
      <div class="leave-header">
        <span class="leave-type-badge" style="background: ${typeColors[leave.type] || typeColors['other']}30; color: ${typeColors[leave.type] || '#fff'}">
          ${typeEmojis[leave.type] || '📅'} ${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
        </span>
        <span class="leave-date">${dateStr}</span>
      </div>
      <h4 class="leave-member">${memberName}</h4>
      ${leave.description ? `<p class="leave-description">${leave.description}</p>` : ''}
    </div>
  `;
  }).join('');
}

function renderLeavesInHeader(activeLeaves) {
  const container = document.getElementById('header-right-col');
  if (!container) return;

  if (activeLeaves.length === 0) {
    container.innerHTML = `
      <div class="header-leaf-preview empty" title="No leaves this week">
        🏖️ <span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted); padding: 0 8px; border-radius: 10px; font-size: 0.75rem;">None</span>
      </div>
    `;
    return;
  }

  // Calculate unique people and total overlap days
  const weekStart = new Date(state.currentWeekStart);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const uniquePeople = new Set(activeLeaves.map(l => l.member_id)).size;
  let totalPersonDays = 0;

  activeLeaves.forEach(l => {
    const start = parseLocal(l.start_date);
    const end = parseLocal(l.end_date);
    if (!start || !end) return;

    const overlapStart = start < weekStart ? weekStart : start;
    const overlapEnd = end > weekEnd ? weekEnd : end;

    if (overlapStart <= overlapEnd) {
      const diffTime = Math.abs(overlapEnd - overlapStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalPersonDays += diffDays;
    }
  });

  // Show first 3 leave members as avatars
  const memberPreviews = activeLeaves.slice(0, 3).map(l => {
    const name = l.team_members?.name || 'Unknown';
    const color = l.team_members?.color || 'var(--accent-primary)';
    const initial = name[0].toUpperCase();
    return `<div class="header-leaf-avatar" style="background: ${color};" title="${name} is on ${l.type}">${initial}</div>`;
  }).join('');

  container.innerHTML = `
    <div class="header-leaf-preview active">
        <div class="avatar-stack">${memberPreviews}</div>
        <div class="header-leaf-info" style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-left: 4px;">
          ${uniquePeople} ${uniquePeople === 1 ? 'Person' : 'People'} • ${totalPersonDays} ${totalPersonDays === 1 ? 'Day' : 'Days'}
        </div>
    </div>
  `;
}

function openLeavesDetailModal() {
  const modal = document.getElementById('leavesDetailModal');
  if (!modal) {
    // Create it if it doesn't exist? Or wait until next step to add to HTML.
    // I'll add it to index.html in next step.
    console.warn('Leaves detail modal not found in DOM');
  }
  showModal('leavesDetailModal');

  const container = document.getElementById('leavesDetailList');
  if (!container) return;

  // Filter leaves as in renderLeaves
  const weekStart = new Date(state.currentWeekStart);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const activeLeaves = state.leaves.filter(leave => {
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    return start <= weekEnd && end >= weekStart;
  });

  if (activeLeaves.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No leaves this week.</p>';
  } else {
    container.innerHTML = activeLeaves.map(leave => {
      const memberName = leave.team_members ? leave.team_members.name : 'Unknown';
      const memberColor = leave.team_members ? leave.team_members.color : '#ccc';
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const dateStr = startDate.toDateString() === endDate.toDateString()
        ? formatDate(startDate)
        : `${formatDate(startDate)} - ${formatDate(endDate)}`;

      const typeEmojis = { 'holiday': '🏖️', 'sick': '🤒', 'personal': '🏠', 'other': '📅' };

      return `
        <div class="leave-detail-item" style="border-left: 4px solid ${memberColor}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary);">${memberName}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                ${typeEmojis[leave.type] || '📅'} ${leave.type.toUpperCase()} • ${dateStr}
              </div>
            </div>
            <button class="btn btn-secondary btn-small" onclick="editLeave('${leave.id}')">Edit</button>
          </div>
          ${leave.description ? `<p style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">${leave.description}</p>` : ''}
        </div>
      `;
    }).join('');
  }
}

function renderGrid() {
  const table = document.querySelector('.grid-table');
  const thead = table.querySelector('thead tr');
  const tbody = document.getElementById('gridBody');

  // Render header
  thead.innerHTML = '<th style="width: 100px;">Day</th>' +
    state.teamMembers.map(member => `
      <th style="background: ${member.color}30; color: ${member.color};">
        ${member.name}
      </th>
    `).join('');

  // Render rows (Sunday to Thursday)
  tbody.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const date = addDays(state.currentWeekStart, i);
    const dateStr = formatDate(date, 'iso');
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>
        <div style="padding: var(--spacing-md);">
          <span class="day-label">${formatDate(date, 'day')}</span>
          <span class="date-label">${formatDate(date).split(' ')[0]}</span>
          <span class="date-number">${date.getDate()}</span>
        </div>
      </td>
      ${state.teamMembers.map(member => {
      const updateKey = `${member.id}_${dateStr}`;
      const update = state.updates[updateKey];

      // Render items preview if items exist, otherwise content, otherwise add button
      const hasItems = update && update.items && update.items.length > 0;
      const hasContent = update && update.content && update.content.length > 0;

      if (hasItems || hasContent) {
        let contentHtml = '';

        if (hasItems) {
          // Group items by type
          const groups = {};
          update.items.forEach(item => {
            const t = item.type || 'General';
            if (!groups[t]) groups[t] = [];
            groups[t].push(item);
          });

          // Render groups
          contentHtml = `<div class="update-items-grouped">
                ${Object.keys(groups).map(type => `
                    <div class="group-section">
                        <div class="group-header">${type}</div>
                        ${groups[type].map(item => `
                            <div class="mini-item">
                                <span class="mini-status ${item.status}"></span>
                                <span class="mini-title">${item.title}</span>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>`;
        } else {
          // Legacy content
          contentHtml = `<div class="update-content"><ul>${update.content.map(item => `<li>${item}</li>`).join('')}</ul></div>`;
        }

        return `
            <td>
              <div class="update-card" style="border-color: ${member.color};" 
                   onclick="openDailyView('${member.id}', '${dateStr}')">
                ${contentHtml}
                <div class="update-time">${update.timestamp ? new Date(update.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            </td>
          `;
      } else {
        return `
            <td>
              <div class="update-card empty" style="border-color: ${member.color}40;" 
                   onclick="openDailyView('${member.id}', '${dateStr}')">
                + Add update
              </div>
            </td>
          `;
      }
    }).join('')}
    `;

    tbody.appendChild(row);
  }
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  const countBadge = document.getElementById('goalsCount');

  // Calculate current week range
  const weekStart = new Date(state.currentWeekStart);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4); // Sunday to Thursday (matching grid)
  weekEnd.setHours(23, 59, 59, 999);

  // Filter roadmap tasks that are strictly within this week and are NOT parent tasks
  const activeRoadmapTasks = state.roadmapTasks.filter(task => {
    const taskStart = parseLocal(task.start_date);
    const taskEnd = parseLocal(task.end_date);
    if (!taskStart || !taskEnd) return false;

    // Strict containment: Task must start on or after weekStart AND end on or before weekEnd
    // Range: 2025-12-21 (Sunday) to 2025-12-25 (Thursday)
    const isInRange = taskStart >= weekStart && taskEnd <= weekEnd;

    // Leaf task check: Must not be a parent to any other task
    const isLeaf = !state.roadmapTasks.some(t => t.parent_id === task.id);

    return isInRange && isLeaf;
  });

  // Also include manual goals if any (optional, but keep for compatibility)
  const allGoals = [
    ...activeRoadmapTasks.map(task => ({
      id: `task_${task.id}`,
      title: task.title,
      description: task.description || '',
      owner: task.assigned_to || '',
      status: task.progress === 100 ? 'completed' : (task.progress > 0 ? 'in-progress' : 'not-started'),
      type: 'Roadmap',
      progress: task.progress,
      isRoadmap: true,
      originalTask: task
    })),
    ...state.goals.map(g => ({ ...g, isRoadmap: false }))
  ];

  if (countBadge) countBadge.textContent = allGoals.length;

  if (allGoals.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No goals or roadmap tasks for this week.</p>';
    return;
  }

  const statusColors = {
    'not-started': '#7878a0',
    'in-progress': '#667eea',
    'completed': '#48bb78',
    'blocked': '#f56565'
  };

  const statusLabels = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Done',
    'blocked': 'Blocked'
  };

  container.innerHTML = allGoals.map((goal) => {
    const title = goal.title || '';
    const description = goal.description || '';
    const owner = goal.owner || '';
    const status = goal.status || 'not-started';
    const type = goal.type || 'General';
    const blockReason = goal.block_reason || '';
    const isRoadmap = goal.isRoadmap;
    const progress = isRoadmap ? getTaskProgress(goal.originalTask) : 0;
    const mappedStatus = isRoadmap ? (progress === 100 ? 'completed' : (progress > 0 ? 'in-progress' : 'not-started')) : status;

    return `
    <div class="goal-card ${isRoadmap ? 'roadmap-goal' : ''}" ${isRoadmap ? `onclick="window.location.href='roadmap.html'"` : `onclick="editGoal('${goal.id}')"`}>
      ${!isRoadmap ? `
      <div class="goal-actions">
        <button class="btn btn-secondary btn-small btn-icon" onclick="event.stopPropagation(); removeGoal('${goal.id}')" title="Remove">×</button>
      </div>` : ''}
      <div class="goal-header-badges" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span class="goal-type-badge" style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
          ${isRoadmap ? '🗺️ Roadmap' : type}
        </span>
        <div class="goal-status-badge" style="background: ${statusColors[mappedStatus]};">
            ${isRoadmap ? `${progress}%` : statusLabels[status]}
        </div>
      </div>
      <h4 class="goal-title" style="${isRoadmap ? 'color: var(--accent-primary);' : ''}">${title}</h4>
      ${description ? `<p class="goal-description">${description}</p>` : ''}
      ${status === 'blocked' && blockReason ?
        `<div class="goal-block-reason" style="background: rgba(245, 101, 101, 0.1); border-left: 2px solid #f56565; padding: 8px; margin: 8px 0; font-size: 0.85rem; color: #f56565;">
           🛑 <b>Blocked:</b> ${blockReason}
         </div>` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        ${owner ? `<p class="goal-owner" style="margin:0;">👤 ${owner}</p>` : '<span></span>'}
        ${isRoadmap ? `
          <div style="width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
            <div style="width: ${progress}%; height: 100%; background: var(--accent-primary); border-radius: 3px;"></div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  }).join('');
}

// Team Member Management
function openTeamMemberModal() {
  state.editingMember = null;
  document.getElementById('teamMemberModalTitle').textContent = 'Add Team Member';
  document.getElementById('memberName').value = '';
  renderColorPicker();
  showModal('teamMemberModal');
}

function editTeamMember(id) {
  const member = state.teamMembers.find(m => m.id === id);
  if (!member) return;

  state.editingMember = id;
  document.getElementById('teamMemberModalTitle').textContent = 'Edit Team Member';
  document.getElementById('memberName').value = member.name;
  renderColorPicker(member.color);
  showModal('teamMemberModal');
}

function renderColorPicker(selectedColor = null) {
  const container = document.getElementById('colorPicker');
  container.innerHTML = COLORS.map(color => `
    <div class="color-option ${color.value === selectedColor ? 'selected' : ''}" 
         style="background: ${color.value};" 
         data-color="${color.value}"
         onclick="selectColor('${color.value}')"></div>
  `).join('');

  // Select first color by default if none selected
  if (!selectedColor) {
    selectColor(COLORS[0].value);
  }
}

function selectColor(color) {
  document.querySelectorAll('.color-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.color === color);
  });
}

async function saveTeamMember() {
  const name = document.getElementById('memberName').value.trim();
  const selectedColor = document.querySelector('.color-option.selected')?.dataset.color;

  if (!name) {
    alert('Please enter a name');
    return;
  }

  if (!selectedColor) {
    alert('Please select a color');
    return;
  }

  try {
    if (state.editingMember) {
      // Update existing member in DB
      await window.db.updateTeamMember(state.editingMember, { name, color: selectedColor }, state.currentUserEmail);
      const member = state.teamMembers.find(m => m.id === state.editingMember);
      if (member) {
        member.name = name;
        member.color = selectedColor;
      }
    } else {
      // Add new member to DB
      const newMember = await window.db.createTeamMember({ name, color: selectedColor }, state.currentUserEmail);
      state.teamMembers.push(newMember);
    }

    renderAll();
    closeModal('teamMemberModal');
  } catch (error) {
    console.error('Error saving team member:', error);
    alert('Failed to save team member. Please try again.');
  }
}

async function removeTeamMember(id) {
  if (!confirm('Are you sure you want to remove this team member? All their updates will be deleted.')) {
    return;
  }

  try {
    await window.db.deleteTeamMember(id, state.currentUserEmail);

    // Remove from local state
    state.teamMembers = state.teamMembers.filter(m => m.id !== id);

    // Remove all updates for this member from local state
    Object.keys(state.updates).forEach(key => {
      if (key.startsWith(id + '_')) {
        delete state.updates[key];
      }
    });

    renderAll();
  } catch (error) {
    console.error('Error removing team member:', error);
    alert('Failed to remove team member. Please try again.');
  }
}

// Update Management
// (Replaced by openDailyView)

function openDailyView(memberId, date) {
  const updateKey = `${memberId}_${date}`;
  const update = state.updates[updateKey] || { content: [], items: [], timestamp: null };
  const member = state.teamMembers.find(m => m.id === memberId);

  state.currentDailyView = { memberId, date };

  document.getElementById('dailyViewTitle').innerHTML = `Updates - <span style="color: ${member ? member.color : 'inherit'}">${member ? member.name : ''}</span> <br><small style="font-weight:400; opacity:0.7;">${formatDate(date, 'day')}, ${date}</small>`;

  const container = document.getElementById('dailyItemsList');
  container.innerHTML = '';

  const items = update.items || [];

  if (items.length === 0 && (!update.content || update.content.length === 0)) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No items yet. Click "Add Item" to start.</p>';
  } else {
    if (items.length > 0) {
      items.forEach((item, index) => {
        // Find related goal info
        let goalInfo = '';
        if (item.goal_id) {
          const goal = state.goals.find(g => g.id === item.goal_id);
          if (goal) {
            goalInfo = `<div style="font-size:0.75rem; color: var(--accent-primary); margin-top:4px;">🎯 ${goal.title}</div>`;
          }
        }

        const el = document.createElement('div');
        el.className = 'daily-item-card';
        el.innerHTML = `
             <div class="item-header">
                <span class="item-type badge">${item.type || 'General'}</span>
                <span class="item-status badge ${item.status}">${item.status}</span>
             </div>
             <div class="item-title">${item.title}</div>
             ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
             ${goalInfo}
             ${item.status === 'blocked' && item.block_reason ? `<div class="item-block">🛑 ${item.block_reason}</div>` : ''}
           `;
        el.onclick = () => openUpdateItemModal(index);
        container.appendChild(el);
      });
    }

    if (update.content && update.content.length > 0) {
      const legacy = document.createElement('div');
      legacy.className = 'legacy-content';
      legacy.style.marginTop = '1rem';
      legacy.style.paddingTop = '1rem';
      legacy.style.borderTop = '1px dashed var(--border-color)';
      legacy.innerHTML = '<h5 style="margin-bottom:0.5rem; opacity:0.7;">Other Notes:</h5><ul style="padding-left:1.2rem; opacity:0.8;">' + update.content.map(line => `<li>${line}</li>`).join('') + '</ul>';
      container.appendChild(legacy);
    }
  }

  showModal('dailyViewModal');
}

function openUpdateItemModal(index = null) {
  state.editingUpdateItemIndex = index;
  const { memberId, date } = state.currentDailyView;
  const updateKey = `${memberId}_${date}`;
  const update = state.updates[updateKey] || { items: [] };
  const items = update.items || [];

  document.getElementById('updateItemModalTitle').textContent = index !== null ? 'Edit Update Item' : 'Add Update Item';

  const typeInput = document.getElementById('updateItemType');
  const titleInput = document.getElementById('updateItemTitle');
  const descInput = document.getElementById('updateItemDescription');
  const statusInput = document.getElementById('updateItemStatus');
  const goalInput = document.getElementById('updateItemGoal');
  const blockInput = document.getElementById('updateItemBlockReason');
  const blockGroup = document.getElementById('updateItemBlockReasonGroup');
  const deleteBtn = document.getElementById('deleteUpdateItemBtn');

  // Populate Goal Selector
  goalInput.innerHTML = '<option value="">None</option>' +
    state.goals.map(g => `<option value="${g.id}">🎯 ${g.title} (${g.status})</option>`).join('');

  if (index !== null) {
    const item = items[index];
    typeInput.value = item.type || 'General';
    titleInput.value = item.title || '';
    descInput.value = item.description || '';
    statusInput.value = item.status || 'not-started';
    goalInput.value = item.goal_id || '';
    blockInput.value = item.block_reason || '';
    blockGroup.style.display = item.status === 'blocked' ? 'block' : 'none';
    deleteBtn.style.display = 'block';
  } else {
    typeInput.value = 'General';
    titleInput.value = '';
    descInput.value = '';
    statusInput.value = 'not-started';
    goalInput.value = '';
    blockInput.value = '';
    blockGroup.style.display = 'none';
    deleteBtn.style.display = 'none';
  }

  showModal('updateItemModal');
}

async function saveUpdateItem() {
  const { memberId, date } = state.currentDailyView;
  const updateKey = `${memberId}_${date}`;
  let update = state.updates[updateKey] || { content: [], items: [], timestamp: null };
  if (!update.items) update.items = [];

  const type = document.getElementById('updateItemType').value;
  const title = document.getElementById('updateItemTitle').value.trim();
  const description = document.getElementById('updateItemDescription').value.trim();
  const status = document.getElementById('updateItemStatus').value;
  const goalId = document.getElementById('updateItemGoal').value;
  const blockReason = document.getElementById('updateItemBlockReason').value.trim();

  if (!title) { alert('Title is required'); return; }

  const newItem = {
    type, title, description, status,
    goal_id: goalId,
    block_reason: status === 'blocked' ? blockReason : ''
  };

  if (state.editingUpdateItemIndex !== null) {
    update.items[state.editingUpdateItemIndex] = newItem;
  } else {
    update.items.push(newItem);
  }

  const timestamp = new Date().toISOString();

  try {
    await window.db.saveUpdate(memberId, date, update.content, update.items, timestamp, state.currentUserEmail);
    state.updates[updateKey] = { ...update, timestamp };
    renderAll();
    openDailyView(memberId, date);
    closeModal('updateItemModal');
  } catch (e) {
    console.error(e);
    alert('Failed to save');
  }
}

async function deleteUpdateItem() {
  if (state.editingUpdateItemIndex === null) return;
  if (!confirm('Delete item?')) return;

  const { memberId, date } = state.currentDailyView;
  const updateKey = `${memberId}_${date}`;
  let update = state.updates[updateKey];

  update.items.splice(state.editingUpdateItemIndex, 1);
  const timestamp = new Date().toISOString();

  try {
    await window.db.saveUpdate(memberId, date, update.content, update.items, timestamp, state.currentUserEmail);
    state.updates[updateKey] = update;
    renderAll();
    openDailyView(memberId, date);
    closeModal('updateItemModal');
  } catch (e) {
    console.error(e);
    alert('Failed to delete');
  }
}

async function deleteDailyUpdate() {
  if (!confirm('Are you sure you want to delete ALL updates for this day? This action cannot be undone.')) return;

  const { memberId, date } = state.currentDailyView;
  const updateKey = `${memberId}_${date}`;

  try {
    await window.db.deleteUpdate(memberId, date, state.currentUserEmail);
    delete state.updates[updateKey];
    renderAll();
    closeModal('dailyViewModal');
  } catch (e) {
    console.error(e);
    alert('Failed to delete update');
  }
}

// Goal Management
function openGoalModal() {
  state.editingGoal = null;
  document.getElementById('goalModalTitle').textContent = 'Add Target';
  document.getElementById('goalType').value = 'Investors';
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalDescription').value = '';
  document.getElementById('goalOwner').value = '';
  document.getElementById('goalStatus').value = 'not-started';
  document.getElementById('goalBlockReason').value = '';
  document.getElementById('blockReasonGroup').style.display = 'none';
  document.getElementById('deleteGoalBtn').style.display = 'none';
  showModal('goalModal');
}

function editGoal(id) {
  state.editingGoal = id;
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;

  document.getElementById('goalModalTitle').textContent = 'Edit Target';
  document.getElementById('goalType').value = goal.type || 'Investors';
  document.getElementById('goalTitle').value = goal.title || '';
  document.getElementById('goalDescription').value = goal.description || '';
  document.getElementById('goalOwner').value = goal.owner || '';
  document.getElementById('goalStatus').value = goal.status || 'not-started';
  document.getElementById('goalBlockReason').value = goal.block_reason || '';

  const blockGroup = document.getElementById('blockReasonGroup');
  if (goal.status === 'blocked') {
    blockGroup.style.display = 'block';
  } else {
    blockGroup.style.display = 'none';
  }

  document.getElementById('deleteGoalBtn').style.display = 'block';
  showModal('goalModal');
}

async function saveGoal() {
  const type = document.getElementById('goalType').value;
  const title = document.getElementById('goalTitle').value.trim();
  const description = document.getElementById('goalDescription').value.trim();
  const owner = document.getElementById('goalOwner').value.trim();
  const status = document.getElementById('goalStatus').value;
  const blockReason = document.getElementById('goalBlockReason').value.trim();

  if (!title) {
    alert('Please enter a target title');
    return;
  }

  const weekStart = formatDate(state.currentWeekStart, 'iso');
  // Include block_reason only if status is blocked? or always save it? logic implies only if blocked.
  // Actually, keeping it is fine, but maybe clear it if not blocked?
  // Let's keep strict to UI: if status != blocked, reason is irrelevant.
  const finalBlockReason = status === 'blocked' ? blockReason : '';

  const goalData = { title, description, owner, status, type, block_reason: finalBlockReason };

  try {
    if (state.editingGoal !== null) {
      // Update existing goal
      const goalId = state.editingGoal;
      await window.db.updateGoal(goalId, goalData, state.currentUserEmail);
      const idx = state.goals.findIndex(g => g.id === goalId);
      if (idx !== -1) state.goals[idx] = { ...state.goals[idx], ...goalData };
    } else {
      // Create new goal
      const newGoal = await window.db.createGoal(goalData, weekStart, state.currentUserEmail);
      state.goals.push(newGoal);
    }

    renderAll();
    closeModal('goalModal');
  } catch (error) {
    console.error('Error saving goal:', error);
    alert('Failed to save goal. Please try again.');
  }
}

async function removeGoal(id) {
  if (!confirm('Are you sure you want to remove this goal?')) {
    return;
  }

  try {
    await window.db.deleteGoal(id, state.currentUserEmail);
    state.goals = state.goals.filter(g => g.id !== id);
    renderAll();
  } catch (error) {
    console.error('Error removing goal:', error);
    alert('Failed to remove goal. Please try again.');
  }
}

// Leave Management
function openLeaveModal() {
  state.editingLeave = null;
  document.getElementById('leaveModalTitle').textContent = 'Add Leave';

  // Populate member dropdown
  const memberSelect = document.getElementById('leaveMember');
  memberSelect.innerHTML = '<option value="">Select Team Member</option>' +
    state.teamMembers.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  document.getElementById('leaveMember').value = '';
  document.getElementById('leaveStartDate').valueAsDate = new Date();
  document.getElementById('leaveEndDate').valueAsDate = new Date();
  document.getElementById('leaveType').value = 'holiday';
  document.getElementById('leaveDescription').value = '';
  document.getElementById('deleteLeaveBtn').style.display = 'none';
  showModal('leaveModal');
}

function editLeave(id) {
  const leave = state.leaves.find(l => l.id === id);
  if (!leave) return;

  state.editingLeave = id;
  document.getElementById('leaveModalTitle').textContent = 'Edit Leave';

  // Populate member dropdown
  const memberSelect = document.getElementById('leaveMember');
  memberSelect.innerHTML = state.teamMembers.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  document.getElementById('leaveMember').value = leave.member_id;
  document.getElementById('leaveStartDate').value = leave.start_date;
  document.getElementById('leaveEndDate').value = leave.end_date;
  document.getElementById('leaveType').value = leave.type;
  document.getElementById('leaveDescription').value = leave.description || '';
  document.getElementById('deleteLeaveBtn').style.display = 'block';
  showModal('leaveModal');
}

// Holiday Calendar Logic
async function openHolidayCalendar() {
  showModal('holidayCalendarModal');
  const container = document.getElementById('holidayCalendarContainer');
  container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Loading calendar...</p>';

  try {
    const today = new Date();
    const startDateStr = formatDate(getWeekStart(today), 'iso'); // Start from current week (Monday)
    const leaves = await window.db.getFutureLeaves(startDateStr);

    renderHolidayCalendar(leaves);
  } catch (e) {
    console.error('Error loading holiday calendar:', e);
    container.innerHTML = '<p style="color: #ef4444; text-align: center;">Failed to load calendar.</p>';
  }
}

function renderHolidayCalendar(leaves) {
  const container = document.getElementById('holidayCalendarContainer');
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  // Generate 6 months
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const currentMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthDiv = document.createElement('div');
    monthDiv.className = 'calendar-month';

    const monthTitle = document.createElement('div');
    monthTitle.className = 'month-title';
    monthTitle.textContent = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });
    monthDiv.appendChild(monthTitle);

    const daysHeader = document.createElement('div');
    daysHeader.className = 'month-days';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
      const d = document.createElement('div');
      d.className = 'day-header';
      d.textContent = day;
      daysHeader.appendChild(d);
    });
    monthDiv.appendChild(daysHeader);

    const daysGrid = document.createElement('div');
    daysGrid.className = 'month-days';

    // Get days in month
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    // Empty cells for padding
    for (let j = 0; j < firstDay; j++) {
      const empty = document.createElement('div');
      daysGrid.appendChild(empty);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = formatDate(dayDate, 'iso');
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.textContent = d;

      if (dayDate.toDateString() === new Date().toDateString()) {
        cell.classList.add('today');
      }

      // check for leaves
      const dayLeaves = leaves.filter(l => {
        return dateStr >= l.start_date && dateStr <= l.end_date;
      });

      if (dayLeaves.length > 0) {
        cell.classList.add('has-leave');
        cell.style.cursor = 'pointer';

        // Use the color of the first person on leave, or neutral if multiple
        if (dayLeaves.length === 1 && dayLeaves[0].team_members && dayLeaves[0].team_members.color) {
          cell.style.backgroundColor = hexToRgba(dayLeaves[0].team_members.color, 0.2);
          cell.style.color = dayLeaves[0].team_members.color;
          cell.style.fontWeight = 'bold';
        } else if (dayLeaves.length > 1) {
          cell.style.backgroundColor = 'var(--bg-tertiary)';
          cell.style.border = '1px solid var(--accent-primary)';
        }

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'leave-tooltip';
        tooltip.innerHTML = dayLeaves.map(l =>
          `<div>${l.team_members?.name || 'Unknown'} (${l.type})</div>`
        ).join('');
        cell.appendChild(tooltip);

        // Click Event
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          handleLeaveClick(dayLeaves);
        });
      }

      daysGrid.appendChild(cell);
    }
    monthDiv.appendChild(daysGrid);
    grid.appendChild(monthDiv);
  }
  container.appendChild(grid);
}

function handleLeaveClick(leaves) {
  if (leaves.length === 1) {
    closeModal('holidayCalendarModal');
    // Ensure leave exists in state
    const exists = state.leaves.find(l => l.id === leaves[0].id);
    if (!exists) {
      state.leaves.push(leaves[0]);
    }
    editLeave(leaves[0].id);
  } else if (leaves.length > 1) {
    showLeaveSelectionInCalendar(leaves);
  }
}

function showLeaveSelectionInCalendar(leaves) {
  const container = document.getElementById('holidayCalendarContainer');
  container.innerHTML = `
        <div class="leave-selection-list">
            <h4 style="text-align: center; margin-bottom: 1rem;">Select a leave to edit</h4>
            ${leaves.map((l, index) => `
                <div class="leave-selection-item" id="leave-select-${index}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${l.team_members?.name || 'Unknown'}</strong>
                        <span style="font-size: 0.8rem; opacity: 0.8;">${l.type}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                        ${l.start_date} - ${l.end_date}
                    </div>
                </div>
            `).join('')}
            <button class="btn btn-secondary" onclick="openHolidayCalendar()" style="margin-top: 1rem; width: 100%;">Back to Calendar</button>
        </div>
    `;

  // Attach listeners
  leaves.forEach((leave, index) => {
    document.getElementById(`leave-select-${index}`).addEventListener('click', () => {
      closeModal('holidayCalendarModal');
      const exists = state.leaves.find(l => l.id === leave.id);
      if (!exists) {
        state.leaves.push(leave);
      }
      editLeave(leave.id);
    });
  });
}

// Helper for Hex to RGBA (simple version)
function hexToRgba(hex, alpha) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return 'rgba(0,0,0,0.1)'; // Fallback
}

async function saveLeave() {
  const memberId = document.getElementById('leaveMember').value;
  const startDate = document.getElementById('leaveStartDate').value;
  const endDate = document.getElementById('leaveEndDate').value;
  const type = document.getElementById('leaveType').value;
  const description = document.getElementById('leaveDescription').value.trim();

  if (!memberId) {
    alert('Please select a team member');
    return;
  }

  if (!startDate || !endDate) {
    alert('Please select start and end dates');
    return;
  }

  if (new Date(endDate) < new Date(startDate)) {
    alert('End date cannot be before start date');
    return;
  }

  const leaveData = { member_id: memberId, start_date: startDate, end_date: endDate, type, description };

  try {
    if (state.editingLeave) {
      // Update existing
      const updatedLeave = await window.db.updateLeave(state.editingLeave, leaveData);
      const index = state.leaves.findIndex(l => l.id === state.editingLeave);
      if (index !== -1) {
        state.leaves[index] = updatedLeave;
      }
    } else {
      // Create new
      const newLeave = await window.db.createLeave(leaveData);
      state.leaves.push(newLeave);
      // Sort by date
      state.leaves.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    }

    renderLeaves();
    closeModal('leaveModal');
  } catch (error) {
    console.error('Error saving leave:', error);
    alert('Failed to save leave. Please try again.');
  }
}

async function removeLeave(id) {
  if (!confirm('Are you sure you want to remove this leave entry?')) {
    return;
  }

  try {
    await window.db.deleteLeave(id);
    state.leaves = state.leaves.filter(l => l.id !== id);
    renderLeaves();
  } catch (error) {
    console.error('Error removing leave:', error);
    alert('Failed to remove leave. Please try again.');
  }
}

// Modal Management
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Event Listeners
function attachEventListeners() {
  // Week navigation
  document.getElementById('prevWeekBtn').addEventListener('click', () => navigateWeek(-1));
  document.getElementById('nextWeekBtn').addEventListener('click', () => navigateWeek(1));

  // Team Management
  document.getElementById('manageTeamBtn').addEventListener('click', () => showModal('manageTeamModal'));
  document.getElementById('addTeamMemberBtn').addEventListener('click', openTeamMemberModal);
  document.getElementById('saveTeamMemberBtn').addEventListener('click', saveTeamMember);

  // Update
  document.getElementById('addUpdateItemBtn').addEventListener('click', () => openUpdateItemModal(null));
  document.getElementById('saveUpdateItemBtn').addEventListener('click', saveUpdateItem);
  document.getElementById('deleteUpdateItemBtn').addEventListener('click', deleteUpdateItem);

  // Update Item Status Change
  document.getElementById('updateItemStatus').addEventListener('change', (e) => {
    const blockGroup = document.getElementById('updateItemBlockReasonGroup');
    if (e.target.value === 'blocked') {
      blockGroup.style.display = 'block';
      setTimeout(() => document.getElementById('updateItemBlockReason').focus(), 100);
    } else {
      blockGroup.style.display = 'none';
    }
  });

  // Goal
  document.getElementById('addGoalBtn').addEventListener('click', openGoalModal);
  document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);
  document.getElementById('deleteGoalBtn').addEventListener('click', async () => {
    if (state.editingGoal !== null) {
      await removeGoal(state.editingGoal);
      closeModal('goalModal');
    }
  });

  // Goal Status Change Listener
  document.getElementById('goalStatus').addEventListener('change', (e) => {
    const blockGroup = document.getElementById('blockReasonGroup');
    if (e.target.value === 'blocked') {
      blockGroup.style.display = 'block';
      // Focus on reason
      setTimeout(() => document.getElementById('goalBlockReason').focus(), 100);
    } else {
      blockGroup.style.display = 'none';
    }
  });

  // Leave
  const addLeaveBtn = document.getElementById('addLeaveBtn');
  if (addLeaveBtn) addLeaveBtn.addEventListener('click', openLeaveModal);

  const saveLeaveBtn = document.getElementById('saveLeaveBtn');
  if (saveLeaveBtn) saveLeaveBtn.addEventListener('click', saveLeave);

  const deleteLeaveBtn = document.getElementById('deleteLeaveBtn');
  if (deleteLeaveBtn) deleteLeaveBtn.addEventListener('click', async () => {
    if (state.editingLeave) {
      await removeLeave(state.editingLeave);
      closeModal('leaveModal');
    }
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', () => showModal('exportModal'));
  document.getElementById('exportCSV').addEventListener('click', exportToCSV);
  document.getElementById('exportXLSX').addEventListener('click', exportToXLSX);
  document.getElementById('exportPNG').addEventListener('click', exportToPNG);
  document.getElementById('exportPDF').addEventListener('click', exportToPDF);

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });
}

// Export Functions
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToCSV() {
  const weekStart = state.currentWeekStart;
  const weekNum = getWeekNumber(weekStart);

  // Create header row
  let csv = 'Day,Date,' + state.teamMembers.map(m => m.name).join(',') + '\n';

  // Create data rows (Sunday to Thursday)
  for (let i = 0; i < 5; i++) {
    const date = addDays(weekStart, i);
    const dateStr = formatDate(date, 'iso');
    const dayName = formatDate(date, 'day');
    const dateLabel = formatDate(date);

    let row = `"${dayName}","${dateLabel}"`;

    state.teamMembers.forEach(member => {
      const updateKey = `${member.id}_${dateStr}`;
      const update = state.updates[updateKey];
      if (update && update.content && update.content.length > 0) {
        const content = update.content.join('; ');
        row += `,"${content.replace(/"/g, '""')}"`;
      } else {
        row += ',';
      }
    });

    csv += row + '\n';
  }

  downloadFile(csv, `standup-week${weekNum}.csv`, 'text/csv');
  closeModal('exportModal');
}

function exportToXLSX() {
  if (typeof XLSX === 'undefined') {
    alert('Excel export library not loaded. Please refresh the page.');
    return;
  }

  const weekStart = state.currentWeekStart;
  const weekNum = getWeekNumber(weekStart);

  // Create data array
  const data = [];

  // Header row
  data.push(['Day', 'Date', ...state.teamMembers.map(m => m.name)]);

  // Data rows (Sunday to Thursday)
  for (let i = 0; i < 5; i++) {
    const date = addDays(weekStart, i);
    const dateStr = formatDate(date, 'iso');
    const dayName = formatDate(date, 'day');
    const dateLabel = formatDate(date);

    const row = [dayName, dateLabel];

    state.teamMembers.forEach(member => {
      const updateKey = `${member.id}_${dateStr}`;
      const update = state.updates[updateKey];
      if (update && update.content && update.content.length > 0) {
        row.push(update.content.join('\n'));
      } else {
        row.push('');
      }
    });

    data.push(row);
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    ...state.teamMembers.map(() => ({ wch: 40 }))
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Week ${weekNum}`);
  XLSX.writeFile(wb, `standup-week${weekNum}.xlsx`);

  closeModal('exportModal');
}

function exportToPNG() {
  if (typeof html2canvas === 'undefined') {
    alert('Screenshot library not loaded. Please refresh the page.');
    return;
  }

  const gridSection = document.querySelector('.standup-grid');
  const goalsSection = document.querySelector('.goals-section');

  closeModal('exportModal');

  // Create a temporary container with both sections
  const container = document.createElement('div');
  container.style.backgroundColor = '#0f0f1a';
  container.style.padding = '20px';
  container.appendChild(goalsSection.cloneNode(true));
  container.appendChild(gridSection.cloneNode(true));
  document.body.appendChild(container);

  html2canvas(container, {
    backgroundColor: '#0f0f1a',
    scale: 2,
    logging: false
  }).then(canvas => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `standup-week${getWeekNumber(state.currentWeekStart)}.png`;
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(container);
    });
  });
}

function exportToPDF() {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert('PDF export libraries not loaded. Please refresh the page.');
    return;
  }

  const gridSection = document.querySelector('.standup-grid');
  const goalsSection = document.querySelector('.goals-section');

  closeModal('exportModal');

  // Create a temporary container
  const container = document.createElement('div');
  container.style.backgroundColor = '#0f0f1a';
  container.style.padding = '20px';
  container.style.width = '1200px';
  container.appendChild(goalsSection.cloneNode(true));
  container.appendChild(gridSection.cloneNode(true));
  document.body.appendChild(container);

  html2canvas(container, {
    backgroundColor: '#0f0f1a',
    scale: 2,
    logging: false
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`standup-week${getWeekNumber(state.currentWeekStart)}.pdf`);

    document.body.removeChild(container);
  });
}
