const express = require('express');
const router = express.Router();
const DockerService = require('../services/docker');
const SupabaseService = require('../services/supabase');

router.get('/', async (req, res) => {
    try {
        const containers = await DockerService.listContainers();
        res.json(containers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { image, name, ports = {}, env = [] } = req.body;

        if (!image || !name) {
            return res.status(400).json({ error: 'Image and name required' });
        }

        const container = await DockerService.createContainer({
            Image: image,
            name,
            ExposedPorts: ports,
            Env: env,
        });

        await SupabaseService.logAction(
            req.user.id,
            'CREATE_CONTAINER',
            { image, name },
            container.id,
            null,
            req.ip
        );

        res.json(container);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/stats', async (req, res) => {
    try {
        const stats = await DockerService.getStats(req.params.id);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/logs', async (req, res) => {
    try {
        const tail = req.query.tail || 100;
        const logs = await DockerService.getLogs(req.params.id, tail);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/start', async (req, res) => {
    try {
        const result = await DockerService.startContainer(req.params.id);

        await SupabaseService.logAction(
            req.user.id,
            'START_CONTAINER',
            { containerId: req.params.id },
            req.params.id,
            null,
            req.ip
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/stop', async (req, res) => {
    try {
        const result = await DockerService.stopContainer(req.params.id);

        await SupabaseService.logAction(
            req.user.id,
            'STOP_CONTAINER',
            { containerId: req.params.id },
            req.params.id,
            null,
            req.ip
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await DockerService.deleteContainer(req.params.id);

        await SupabaseService.logAction(
            req.user.id,
            'DELETE_CONTAINER',
            { containerId: req.params.id },
            req.params.id,
            null,
            req.ip
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
