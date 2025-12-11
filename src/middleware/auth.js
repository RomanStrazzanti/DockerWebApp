const { supabase } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = data.user;
        req.token = token;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;
