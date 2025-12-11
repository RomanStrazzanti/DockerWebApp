// UI utilities
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    toast.className = `${bgColor} text-white px-4 py-3 rounded mb-2 animate-pulse`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50';
    document.body.appendChild(container);
    return container;
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('[id$="-tab"]').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Highlight selected button
    const selectedBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (selectedBtn) {
        selectedBtn.classList.remove('bg-gray-200');
        selectedBtn.classList.add('bg-blue-600', 'text-white');
    }
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-tab');
    const selectFilter = document.getElementById('status-filter');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('bg-blue-600', 'text-white'));
            this.classList.add('bg-blue-600', 'text-white');
            
            const filter = this.dataset.filter;
            if (selectFilter) selectFilter.value = filter;
            applyFilter();
        });
    });

    if (selectFilter) {
        selectFilter.addEventListener('change', function() {
            filterBtns.forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                if (btn.dataset.filter === this.value) {
                    btn.classList.add('bg-blue-600', 'text-white');
                }
            });
            applyFilter();
        });
    }
}

function applyFilter() {
    const selectFilter = document.getElementById('status-filter');
    const filter = selectFilter ? selectFilter.value : 'all';
    const search = document.getElementById('search-input')?.value || '';
    
    // These functions should be called from the main app.js
    if (window.currentContainers) {
        renderContainers(window.currentContainers, filter, search);
    }
}
