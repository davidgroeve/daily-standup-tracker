// Auth Service
const auth = {
    // Sign In
    async signIn(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (!error && data.user) {
            await window.db.logChange(data.user.email, 'auth', data.user.id, 'login', 'User logged in');
        }
        return { data, error };
    },

    // Sign Out
    async signOut() {
        try {
            const user = await this.getUser();
            if (user) {
                await window.db.logChange(user.email, 'auth', user.id, 'logout', 'User logged out manually');
            }
        } catch (e) {
            console.error('Logging logout failed', e);
        }

        const { error } = await window.supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        }
        return { error };
    },

    // Get Session
    async getSession() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return session;
    },

    // Get Current User
    async getUser() {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        return user;
    },

    // Initialize Auth Listener
    initAuthListener() {
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);
            if (event === 'SIGNED_OUT') {
                // If we are signed out but it wasn't a manual logout (impossible to know for sure without state, but we can assume timeout if no window trigger)
                // Actually, let's just log every signed out event if we can still identify the user or if it's broad
                window.location.href = 'login.html';
            } else if (event === 'USER_UPDATED') {
                const user = session?.user;
                if (user) await window.db.logChange(user.email, 'auth', user.id, 'update', 'User profile updated');
            }
        });
    },

    // Protect Route (call on private pages)
    async protectRoute() {
        const session = await this.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return null;
        }
        return session;
    },

    // Password Reset
    async sendPasswordReset(email) {
        // Redirect to update-password.html after clicking the email link
        const redirectTo = window.location.origin + '/update-password.html';
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        });
        return { error };
    },

    // Update Password (for logged in users)
    async updatePassword(newPassword) {
        const { error } = await window.supabaseClient.auth.updateUser({
            password: newPassword
        });
        return { error };
    }
};

// Export for usage
window.auth = auth;
