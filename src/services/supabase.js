const { supabaseAdmin } = require('../config/supabase');

class SupabaseService {
    async logAction(userId, action, details = {}, containerId = null, imageName = null, ipAddress = null) {
        try {
            const { error } = await supabaseAdmin
                .from('logs')
                .insert([
                    {
                        user_id: userId,
                        action,
                        container_id: containerId,
                        image_name: imageName,
                        details: JSON.stringify(details),
                        ip_address: ipAddress,
                    },
                ]);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('Logging failed:', err);
            return { success: false, error: err.message };
        }
    }

    async getAuditLogs(userId = null) {
        try {
            let query = supabaseAdmin.from('logs').select('*');
            
            if (userId) {
                query = query.eq('user_id', userId);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
            
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            return [];
        }
    }
}

module.exports = new SupabaseService();
