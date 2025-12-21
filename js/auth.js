// Auth Service
const auth = {
    // Sign In
    async signIn(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // Sign Out
    async signOut() {
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
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.href = 'login.html';
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
