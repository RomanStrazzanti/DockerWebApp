// État global
let allContainers = [];
let allImages = [];
let currentFilter = 'all';
let searchQuery = '';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');

// Vérifier l'authentification
if (!token) {
    window.location.href = '/login';
}

// Afficher l'utilisateur
document.addEventListener('DOMContentLoaded', () => {
    const userEmail = document.getElementById('userEmail');
    if (user && user.email) {
        userEmail.textContent = user.email;
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Init app
    init();
});

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600'
    };

    toast.className = colors[type] + ' text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in';
    toast.textContent = message;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Fonction pour faire les appels API avec token
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: headers
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Logout
async function logout() {
    try {
        await apiCall('/api/auth/logout', { method: 'POST' });
    } catch (err) {}
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Gestion des onglets
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => {
                b.classList.remove('bg-blue-600');
                b.classList.add('bg-slate-700');
            });
            btn.classList.add('bg-blue-600');
            btn.classList.remove('bg-slate-700');
            
            const tabName = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            const selectedTab = document.getElementById(tabName + '-tab');
            if (selectedTab) {
                selectedTab.classList.remove('hidden');
                
                if (tabName === 'images') {
                    loadImages();
                } else if (tabName === 'audit') {
                    loadAuditLogs();
                }
            }
        });
    });
}

// ========== CONTENEURS ==========

async function fetchContainers() {
    try {
        const response = await apiCall('/api/containers');
        if (!response) return;
        
        const data = await response.json();
        allContainers = data;
        renderContainers();
        populateContainerSelect();
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
}

function renderContainers() {
    const list = document.getElementById('container-list');
    if (!list) return;
    
    let filtered = allContainers.filter(c => {
        const matchesFilter = currentFilter === 'all' || c.status === currentFilter;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    
    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-400 py-8">Aucun conteneur</p>';
        return;
    }
    
    list.innerHTML = filtered.map(c => {
        const statusColor = c.status === 'running' ? 'green' : 'red';
        return '<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">' +
            '<div class="flex items-center justify-between mb-2">' +
            '<div>' +
            '<h3 class="font-bold text-lg">' + escapeHtml(c.name) + '</h3>' +
            '<p class="text-slate-400 text-sm">' + escapeHtml(c.image) + '</p>' +
            '</div>' +
            '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-' + statusColor + '-900/40 text-' + statusColor + '-300">' + c.status + '</span>' +
            '</div>' +
            '<div class="flex gap-2 flex-wrap">' +
            (c.status === 'running' 
                ? '<button class="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm" onclick="stopContainer(\'' + c.id + '\')">Arrêter</button>' 
                : '<button class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm" onclick="startContainer(\'' + c.id + '\')">Démarrer</button>'
            ) +
            '<button class="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm" onclick="deleteContainer(\'' + c.id + '\')">Supprimer</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

function populateContainerSelect() {
    const select = document.getElementById('container-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Sélectionner un conteneur...</option>' +
        allContainers.map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
}

async function startContainer(id) {
    try {
        const response = await apiCall('/api/containers/' + id + '/start', { method: 'POST' });
        if (!response) return;
        
        const data = await response.json();
        if (data.success) {
            showToast('Conteneur démarré', 'success');
            fetchContainers();
            notifyRefresh();
        } else {
            showToast('Erreur: ' + (data.error || 'Inconnue'), 'error');
        }
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
}

async function stopContainer(id) {
    try {
        const response = await apiCall('/api/containers/' + id + '/stop', { method: 'POST' });
        if (!response) return;
        
        const data = await response.json();
        if (data.success) {
            showToast('Conteneur arrêté', 'success');
            fetchContainers();
            notifyRefresh();
        } else {
            showToast('Erreur: ' + (data.error || 'Inconnue'), 'error');
        }
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
}

async function deleteContainer(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce conteneur?')) return;
    
    try {
        const response = await apiCall('/api/containers/' + id, { method: 'DELETE' });
        if (!response) return;
        
        const data = await response.json();
        if (data.success) {
            showToast('Conteneur supprimé', 'success');
            fetchContainers();
            notifyRefresh();
        } else {
            showToast('Erreur: ' + (data.error || 'Inconnue'), 'error');
        }
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
}

// ========== CRÉATION CONTENEUR ==========

function setupCreateForm() {
    const form = document.getElementById('create-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const image = document.getElementById('image-input').value.trim();
        const name = document.getElementById('name-input').value.trim();
        
        if (!image) {
            showToast('Image requise', 'warning');
            return;
        }
        
        try {
            const response = await apiCall('/api/containers', {
                method: 'POST',
                body: JSON.stringify({ image, name: name || undefined })
            });
            
            if (!response) return;
            const data = await response.json();
            
            if (data.success || data.id) {
                showToast('Conteneur créé', 'success');
                form.reset();
                fetchContainers();
                notifyRefresh();
            } else {
                showToast('Erreur: ' + (data.error || 'Inconnue'), 'error');
            }
        } catch (err) {
            showToast('Erreur: ' + err.message, 'error');
        }
    });
}

// ========== FILTRES ==========

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-tab');
    const selectFilter = document.getElementById('status-filter');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('bg-blue-600'));
            btn.classList.add('bg-blue-600');
            
            currentFilter = btn.dataset.filter;
            if (selectFilter) selectFilter.value = currentFilter;
            renderContainers();
        });
    });
    
    if (selectFilter) {
        selectFilter.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            filterBtns.forEach(btn => {
                if (btn.dataset.filter === currentFilter) {
                    btn.classList.add('bg-blue-600');
                } else {
                    btn.classList.remove('bg-blue-600');
                }
            });
            renderContainers();
        });
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderContainers();
        });
    }
}

// ========== IMAGES ==========

async function loadImages() {
    try {
        const response = await apiCall('/api/images');
        if (!response) return;
        
        const data = await response.json();
        allImages = data;
        renderImages();
    } catch (err) {
        showToast('Erreur chargement images: ' + err.message, 'error');
    }
}

function renderImages() {
    const list = document.getElementById('images-list');
    if (!list) return;
    
    if (allImages.length === 0) {
        list.innerHTML = '<p class="text-center text-slate-400 py-8">Aucune image</p>';
        return;
    }
    
    list.innerHTML = allImages.map(img => {
        const tag = (img.tags && img.tags[0]) || '<none>';
        const sizeMB = (img.size / (1024 * 1024)).toFixed(2);
        
        return '<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">' +
            '<h3 class="font-bold text-lg break-words">' + escapeHtml(tag) + '</h3>' +
            '<p class="text-slate-400 text-sm">' + sizeMB + ' MB</p>' +
            '<div class="flex gap-2 mt-3">' +
            '<button class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm" onclick="deleteImage(\'' + img.id + '\')">Supprimer</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

async function deleteImage(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image?')) return;
    
    try {
        const response = await apiCall('/api/images/' + id, { method: 'DELETE' });
        if (!response) return;
        
        const data = await response.json();
        if (data.success) {
            showToast('Image supprimée', 'success');
            loadImages();
            notifyRefresh();
        } else {
            showToast('Erreur: ' + (data.error || 'Inconnue'), 'error');
        }
    } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
    }
}

// ========== AUDIT LOGS ==========

async function loadAuditLogs() {
    try {
        const response = await apiCall('/api/logs');
        if (!response) return;
        
        const data = await response.json();
        
        const auditList = document.getElementById('audit-list');
        if (!auditList) return;
        
        if (data.length === 0) {
            auditList.innerHTML = '<tr><td colspan="6" class="px-4 py-3 text-slate-400 text-center">Aucun log</td></tr>';
            return;
        }
        
        auditList.innerHTML = data.map(log => {
            const date = new Date(log.created_at).toLocaleString('fr-FR');
            
            return '<tr class="hover:bg-slate-800 transition">' +
                '<td class="px-4 py-2 text-slate-300">' + date + '</td>' +
                '<td class="px-4 py-2 text-blue-400 font-semibold">' + escapeHtml(log.action) + '</td>' +
                '<td class="px-4 py-2 text-slate-300">' + (log.container_id ? log.container_id.substring(0, 8) : '-') + '</td>' +
                '<td class="px-4 py-2 text-slate-300">' + (log.image_name || '-') + '</td>' +
                '<td class="px-4 py-2 text-slate-400 text-xs">' + (log.ip_address || '-') + '</td>' +
                '<td class="px-4 py-2 text-slate-400 text-xs">' + (log.details || '-') + '</td>' +
                '</tr>';
        }).join('');
    } catch (err) {
        showToast('Erreur audit: ' + err.message, 'error');
    }
}

// ========== LOGS & STATS ==========

function setupLogsAndStats() {
    const select = document.getElementById('container-select');
    if (select) {
        select.addEventListener('change', (e) => {
            const id = e.target.value;
            if (id) {
                loadLogs(id);
                loadStats(id);
            }
        });
    }
}

async function loadLogs(containerId) {
    try {
        const response = await apiCall('/api/containers/' + containerId + '/logs');
        if (!response) return;
        
        const data = await response.json();
        
        const logsDiv = document.getElementById('logs-container');
        if (!logsDiv) return;
        
        const logs = Array.isArray(data.logs) ? data.logs : data.logs.split('\n');
        logsDiv.innerHTML = logs.slice(-100).map(log => '<div class="font-mono text-sm">' + escapeHtml(log || ' ') + '</div>').join('');
        logsDiv.scrollTop = logsDiv.scrollHeight;
    } catch (err) {
        showToast('Erreur logs: ' + err.message, 'error');
    }
}

async function loadStats(containerId) {
    try {
        const response = await apiCall('/api/containers/' + containerId + '/stats');
        if (!response) return;
        
        const data = await response.json();
        
        const statsDiv = document.getElementById('stats-container');
        if (!statsDiv) return;
        
        const cpu = !isNaN(parseFloat(data.cpu)) ? parseFloat(data.cpu).toFixed(2) : '0';
        const memory = !isNaN(parseFloat(data.memory)) ? parseFloat(data.memory).toFixed(2) : '0';
        const memoryUsed = !isNaN(parseFloat(data.memoryUsage)) ? parseFloat(data.memoryUsage).toFixed(2) : '0';
        const memoryLimit = !isNaN(parseFloat(data.memoryLimit)) ? parseFloat(data.memoryLimit).toFixed(2) : '0';
        
        statsDiv.innerHTML = '<div class="space-y-3">' +
            '<div class="bg-blue-900/30 border border-blue-500 rounded p-3">' +
            '<p class="text-blue-300 text-sm">CPU</p>' +
            '<p class="text-2xl font-bold text-blue-400">' + cpu + '%</p>' +
            '</div>' +
            '<div class="bg-purple-900/30 border border-purple-500 rounded p-3">' +
            '<p class="text-purple-300 text-sm">RAM</p>' +
            '<p class="text-2xl font-bold text-purple-400">' + memory + '%</p>' +
            '<p class="text-xs text-slate-400">' + memoryUsed + ' / ' + memoryLimit + ' MB</p>' +
            '</div>' +
            '</div>';
        
        // Auto-refresh stats toutes les 5 secondes
        setTimeout(() => loadStats(containerId), 5000);
    } catch (err) {
        showToast('Erreur stats: ' + err.message, 'error');
    }
}

// ========== SSE CONNECTION ==========

function connectSSE() {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
        if (event.data === 'refresh' || event.data === 'ping') {
            console.log('SSE refresh signal');
        }
    };
    
    eventSource.onerror = () => {
        eventSource.close();
        setTimeout(connectSSE, 5000);
    };
}

function notifyRefresh() {
    // Notification envoyée, serveur broadcast aux autres clients
}

// ========== UTILS ==========

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== INIT ==========

function init() {
    setupTabs();
    setupCreateForm();
    setupFilters();
    setupLogsAndStats();
    
    fetchContainers();
    connectSSE();
}
