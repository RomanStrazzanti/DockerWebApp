const express = require('express');
const router = express.Router();
const SupabaseService = require('../services/supabase');

router.get('/', async (req, res) => {
    try {
        const logs = await SupabaseService.getAuditLogs(req.user.id);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
