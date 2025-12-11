const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const Docker = require('dockerode');
require('dotenv').config();

const app = express();
const docker = new Docker({ socketPath: '//./pipe/docker_engine' });

// Supabase clients
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

let sseClients = [];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

function notifyClients() {
    sseClients.forEach(res => {
        try { res.write('data: refresh\n\n'); } catch (e) {}
    });
}

async function logAction(userId, action, containerId, imageName, details, ipAddress) {
    try {
        await supabaseAdmin.from('logs').insert({
            user_id: userId,
            action: action,
            container_id: containerId,
            image_name: imageName,
            details: details,
            ip_address: ipAddress
        });
    } catch (err) {
        console.error('Log error:', err.message);
    }
}

async function authMiddleware(req, res, next) {
    const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null;
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return res.status(401).json({ error: 'Token invalide' });
        req.user = data.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Auth failed' });
    }
}

// Routes publiques - Serve HTML files
app.get('/login', (req, res) => {
    fs.readFile(path.join(__dirname, 'static', 'login.html'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.setHeader('Content-Type', 'text/html');
        res.send(data);
    });
});

app.get('/register', (req, res) => {
    fs.readFile(path.join(__dirname, 'static', 'register.html'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.setHeader('Content-Type', 'text/html');
        res.send(data);
    });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email et password requis' });

        const { data, error } = await supabase.auth.signUpWithPassword({ email, password });
        if (error) return res.status(400).json({ error: error.message });

        res.json({ success: true, user: data.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email et password requis' });

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: error.message });

        await logAction(data.user.id, 'login', null, null, { email }, req.ip);
        res.json({ success: true, token: data.session.access_token, user: data.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    await logAction(req.user.id, 'logout');
    res.json({ success: true });
});

// Container routes
app.get('/api/containers', authMiddleware, async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json(containers.map(c => ({
            id: c.Id,
            name: c.Names[0].replace('/', ''),
            image: c.Image,
            status: c.State,
            ports: c.Ports || []
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/containers', authMiddleware, async (req, res) => {
    try {
        const { image, name } = req.body;
        if (!image) return res.status(400).json({ error: 'Image requise' });

        // Pull image
        await new Promise((resolve, reject) => {
            docker.pull(image, (err, stream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err) => err ? reject(err) : resolve());
            });
        });

        // Create container
        const container = await docker.createContainer({
            Image: image,
            name: name || undefined,
            Tty: true
        });

        await container.start();
        await logAction(req.user.id, 'create_container', container.id, image, { name }, req.ip);
        notifyClients();
        res.json({ success: true, id: container.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/containers/:id/start', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const container = docker.getContainer(id);
        const info = await container.inspect();
        await container.start();
        await logAction(req.user.id, 'start_container', id, null, { name: info.Name }, req.ip);
        notifyClients();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/containers/:id/stop', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const container = docker.getContainer(id);
        const info = await container.inspect();
        await container.stop();
        await logAction(req.user.id, 'stop_container', id, null, { name: info.Name }, req.ip);
        notifyClients();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/containers/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const container = docker.getContainer(id);
        const info = await container.inspect();
        if (info.State.Running) return res.status(400).json({ error: 'Container running' });
        
        await container.remove();
        await logAction(req.user.id, 'delete_container', id, null, { name: info.Name }, req.ip);
        notifyClients();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logs route
app.get('/api/containers/:id/logs', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const container = docker.getContainer(id);
        const stream = await container.logs({ stdout: true, stderr: true, tail: 100 });
        res.json({ logs: stream.toString('utf8').split('\n') });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stats route
app.get('/api/containers/:id/stats', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const container = docker.getContainer(id);
        const stats = await container.stats({ stream: false });
        
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
        const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
        const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
        
        const memUsage = stats.memory_stats.usage || 0;
        const memLimit = stats.memory_stats.limit || 0;
        const memPercent = memLimit > 0 ? (memUsage / memLimit) * 100 : 0;

        res.json({
            cpu: isNaN(cpuPercent) ? '0' : cpuPercent.toFixed(2),
            memory: isNaN(memPercent) ? '0' : memPercent.toFixed(2),
            memoryUsage: (memUsage / (1024 * 1024)).toFixed(2),
            memoryLimit: (memLimit / (1024 * 1024)).toFixed(2)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Images routes
app.get('/api/images', authMiddleware, async (req, res) => {
    try {
        const images = await docker.listImages();
        res.json(images.map(img => ({
            id: img.Id,
            tags: img.RepoTags || ['<none>'],
            size: img.Size,
            created: img.Created
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/images/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const image = docker.getImage(id);
        await image.remove({ force: true });
        await logAction(req.user.id, 'delete_image', null, id, null, req.ip);
        notifyClients();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Audit logs route
app.get('/api/logs', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SSE events route
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    sseClients.push(res);
    console.log('SSE connecté. Total: ' + sseClients.length);
    
    const interval = setInterval(() => res.write(': ping\n\n'), 30000);
    req.on('close', () => {
        clearInterval(interval);
        sseClients = sseClients.filter(c => c !== res);
        console.log('SSE déconnecté. Total: ' + sseClients.length);
    });
});

// Serve index.html
app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'static', 'index.html'), 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.setHeader('Content-Type', 'text/html');
        res.send(data);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 Server running on http://localhost:' + PORT);
    console.log('🔐 Login: http://localhost:' + PORT + '/login');
});
