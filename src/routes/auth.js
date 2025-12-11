const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const SupabaseService = require('../services/supabase');

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        await SupabaseService.logAction(
            data.user.id,
            'LOGIN',
            { email },
            null,
            null,
            req.ip
        );

        res.json({ 
            token: data.session.access_token,
            user: { id: data.user.id, email: data.user.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const { data, error } = await supabase.auth.signUpWithPassword({ email, password });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ 
            message: 'Registration successful',
            user: { id: data.user.id, email: data.user.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
