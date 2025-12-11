const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const __dirname = path.dirname(require.main.filename);

const authMiddleware = require('./middleware/auth');
const sseManager = require('./utils/sse-manager');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const containerRoutes = require('./routes/containers');
const imageRoutes = require('./routes/images');
const eventRoutes = require('./routes/events');
const logRoutes = require('./routes/logs');

const app = express();

// Middleware
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '..', 'static')));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/containers', authMiddleware, containerRoutes);
app.use('/api/images', authMiddleware, imageRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api', eventRoutes);

// Serve HTML files
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'static', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'static', 'register.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'static', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).json({ error: err.message });
});

// Start SSE keep-alive
sseManager.keepAlive();

// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.success(`Server running on http://localhost:${PORT}`);
    logger.info(`Login: http://localhost:${PORT}/login`);
});
