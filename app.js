// Global State
let state = {
  teamMembers: [],
  updates: {}, // { memberId_date: { content: [...], timestamp: '' } }
  goals: [],
  currentWeekStart: null,
  editingMember: null,
  editingUpdate: null,
  editingGoal: null
};

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
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initializeWeek();
  renderAll();
  attachEventListeners();
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
  return d.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Initialize week
function initializeWeek() {
  if (!state.currentWeekStart) {
    state.currentWeekStart = getWeekStart(new Date());
  }
}

// Navigation
function navigateWeek(direction) {
  state.currentWeekStart = addDays(state.currentWeekStart, direction * 7);
  saveState();
  renderAll();
}

// Render Functions
function renderAll() {
  renderWeekInfo();
  renderTeamMembers();
  renderGrid();
  renderGoals();
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
        </div>
      </td>
      ${state.teamMembers.map(member => {
      const updateKey = `${member.id}_${dateStr}`;
      const update = state.updates[updateKey];

      if (update && update.content && update.content.length > 0) {
        return `
            <td>
              <div class="update-card" style="border-color: ${member.color};" 
                   onclick="editUpdate('${member.id}', '${dateStr}')">
                <div class="update-content">
                  <ul>
                    ${update.content.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
                <div class="update-time">${update.timestamp ? new Date(update.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            </td>
          `;
      } else {
        return `
            <td>
              <div class="update-card empty" style="border-color: ${member.color}40;" 
                   onclick="addUpdate('${member.id}', '${dateStr}')">
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

  if (state.goals.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No goals set for this week. Click "Add Goal" to get started!</p>';
    return;
  }

  container.innerHTML = state.goals.map((goal, index) => `
    <div class="goal-card" onclick="editGoal(${index})">
      <div class="goal-actions">
        <button class="btn btn-secondary btn-small btn-icon" onclick="event.stopPropagation(); removeGoal(${index})" title="Remove">×</button>
      </div>
      <p>${goal.split('\n').join('<br>')}</p>
    </div>
  `).join('');
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

function saveTeamMember() {
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

  if (state.editingMember) {
    // Update existing member
    const member = state.teamMembers.find(m => m.id === state.editingMember);
    if (member) {
      member.name = name;
      member.color = selectedColor;
    }
  } else {
    // Add new member
    const newMember = {
      id: 'member_' + Date.now(),
      name,
      color: selectedColor
    };
    state.teamMembers.push(newMember);
  }

  saveState();
  renderAll();
  closeModal('teamMemberModal');
}

function removeTeamMember(id) {
  if (!confirm('Are you sure you want to remove this team member? All their updates will be deleted.')) {
    return;
  }

  // Remove member
  state.teamMembers = state.teamMembers.filter(m => m.id !== id);

  // Remove all updates for this member
  Object.keys(state.updates).forEach(key => {
    if (key.startsWith(id + '_')) {
      delete state.updates[key];
    }
  });

  saveState();
  renderAll();
}

// Update Management
function addUpdate(memberId, date) {
  state.editingUpdate = { memberId, date, isNew: true };
  document.getElementById('updateModalTitle').textContent = 'Add Update';
  document.getElementById('updateContent').value = '';
  document.getElementById('deleteUpdateBtn').style.display = 'none';
  showModal('updateModal');
}

function editUpdate(memberId, date) {
  const updateKey = `${memberId}_${date}`;
  const update = state.updates[updateKey];

  state.editingUpdate = { memberId, date, isNew: false };
  document.getElementById('updateModalTitle').textContent = 'Edit Update';
  document.getElementById('updateContent').value = update?.content?.join('\n') || '';
  document.getElementById('deleteUpdateBtn').style.display = 'block';
  showModal('updateModal');
}

function saveUpdate() {
  if (!state.editingUpdate) return;

  const content = document.getElementById('updateContent').value
    .split('\n')
    .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
    .filter(line => line.length > 0);

  if (content.length === 0) {
    alert('Please enter at least one update');
    return;
  }

  const { memberId, date } = state.editingUpdate;
  const updateKey = `${memberId}_${date}`;

  state.updates[updateKey] = {
    content,
    timestamp: new Date().toISOString()
  };

  saveState();
  renderAll();
  closeModal('updateModal');
}

function deleteUpdate() {
  if (!state.editingUpdate) return;

  if (!confirm('Are you sure you want to delete this update?')) {
    return;
  }

  const { memberId, date } = state.editingUpdate;
  const updateKey = `${memberId}_${date}`;
  delete state.updates[updateKey];

  saveState();
  renderAll();
  closeModal('updateModal');
}

// Goal Management
function openGoalModal() {
  state.editingGoal = null;
  document.getElementById('goalModalTitle').textContent = 'Add Goal';
  document.getElementById('goalContent').value = '';
  document.getElementById('deleteGoalBtn').style.display = 'none';
  showModal('goalModal');
}

function editGoal(index) {
  state.editingGoal = index;
  document.getElementById('goalModalTitle').textContent = 'Edit Goal';
  document.getElementById('goalContent').value = state.goals[index];
  document.getElementById('deleteGoalBtn').style.display = 'block';
  showModal('goalModal');
}

function saveGoal() {
  const content = document.getElementById('goalContent').value.trim();

  if (!content) {
    alert('Please enter a goal');
    return;
  }

  if (state.editingGoal !== null) {
    state.goals[state.editingGoal] = content;
  } else {
    state.goals.push(content);
  }

  saveState();
  renderAll();
  closeModal('goalModal');
}

function removeGoal(index) {
  if (!confirm('Are you sure you want to remove this goal?')) {
    return;
  }

  state.goals.splice(index, 1);
  saveState();
  renderAll();
}

// Modal Management
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Local Storage
function saveState() {
  localStorage.setItem('dailyStandupState', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('dailyStandupState');
  if (saved) {
    const parsed = JSON.parse(saved);
    state = {
      ...state,
      ...parsed,
      currentWeekStart: parsed.currentWeekStart ? new Date(parsed.currentWeekStart) : null
    };
  } else {
    // Initialize with sample data
    initializeSampleData();
  }
}

function initializeSampleData() {
  state.teamMembers = [
    { id: 'member_1', name: 'Gustavo', color: COLORS[0].value },
    { id: 'member_2', name: 'David', color: COLORS[1].value },
    { id: 'member_3', name: 'Amitava', color: COLORS[2].value },
    { id: 'member_4', name: 'Abdelilah', color: COLORS[3].value },
    { id: 'member_5', name: 'Patito', color: COLORS[4].value },
    { id: 'member_6', name: 'Oscar', color: COLORS[5].value }
  ];

  state.goals = [
    'Complete Q4 feature roadmap review',
    'Improve test coverage to 80%',
    'Launch new dashboard UI'
  ];

  saveState();
}

// Event Listeners
function attachEventListeners() {
  // Week navigation
  document.getElementById('prevWeekBtn').addEventListener('click', () => navigateWeek(-1));
  document.getElementById('nextWeekBtn').addEventListener('click', () => navigateWeek(1));

  // Team member
  document.getElementById('addTeamMemberBtn').addEventListener('click', openTeamMemberModal);
  document.getElementById('saveTeamMemberBtn').addEventListener('click', saveTeamMember);

  // Update
  document.getElementById('saveUpdateBtn').addEventListener('click', saveUpdate);
  document.getElementById('deleteUpdateBtn').addEventListener('click', deleteUpdate);

  // Goal
  document.getElementById('addGoalBtn').addEventListener('click', openGoalModal);
  document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);
  document.getElementById('deleteGoalBtn').addEventListener('click', () => {
    if (state.editingGoal !== null) {
      removeGoal(state.editingGoal);
      closeModal('goalModal');
    }
  });

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
