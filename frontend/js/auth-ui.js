window.addEventListener('DOMContentLoaded', function() {
    const user = localStorage.getItem('writelyUser');
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    const loginBtn = navActions.querySelector('.login-btn');
    let logoutBtn = navActions.querySelector('.logout-btn');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (!logoutBtn) {
            logoutBtn = document.createElement('a');
            logoutBtn.textContent = 'Logout';
            logoutBtn.className = 'logout-btn';
            logoutBtn.href = "#";
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                localStorage.removeItem('writelyUser');
                localStorage.removeItem('token'); // <-- Make sure to remove token as well!
                window.location.reload();
            };
            navActions.appendChild(logoutBtn);
        }
    } else {
        if (loginBtn) loginBtn.style.display = '';
        if (logoutBtn) logoutBtn.remove();
    }
});
