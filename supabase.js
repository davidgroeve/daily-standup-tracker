// Supabase Configuration
const SUPABASE_URL = 'https://ksveqaogqrtuihtyiqbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdmVxYW9ncXJ0dWlodHlpcWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDg3MzgsImV4cCI6MjA4MDQyNDczOH0.hk6rG0xYolG-og71sd1JBW5HUMdkLZwC2ei2QE9uXZg';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    async createTeamMember(member) {
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
        return data;
    },

    async updateTeamMember(id, updates) {
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
        return data;
    },

    async deleteTeamMember(id) {
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
                content: update.content || [],
                timestamp: update.timestamp
            };
        });
        return updates;
    },

    async saveUpdate(memberId, date, content, timestamp) {
        // Check if update exists
        const { data: existing } = await supabase
            .from('updates')
            .select('id')
            .eq('member_id', memberId)
            .eq('date', date)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('updates')
                .update({ content, timestamp })
                .eq('id', existing.id);

            if (error) {
                console.error('Error updating update:', error);
                throw error;
            }
        } else {
            // Create new
            const { error } = await supabase
                .from('updates')
                .insert([{
                    member_id: memberId,
                    date,
                    content,
                    timestamp
                }]);

            if (error) {
                console.error('Error creating update:', error);
                throw error;
            }
        }
    },

    async deleteUpdate(memberId, date) {
        const { error } = await supabase
            .from('updates')
            .delete()
            .eq('member_id', memberId)
            .eq('date', date);

        if (error) {
            console.error('Error deleting update:', error);
            throw error;
        }
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

    async createGoal(goal, weekStart) {
        const { data, error } = await supabase
            .from('goals')
            .insert([{
                title: goal.title,
                description: goal.description,
                owner: goal.owner,
                status: goal.status,
                week_start: weekStart
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
        return data;
    },

    async updateGoal(id, updates) {
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
        return data;
    },

    async deleteGoal(id) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }
};

// Export for use in app.js
window.db = db;
