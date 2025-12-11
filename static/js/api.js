// API wrapper with authentication
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        window.location.href = '/login';
        return null;
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
