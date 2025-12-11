const express = require('express');
const router = express.Router();
const DockerService = require('../services/docker');
const SupabaseService = require('../services/supabase');

router.get('/', async (req, res) => {
    try {
        const images = await DockerService.listImages();
        res.json(images);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await DockerService.deleteImage(req.params.id);

        await SupabaseService.logAction(
            req.user.id,
            'DELETE_IMAGE',
            { imageId: req.params.id },
            null,
            req.params.id,
            req.ip
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
