// Server-Sent Events management
function connectSSE() {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
        console.log('SSE Connected');
    };

    eventSource.onmessage = (event) => {
        if (event.data === 'refresh' || event.data === 'ping') {
            refreshDashboard();
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        // Try reconnecting after 3 seconds
        setTimeout(connectSSE, 3000);
    };
}

async function refreshDashboard() {
    const containers = await fetchContainers();
    window.currentContainers = containers;
    applyFilter();
}

function notifyRefresh() {
    // This is called after operations to notify other clients via SSE
    // The server handles broadcasting via sseManager
}
