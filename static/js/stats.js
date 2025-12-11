// Stats loading and display
async function loadStats(containerId) {
    if (!containerId) {
        showToast('Select a container', 'error');
        return;
    }

    try {
        const stats = await apiCall(`/containers/${containerId}/stats`);
        const statsDiv = document.getElementById('stats-display');
        if (statsDiv) {
            const cpu = !isNaN(parseFloat(stats.cpu)) ? stats.cpu : '0';
            const memory = !isNaN(parseFloat(stats.memory)) ? stats.memory : '0';
            const memoryUsage = !isNaN(parseFloat(stats.memoryUsage)) ? stats.memoryUsage : '0';
            const memoryLimit = !isNaN(parseFloat(stats.memoryLimit)) ? stats.memoryLimit : '0';

            statsDiv.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg shadow">
                        <p class="text-gray-600 text-sm">CPU Usage</p>
                        <p class="text-3xl font-bold text-blue-600">${cpu}%</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow">
                        <p class="text-gray-600 text-sm">Memory Usage</p>
                        <p class="text-3xl font-bold text-purple-600">${memory}%</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow col-span-2">
                        <p class="text-gray-600 text-sm">Memory Details</p>
                        <p class="text-lg font-semibold">${memoryUsage} / ${memoryLimit} MB</p>
                    </div>
                </div>
            `;
        }

        // Auto-refresh stats every 5 seconds
        setTimeout(() => loadStats(containerId), 5000);
    } catch (error) {
        showToast(`Error loading stats: ${error.message}`, 'error');
    }
}
