/**
 * Progress Page Logic
 * Fetches and displays updates for all team members, grouped by member and date.
 */

async function initProgress() {
    const content = document.getElementById('progressContent');
    if (!content) return;

    try {
        // Fetch data
        const [members, allUpdatesFlat] = await Promise.all([
            window.db.getTeamMembers(),
            fetchRawUpdates()
        ]);

        if (members.length === 0) {
            content.innerHTML = '<div class="empty-state"><h3>No team members found</h3><p>Add team members in the "Manage Team" section.</p></div>';
            return;
        }

        // Filter and Group updates by member_id
        const updatesByMember = {};
        allUpdatesFlat.forEach(update => {
            const hasItems = update.items && update.items.length > 0;
            const hasContent = update.content && update.content.length > 0;

            // Only show days with at least one update
            if (hasItems || hasContent) {
                if (!updatesByMember[update.member_id]) {
                    updatesByMember[update.member_id] = [];
                }
                updatesByMember[update.member_id].push(update);
            }
        });

        // Render members and their updates
        let html = '';
        members.forEach(member => {
            const memberUpdates = (updatesByMember[member.id] || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

            html += `
                <section class="member-section">
                    <div class="member-header">
                        <div class="member-color-indicator" style="background-color: ${member.color}"></div>
                        <h2 class="member-name">${member.name}</h2>
                        <span style="font-size: 0.9rem; color: var(--text-muted); margin-left: auto;">
                            ${memberUpdates.length} update${memberUpdates.length !== 1 ? 's' : ''} total
                        </span>
                    </div>
                    ${memberUpdates.length > 0 ? `
                        <div class="daily-updates-list">
                            ${memberUpdates.map(update => renderUpdateCard(update)).join('')}
                        </div>
                    ` : `
                        <p style="color: var(--text-muted); font-style: italic; padding-left: 27px;">No updates recorded for this member.</p>
                    `}
                </section>
            `;
        });

        content.innerHTML = html;

    } catch (error) {
        console.error('Error initializing progress page:', error);
        content.innerHTML = '<div class="empty-state"><h3>Error loading progress</h3><p>Please try again later.</p></div>';
    }
}

/**
 * Fetches updates directly from the 'updates' table without formatting them into a member-date key structure.
 * This is better for the progress view.
 */
async function fetchRawUpdates() {
    const { data, error } = await window.supabaseClient
        .from('updates')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        throw error;
    }
    return data || [];
}

/**
 * Renders a card for a single daily update
 */
function renderUpdateCard(update) {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Date(update.date).toLocaleDateString(undefined, dateOptions);

    const hasItems = update.items && update.items.length > 0;
    const hasContent = update.content && update.content.length > 0;

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
        contentHtml = `
            <div class="update-items-grouped">
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
    } else if (hasContent) {
        // Legacy content
        contentHtml = `
            <ul class="update-items">
                ${update.content.map(task => `
                    <li class="update-item">${task}</li>
                `).join('')}
            </ul>`;
    }

    return `
        <div class="update-card">
            <span class="update-date">${formattedDate}</span>
            ${contentHtml}
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initProgress();
});
