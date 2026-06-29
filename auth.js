const accounts = [
    { role: 'user', email: 'user@example.com', password: 'user123', name: 'Patient User' },
    { role: 'doctor', email: 'doctor@example.com', password: 'doctor123', name: 'Dr. Jane Doe' }
];

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function showAuthMessage(message, isError = true) {
    const element = document.getElementById('auth-message');
    if (!element) return;
    element.textContent = message;
    element.className = isError ? 'auth-message error' : 'auth-message success';
}

function login(event) {
    if (event) {
        event.preventDefault();
    }

    const roleElement = document.getElementById('role');
    const role = roleElement ? roleElement.value : 'user';
    const email = normalizeEmail(document.getElementById('email').value);
    const password = document.getElementById('password').value;

    const account = accounts.find(user => user.role === role && user.email === email && user.password === password);

    if (!account) {
        showAuthMessage('Invalid credentials for selected role.', true);
        return;
    }

    const authUser = {
        role: account.role,
        email: account.email,
        name: account.name,
        loggedAt: Date.now()
    };

    localStorage.setItem('medAuthUser', JSON.stringify(authUser));
    window.location.href = account.role === 'doctor' ? 'doctor.html' : 'med.html';
}

function getAuthUser() {
    try {
        return JSON.parse(localStorage.getItem('medAuthUser'));
    } catch (error) {
        return null;
    }
}

function requireAuth(expectedRole) {
    const user = getAuthUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    if (expectedRole && user.role !== expectedRole) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

function redirectIfAuthenticated() {
    const user = getAuthUser();
    if (!user) return;
    window.location.href = user.role === 'doctor' ? 'doctor.html' : 'med.html';
}

function injectUserName(selector) {
    const user = getAuthUser();
    const element = document.querySelector(selector);
    if (user && element) {
        element.textContent = user.name;
    }
}

function logout() {
    localStorage.removeItem('medAuthUser');
    window.location.href = 'index.html';
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', login);
        }
    });
}
