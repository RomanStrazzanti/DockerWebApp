const Docker = require('dockerode');
const docker = new Docker({ socketPath: '//./pipe/docker_engine' });

(async () => {
    try {
        const container = await docker.createContainer({
            Image: "nginx",
            name: "mon-test-container",
            Tty: true
        });
        await container.start();
        console.log("Conteneur créé :", container.id);
    } catch (err) {
        console.error("Erreur création conteneur :", err);
    }
})();
