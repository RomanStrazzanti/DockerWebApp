const express = require('express');
const Docker = require('dockerode');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const docker = new Docker({ socketPath: '//./pipe/docker_engine' });

// Middleware
app.use(bodyParser.json());

// Sert tout le dossier static
app.use(express.static(path.join(__dirname, 'static')));

// Route principale : renvoie index.html
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'static', 'index.html');
    console.log("Envoi de :", filePath);  // debug
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Erreur en envoyant index.html:", err);
            res.status(err.status || 500).end();
        }
    });
});

// Lister tous les conteneurs
app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json(containers.map(c => ({
            id: c.Id,
            name: c.Names[0].replace('/', ''),
            image: c.Image,
            status: c.State
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Démarrer un conteneur
app.post('/api/containers/start', async (req, res) => {
    try {
        const container = docker.getContainer(req.body.id);
        await container.start();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Arrêter un conteneur
app.post('/api/containers/stop', async (req, res) => {
    try {
        const container = docker.getContainer(req.body.id);
        await container.stop();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Supprimer un conteneur arrêté
app.post('/api/containers/delete', async (req, res) => {
    try {
        const container = docker.getContainer(req.body.id);
        const info = await container.inspect();
        if (info.State.Running) return res.json({ success: false, error: "Container is running" });
        await container.remove();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Créer et lancer un nouveau conteneur
app.post('/api/containers/create', async (req, res) => {
    try {
        const { image, name } = req.body;

        // Pull automatique si l'image n'existe pas
        await new Promise((resolve, reject) => {
            docker.pull(image, (err, stream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err) => err ? reject(err) : resolve());
            });
        });

        const container = await docker.createContainer({
            Image: image,
            name: name || undefined,
            Tty: true
        });

        await container.start();
        res.json({ success: true, id: container.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lancer le serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
