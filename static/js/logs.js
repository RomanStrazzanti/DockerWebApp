// Logs and audit functions
async function loadLogs(containerId) {
    if (!containerId) {
        showToast('Select a container', 'error');
        return;
    }

    try {
        const response = await apiCall(`/containers/${containerId}/logs`);
        const logOutput = document.getElementById('log-output');
        if (logOutput) {
            logOutput.innerHTML = response.logs.map(log => `<p>${escapeHtml(log)}</p>`).join('');
        }
    } catch (error) {
        showToast(`Error loading logs: ${error.message}`, 'error');
    }
}

async function loadAuditLogs() {
    try {
        const logs = await apiCall('/logs');
        const auditTable = document.getElementById('audit-table');
        if (!auditTable) return;

        auditTable.innerHTML = '';

        if (logs.length === 0) {
            auditTable.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No audit logs</td></tr>';
            return;
        }

        logs.forEach(log => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4">${new Date(log.created_at).toLocaleString()}</td>
                <td class="px-6 py-4">${log.action}</td>
                <td class="px-6 py-4">${log.container_id || '-'}</td>
                <td class="px-6 py-4">${log.image_name || '-'}</td>
                <td class="px-6 py-4 text-sm">${log.details || '-'}</td>
                <td class="px-6 py-4">${log.ip_address || '-'}</td>
            `;
            auditTable.appendChild(row);
        });
    } catch (error) {
        showToast(`Error loading audit logs: ${error.message}`, 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
