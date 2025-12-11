const { supabase } = require('../config/supabase');

class AuthService {
    async validateToken(token) {
        try {
            const { data, error } = await supabase.auth.getUser(token);
            if (error) throw error;
            return { valid: true, user: data.user };
        } catch (err) {
            return { valid: false, error: err.message };
        }
    }

    async getUserById(userId) {
        try {
            const { data, error } = await supabase.auth.admin.getUserById(userId);
            if (error) throw error;
            return data;
        } catch (err) {
            throw new Error(`Failed to get user: ${err.message}`);
        }
    }
}

module.exports = new AuthService();
