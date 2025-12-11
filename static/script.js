// Fonction pour récupérer et afficher tous les conteneurs
async function fetchContainers() {
    try {
        const res = await fetch("/api/containers");
        const containers = await res.json();

        const list = document.getElementById("container-list");
        list.innerHTML = "";

        containers.forEach(c => {
            const div = document.createElement("div");
            div.className = "container-card";

            // Boutons désactivés selon l'état
            const startDisabled = c.status === "running" ? "disabled" : "";
            const stopDisabled = c.status !== "running" ? "disabled" : "";

            div.innerHTML = `
                <strong>${c.name}</strong> (${c.image}) - <em>${c.status}</em>
                <button onclick="startContainer('${c.id}')" ${startDisabled}>Démarrer</button>
                <button onclick="stopContainer('${c.id}')" ${stopDisabled}>Arrêter</button>
                <button onclick="deleteContainer('${c.id}')">Supprimer</button>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error("Erreur fetchContainers:", err);
    }
}

// Démarrer un conteneur
async function startContainer(id) {
    try {
        await fetch("/api/containers/start", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id})
        });
        fetchContainers();
    } catch (err) {
        console.error("Erreur startContainer:", err);
    }
}

// Arrêter un conteneur
async function stopContainer(id) {
    try {
        await fetch("/api/containers/stop", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id})
        });
        fetchContainers();
    } catch (err) {
        console.error("Erreur stopContainer:", err);
    }
}

// Supprimer un conteneur arrêté
async function deleteContainer(id) {
    try {
        const res = await fetch("/api/containers/delete", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id})
        });
        const data = await res.json();
        if (!data.success) alert(data.error);
        fetchContainers();
    } catch (err) {
        console.error("Erreur deleteContainer:", err);
    }
}

// Créer et lancer un nouveau conteneur
document.getElementById("create-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const image = e.target.image.value;
    const name = e.target.name.value;

    try {
        await fetch("/api/containers/create", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({image, name})
        });
        e.target.reset();
        fetchContainers();
    } catch (err) {
        console.error("Erreur createContainer:", err);
    }
});

// Initialisation
fetchContainers();
setInterval(fetchContainers, 2000); // Rafraîchissement automatique toutes les 2 secondes
