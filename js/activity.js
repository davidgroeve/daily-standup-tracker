// Activity Log State
let allLogs = [];
let filters = {
    user: 'all',
    action: 'all',
    date: ''
};
let currentGroupBy = 'none';

async function loadAndRenderChangeLogs() {
    const list = document.getElementById('changeLogsList');
    if (!list) return;

    try {
        allLogs = await window.db.getChangeLogs(100);

        // Populate User Filter if not already done
        populateUserFilter(allLogs);

        renderLogs();
    } catch (e) {
        console.error('Error loading logs:', e);
        list.innerHTML = '<p style="color: var(--danger); text-align: center; padding: 2rem;">Failed to load activity log. Please check your connection.</p>';
    }
}

function populateUserFilter(logs) {
    const userSelect = document.getElementById('userFilter');
    if (!userSelect || userSelect.options.length > 1) return;

    const users = [...new Set(logs.map(log => log.user_email))].sort();
    users.forEach(email => {
        const opt = document.createElement('option');
        opt.value = email;
        opt.textContent = email.split('@')[0];
        userSelect.appendChild(opt);
    });
}

function renderLogs() {
    const list = document.getElementById('changeLogsList');
    if (!list) return;

    // Apply filters
    let filtered = allLogs.filter(log => {
        const userMatch = filters.user === 'all' || log.user_email === filters.user;

        const actionType = getActionGroup(log.action);
        const actionMatch = filters.action === 'all' || actionType === filters.action;

        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const dateMatch = !filters.date || logDate === filters.date;

        return userMatch && actionMatch && dateMatch;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No matching activity found.</p>';
        return;
    }

    if (currentGroupBy === 'none') {
        list.innerHTML = filtered.map(log => renderLogItem(log)).join('');
    } else {
        const groups = groupBy(filtered, currentGroupBy);
        let html = '';

        // Sort group keys if needed
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (currentGroupBy === 'date') return new Date(b) - new Date(a);
            return a.localeCompare(b);
        });

        sortedKeys.forEach((key, index) => {
            const groupId = `group-${index}`;
            html += `
                <div class="activity-group-header collapsed" onclick="toggleActivityGroup('${groupId}', this)">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${getGroupLabel(key)}
                        <span class="count-badge" style="font-size: 0.7rem; opacity: 0.8; background: var(--glass-border); color: var(--text-primary); border: 1px solid var(--accent-primary);">${groups[key].length} events</span>
                    </div>
                    <span class="toggle-icon">▼</span>
                </div>
                <div id="${groupId}" class="activity-group-content collapsed">
                    ${groups[key].map(log => renderLogItem(log)).join('')}
                </div>
            `;
        });
        list.innerHTML = html;
    }
}

function toggleActivityGroup(groupId, header) {
    const content = document.getElementById(groupId);
    if (!content) return;

    const isCollapsed = content.classList.toggle('collapsed');
    header.classList.toggle('collapsed', isCollapsed);
}

function getActionGroup(action) {
    if (['login', 'logout', 'timeout'].includes(action)) return 'auth';
    if (['csv', 'xlsx', 'pdf', 'image'].includes(action)) return 'export';
    if (['add_item', 'edit_item', 'delete_item'].includes(action)) return 'items';
    if (['cut', 'copy', 'paste'].includes(action)) return 'clipboard';
    if (action === 'migration') return 'migration';
    return action; // create, update, delete
}

function groupBy(logs, prop) {
    return logs.reduce((groups, log) => {
        let val;
        if (prop === 'user') val = log.user_email;
        else if (prop === 'action') val = getActionGroup(log.action);
        else if (prop === 'date') val = new Date(log.timestamp).toISOString().split('T')[0];

        if (!groups[val]) groups[val] = [];
        groups[val].push(log);
        return groups;
    }, {});
}

function getGroupLabel(key) {
    if (currentGroupBy === 'user') return `👤 ${key.split('@')[0]}`;
    if (currentGroupBy === 'action') return `⚡ ${key.charAt(0).toUpperCase() + key.slice(1)}`;
    if (currentGroupBy === 'date') return `📅 ${new Date(key).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    return key;
}

function renderLogItem(log) {
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    let actionClass = 'action-update';
    let actionIcon = '📝';

    if (log.action === 'create') {
        actionClass = 'action-create';
        actionIcon = '➕';
    } else if (log.action === 'delete') {
        actionClass = 'action-delete';
        actionIcon = '🗑️';
    } else if (log.action === 'login' || log.action === 'logout' || log.action === 'timeout') {
        actionClass = 'action-auth';
        actionIcon = log.action === 'timeout' ? '⏰' : '👤';
    } else if (log.action === 'csv' || log.action === 'xlsx' || log.action === 'pdf' || log.action === 'image') {
        actionClass = 'action-export';
        actionIcon = '📤';
    } else if (log.action === 'cut') {
        actionClass = 'action-clipboard';
        actionIcon = '✂️';
    } else if (log.action === 'copy') {
        actionClass = 'action-clipboard';
        actionIcon = '📋';
    } else if (log.action === 'paste') {
        actionClass = 'action-clipboard';
        actionIcon = '📥';
    } else if (log.action === 'migration') {
        actionClass = 'action-migration';
        actionIcon = '📜';
    } else if (log.action === 'add_item') {
        actionClass = 'action-create';
        actionIcon = '➕';
    } else if (log.action === 'edit_item') {
        actionClass = 'action-update';
        actionIcon = '✏️';
    } else if (log.action === 'delete_item') {
        actionClass = 'action-delete';
        actionIcon = '🗑️';
    } else if (log.action === 'clear_cell') {
        actionClass = 'action-delete';
        actionIcon = '🧹';
    }

    return `
        <div class="change-log-item">
            <div class="change-meta">
                <span class="change-user">
                    <span style="opacity: 0.7;">👤</span> ${log.user_email.split('@')[0]}
                </span>
                <span class="change-time">${dateStr} at ${timeStr}</span>
            </div>
            <div class="change-desc">
                <span style="margin-right: 8px;">${actionIcon}</span>
                ${log.description || 'No description'}
            </div>
            <span class="change-action-badge ${actionClass}">${log.action}</span>
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderChangeLogs();

    // Filters
    document.getElementById('userFilter').addEventListener('change', (e) => {
        filters.user = e.target.value;
        renderLogs();
    });

    document.getElementById('actionFilter').addEventListener('change', (e) => {
        filters.action = e.target.value;
        renderLogs();
    });

    document.getElementById('dateFilter').addEventListener('change', (e) => {
        filters.date = e.target.value;
        renderLogs();
    });

    document.getElementById('groupBy').addEventListener('change', (e) => {
        currentGroupBy = e.target.value;
        renderLogs();
    });

    // Refresh
    const refreshBtn = document.getElementById('refreshLogsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const list = document.getElementById('changeLogsList');
            if (list) list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Refreshing activity...</p>';
            loadAndRenderChangeLogs();
        });
    }
});
