// Container management functions
async function fetchContainers() {
    try {
        return await apiCall('/containers');
    } catch (error) {
        showToast('Error loading containers', 'error');
        return [];
    }
}

function renderContainers(containers, filter = 'all', search = '') {
    const containerList = document.getElementById('container-list');
    if (!containerList) return;

    let filtered = containers;

    // Filter by status
    if (filter !== 'all') {
        filtered = filtered.filter(c => c.status === filter);
    }

    // Filter by search
    if (search) {
        filtered = filtered.filter(c => c.name.includes(search));
    }

    containerList.innerHTML = '';

    if (filtered.length === 0) {
        containerList.innerHTML = '<p class="text-gray-500 text-center py-8">No containers found</p>';
        return;
    }

    filtered.forEach(container => {
        const statusColor = container.status === 'running' ? 'green' : 'red';
        const containerEl = document.createElement('div');
        containerEl.className = 'bg-white p-4 rounded-lg shadow border border-gray-200';
        containerEl.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-bold text-lg">${container.name}</h3>
                    <p class="text-sm text-gray-600">${container.image}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800">
                    ${container.status}
                </span>
            </div>
            <div class="flex gap-2">
                ${container.status === 'exited' 
                    ? `<button class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600" onclick="startContainer('${container.id}')">Start</button>` 
                    : `<button class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600" onclick="stopContainer('${container.id}')">Stop</button>`
                }
                <button class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600" onclick="deleteContainer('${container.id}')">Delete</button>
            </div>
        `;
        containerList.appendChild(containerEl);
    });
}

async function startContainer(id) {
    try {
        await apiCall(`/containers/${id}/start`, { method: 'POST' });
        showToast(`Container ${id} started`, 'success');
        notifyRefresh();
    } catch (error) {
        showToast(`Failed to start container: ${error.message}`, 'error');
    }
}

async function stopContainer(id) {
    try {
        await apiCall(`/containers/${id}/stop`, { method: 'POST' });
        showToast(`Container ${id} stopped`, 'success');
        notifyRefresh();
    } catch (error) {
        showToast(`Failed to stop container: ${error.message}`, 'error');
    }
}

async function deleteContainer(id) {
    if (!confirm(`Are you sure you want to delete container ${id}?`)) return;

    try {
        await apiCall(`/containers/${id}`, { method: 'DELETE' });
        showToast(`Container ${id} deleted`, 'success');
        notifyRefresh();
    } catch (error) {
        showToast(`Failed to delete container: ${error.message}`, 'error');
    }
}

async function createContainer() {
    const form = document.getElementById('container-form');
    if (!form) return;

    const image = form.querySelector('[name="image"]')?.value.trim();
    const name = form.querySelector('[name="name"]')?.value.trim();

    if (!image || !name) {
        showToast('Image and name required', 'error');
        return;
    }

    try {
        await apiCall('/containers', {
            method: 'POST',
            body: JSON.stringify({ image, name }),
        });
        showToast('Container created successfully', 'success');
        form.reset();
        notifyRefresh();
    } catch (error) {
        showToast(`Failed to create container: ${error.message}`, 'error');
    }
}
