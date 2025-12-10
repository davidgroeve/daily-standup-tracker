// Supabase Configuration
const SUPABASE_URL = 'https://ksveqaogqrtuihtyiqbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdmVxYW9ncXJ0dWlodHlpcWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDg3MzgsImV4cCI6MjA4MDQyNDczOH0.hk6rG0xYolG-og71sd1JBW5HUMdkLZwC2ei2QE9uXZg';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabase;

// Database Service
const db = {
    // Team Members
    async getTeamMembers() {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching team members:', error);
            return [];
        }
        return data || [];
    },

    async createTeamMember(member, userEmail = 'Unknown') {
        const { data, error } = await supabase
            .from('team_members')
            .insert([{
                name: member.name,
                color: member.color
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating team member:', error);
            throw error;
        }

        await this.logChange(userEmail, 'team_member', data.id, 'create', `Created member: ${member.name}`);
        return data;
    },

    async updateTeamMember(id, updates, userEmail = 'Unknown') {
        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating team member:', error);
            throw error;
        }

        await this.logChange(userEmail, 'team_member', id, 'update', `Updated member: ${updates.name || 'details'}`);
        return data;
    },

    async deleteTeamMember(id, userEmail = 'Unknown') {
        // First delete all updates for this member
        await supabase
            .from('updates')
            .delete()
            .eq('member_id', id);

        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting team member:', error);
            throw error;
        }

        await this.logChange(userEmail, 'team_member', id, 'delete', 'Deleted team member');
    },

    // Updates
    async getUpdates() {
        const { data, error } = await supabase
            .from('updates')
            .select('*');

        if (error) {
            console.error('Error fetching updates:', error);
            return [];
        }

        // Convert to the format expected by the app
        const updates = {};
        (data || []).forEach(update => {
            const key = `${update.member_id}_${update.date}`;
            updates[key] = {
                member_id: update.member_id,
                date: update.date,
                content: update.content || [],
                items: update.items || [], // New structured items
                timestamp: update.timestamp
            };
        });
        return updates;
    },

    async saveUpdate(memberId, date, content, items, timestamp, userEmail = 'Unknown') {
        // Use upsert to handle both insert and update atomically, preventing race conditions (409 errors)
        const { error } = await supabase
            .from('updates')
            .upsert({
                member_id: memberId,
                date: date,
                content: content,
                items: items,
                timestamp: timestamp
            }, { onConflict: 'member_id,date' });

        if (error) {
            console.error('Error saving update:', error);
            throw error;
        }

        await this.logChange(userEmail, 'update', `${memberId}_${date}`, 'update', `Updated daily status for ${date}`);
    },

    async deleteUpdate(memberId, date, userEmail = 'Unknown') {
        const { error } = await supabase
            .from('updates')
            .delete()
            .eq('member_id', memberId)
            .eq('date', date);

        if (error) {
            console.error('Error deleting update:', error);
            throw error;
        }

        await this.logChange(userEmail, 'update', `${memberId}_${date}`, 'delete', `Deleted daily status for ${date}`);
    },

    // Goals
    async getGoals(weekStart) {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('week_start', weekStart)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching goals:', error);
            return [];
        }
        return data || [];
    },

    async createGoal(goal, weekStart, userEmail = 'Unknown') {
        const { data, error } = await supabase
            .from('goals')
            .insert([{
                title: goal.title,
                description: goal.description,
                owner: goal.owner,
                status: goal.status,
                type: goal.type,
                block_reason: goal.block_reason,
                week_start: weekStart
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating goal:', error);
            throw error;
        }

        await this.logChange(userEmail, 'goal', data.id, 'create', `Created target: ${goal.title}`);
        return data;
    },

    async updateGoal(id, updates, userEmail = 'Unknown') {
        const { data, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating goal:', error);
            throw error;
        }

        await this.logChange(userEmail, 'goal', id, 'update', `Updated target: ${updates.title || 'details'}`);
        return data;
    },

    async deleteGoal(id, userEmail = 'Unknown') {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }

        await this.logChange(userEmail, 'goal', id, 'delete', 'Deleted target');
    },

    // Leaves
    async getLeaves() {
        const { data, error } = await supabase
            .from('leaves')
            .select('*, team_members(name, color)')
            .order('start_date', { ascending: true });

        if (error) {
            console.error('Error fetching leaves:', error);
            return [];
        }
        return data || [];
    },

    async getFutureLeaves(startDateStr) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*, team_members(name, color)')
            .gte('end_date', startDateStr) // Get leaves that end on or after start date
            .order('start_date', { ascending: true });

        if (error) {
            console.error('Error fetching future leaves:', error);
            return [];
        }
        return data || [];
    },

    async createLeave(leave, userEmail = 'Unknown') {
        const { data, error } = await supabase
            .from('leaves')
            .insert([{
                member_id: leave.member_id,
                start_date: leave.start_date,
                end_date: leave.end_date,
                type: leave.type,
                description: leave.description
            }])
            .select('*, team_members(name, color)')
            .single();

        if (error) {
            console.error('Error creating leave:', error);
            throw error;
        }

        await this.logChange(userEmail, 'leave', data.id, 'create', `Created leave: ${leave.type}`);
        return data;
    },

    async updateLeave(id, updates, userEmail = 'Unknown') {
        const { data, error } = await supabase
            .from('leaves')
            .update(updates)
            .eq('id', id)
            .select('*, team_members(name, color)')
            .single();

        if (error) {
            console.error('Error updating leave:', error);
            throw error;
        }

        await this.logChange(userEmail, 'leave', id, 'update', 'Updated leave details');
        return data;
    },

    async deleteLeave(id, userEmail = 'Unknown') {
        const { error } = await supabase
            .from('leaves')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting leave:', error);
            throw error;
        }

        // Log change
        await this.logChange(userEmail, 'leave', id, 'delete', 'Deleted leave');
    },

    // Change Logs
    async logChange(userEmail, entityType, entityId, action, description) {
        const { error } = await supabase
            .from('change_logs')
            .insert([{
                user_email: userEmail,
                entity_type: entityType,
                entity_id: entityId,
                action: action,
                description: description
            }]);

        if (error) {
            console.error('Error logging change:', error);
            // Don't throw, just log error so we don't block the main action
        }
    },

    async getChangeLogs(limit = 50) {
        const { data, error } = await supabase
            .from('change_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching change logs:', error);
            return [];
        }
        return data || [];
    }
};

// Export for use in app.js
window.db = db;
