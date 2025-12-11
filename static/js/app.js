// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
        return;
    }

    if (!token) return; // Not authenticated, showing login/register page

    // Initialize UI
    displayUserInfo();
    setupFilters();

    // Setup event listeners
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
    }

    const createBtn = document.getElementById('create-btn');
    if (createBtn) {
        createBtn.addEventListener('click', createContainer);
    }

    const logsContainerSelect = document.getElementById('logs-container-select');
    if (logsContainerSelect) {
        logsContainerSelect.addEventListener('change', (e) => {
            loadLogs(e.target.value);
            loadStats(e.target.value);
        });
    }

    const imagesTab = document.getElementById('images-tab');
    if (imagesTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display !== 'none' && !window.imagesLoaded) {
                    loadAndRenderImages();
                    window.imagesLoaded = true;
                }
            });
        });
        observer.observe(imagesTab, { attributes: true, attributeFilter: ['style'] });
    }

    const auditTab = document.getElementById('audit-tab');
    if (auditTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display !== 'none' && !window.auditLoaded) {
                    loadAuditLogs();
                    window.auditLoaded = true;
                }
            });
        });
        observer.observe(auditTab, { attributes: true, attributeFilter: ['style'] });
    }

    // Load initial data
    await loadAndRenderContainers();

    // Connect to SSE for real-time updates
    connectSSE();
});

async function loadAndRenderContainers() {
    const containers = await fetchContainers();
    window.currentContainers = containers;
    renderContainers(containers);
    
    // Populate logs container select
    const logsSelect = document.getElementById('logs-container-select');
    if (logsSelect) {
        logsSelect.innerHTML = '<option value="">Select a container...</option>' +
            containers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

async function loadAndRenderImages() {
    const images = await loadImages();
    renderImages(images);
}
