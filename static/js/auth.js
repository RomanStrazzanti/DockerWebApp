// Authentication utilities
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

function displayUserInfo() {
    const userInfo = getUserInfo();
    const userDisplay = document.getElementById('user-display');
    if (userDisplay && userInfo) {
        userDisplay.textContent = userInfo.email;
    }
}
