const express = require('express');
const router = express.Router();
const sseManager = require('../utils/sse-manager');

router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    sseManager.addClient(res);

    req.on('close', () => {
        sseManager.removeClient(res);
    });
});

module.exports = router;
