// Global State
let state = {
  teamMembers: [],
  updates: {}, // { memberId_date: { content: [...], timestamp: '' } }
  goals: [],
  currentWeekStart: null,
  editingMember: null,
  editingUpdate: null,
  editingGoal: null,
  isLoading: false
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
document.addEventListener('DOMContentLoaded', async () => {
  initializeWeek();
  await loadDataFromDB();
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
  } catch (error) {
    console.error('Error loading data from database:', error);
    // Fallback to localStorage if DB fails
    loadFromLocalStorage();
  }
  state.isLoading = false;
}

// Fallback to localStorage
function loadFromLocalStorage() {
  const saved = localStorage.getItem('dailyStandupState');
  if (saved) {
    const parsed = JSON.parse(saved);
    state.teamMembers = parsed.teamMembers || [];
    state.updates = parsed.updates || {};
    state.goals = parsed.goals || [];
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

  const statusColors = {
    'not-started': '#7878a0',
    'in-progress': '#667eea',
    'completed': '#48bb78',
    'blocked': '#f56565'
  };

  const statusLabels = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'blocked': 'Blocked'
  };

  container.innerHTML = state.goals.map((goal, index) => {
    const title = goal.title || '';
    const description = goal.description || '';
    const owner = goal.owner || '';
    const status = goal.status || 'not-started';

    return `
    <div class="goal-card" onclick="editGoal(${index})">
      <div class="goal-actions">
        <button class="btn btn-secondary btn-small btn-icon" onclick="event.stopPropagation(); removeGoal(${index})" title="Remove">×</button>
      </div>
      <div class="goal-status-badge" style="background: ${statusColors[status]};">
        ${statusLabels[status]}
      </div>
      <h4 class="goal-title">${title}</h4>
      ${description ? `<p class="goal-description">${description}</p>` : ''}
      ${owner ? `<p class="goal-owner">👤 ${owner}</p>` : ''}
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
      await window.db.updateTeamMember(state.editingMember, { name, color: selectedColor });
      const member = state.teamMembers.find(m => m.id === state.editingMember);
      if (member) {
        member.name = name;
        member.color = selectedColor;
      }
    } else {
      // Add new member to DB
      const newMember = await window.db.createTeamMember({ name, color: selectedColor });
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
    await window.db.deleteTeamMember(id);

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

async function saveUpdate() {
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
  const timestamp = new Date().toISOString();

  try {
    await window.db.saveUpdate(memberId, date, content, timestamp);

    const updateKey = `${memberId}_${date}`;
    state.updates[updateKey] = { content, timestamp };

    renderAll();
    closeModal('updateModal');
  } catch (error) {
    console.error('Error saving update:', error);
    alert('Failed to save update. Please try again.');
  }
}

async function deleteUpdate() {
  if (!state.editingUpdate) return;

  if (!confirm('Are you sure you want to delete this update?')) {
    return;
  }

  const { memberId, date } = state.editingUpdate;

  try {
    await window.db.deleteUpdate(memberId, date);

    const updateKey = `${memberId}_${date}`;
    delete state.updates[updateKey];

    renderAll();
    closeModal('updateModal');
  } catch (error) {
    console.error('Error deleting update:', error);
    alert('Failed to delete update. Please try again.');
  }
}

// Goal Management
function openGoalModal() {
  state.editingGoal = null;
  document.getElementById('goalModalTitle').textContent = 'Add Goal';
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalDescription').value = '';
  document.getElementById('goalOwner').value = '';
  document.getElementById('goalStatus').value = 'not-started';
  document.getElementById('deleteGoalBtn').style.display = 'none';
  showModal('goalModal');
}

function editGoal(index) {
  state.editingGoal = index;
  const goal = state.goals[index];

  document.getElementById('goalModalTitle').textContent = 'Edit Goal';
  document.getElementById('goalTitle').value = goal.title || '';
  document.getElementById('goalDescription').value = goal.description || '';
  document.getElementById('goalOwner').value = goal.owner || '';
  document.getElementById('goalStatus').value = goal.status || 'not-started';
  document.getElementById('deleteGoalBtn').style.display = 'block';
  showModal('goalModal');
}

async function saveGoal() {
  const title = document.getElementById('goalTitle').value.trim();
  const description = document.getElementById('goalDescription').value.trim();
  const owner = document.getElementById('goalOwner').value.trim();
  const status = document.getElementById('goalStatus').value;

  if (!title) {
    alert('Please enter a goal title');
    return;
  }

  const weekStart = formatDate(state.currentWeekStart, 'iso');
  const goalData = { title, description, owner, status };

  try {
    if (state.editingGoal !== null) {
      // Update existing goal
      const goalId = state.goals[state.editingGoal].id;
      await window.db.updateGoal(goalId, goalData);
      state.goals[state.editingGoal] = { ...state.goals[state.editingGoal], ...goalData };
    } else {
      // Create new goal
      const newGoal = await window.db.createGoal(goalData, weekStart);
      state.goals.push(newGoal);
    }

    renderAll();
    closeModal('goalModal');
  } catch (error) {
    console.error('Error saving goal:', error);
    alert('Failed to save goal. Please try again.');
  }
}

async function removeGoal(index) {
  if (!confirm('Are you sure you want to remove this goal?')) {
    return;
  }

  try {
    const goalId = state.goals[index].id;
    await window.db.deleteGoal(goalId);

    state.goals.splice(index, 1);
    renderAll();
  } catch (error) {
    console.error('Error removing goal:', error);
    alert('Failed to remove goal. Please try again.');
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

  // Team member
  document.getElementById('addTeamMemberBtn').addEventListener('click', openTeamMemberModal);
  document.getElementById('saveTeamMemberBtn').addEventListener('click', saveTeamMember);

  // Update
  document.getElementById('saveUpdateBtn').addEventListener('click', saveUpdate);
  document.getElementById('deleteUpdateBtn').addEventListener('click', deleteUpdate);

  // Goal
  document.getElementById('addGoalBtn').addEventListener('click', openGoalModal);
  document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);
  document.getElementById('deleteGoalBtn').addEventListener('click', async () => {
    if (state.editingGoal !== null) {
      await removeGoal(state.editingGoal);
      closeModal('goalModal');
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
