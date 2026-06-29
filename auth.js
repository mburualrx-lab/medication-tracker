const accounts = [
    { role: 'user', email: 'user@example.com', password: 'user123', name: 'Patient User' },
    { role: 'doctor', email: 'doctor@example.com', password: 'doctor123', name: 'Dr. Jane Doe' }
];

function loadAccounts() {
    try {
        const savedAccounts = JSON.parse(localStorage.getItem('medAccounts')) || [];
        return [...accounts, ...savedAccounts];
    } catch (error) {
        return accounts;
    }
}

function saveAccount(account) {
    const savedAccounts = JSON.parse(localStorage.getItem('medAccounts')) || [];
    savedAccounts.push(account);
    localStorage.setItem('medAccounts', JSON.stringify(savedAccounts));
}

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
    const role = roleElement ? roleElement.value : '';
    const email = normalizeEmail(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value.trim();

    const allAccounts = loadAccounts();
    let account = allAccounts.find(user => user.role === role && user.email === email && user.password === password);

    if (!account) {
        account = allAccounts.find(user => user.email === email && user.password === password);
    }

    if (!account) {
        showAuthMessage('Invalid credentials. Please use one of the sample accounts or create a new account.', true);
        return;
    }

    if (!account.name && name) {
        account.name = name;
    }

    const authUser = {
        role: account.role,
        email: account.email,
        name: account.name,
        patientId: account.role === 'user' ? 1 : 2,
        loggedAt: Date.now()
    };

    localStorage.setItem('medAuthUser', JSON.stringify(authUser));
    window.location.href = account.role === 'doctor' ? 'doctor.html' : 'med.html';
}

function register(event) {
    if (event) {
        event.preventDefault();
    }

    const role = document.getElementById('register-role').value;
    const name = document.getElementById('register-name').value.trim();
    const email = normalizeEmail(document.getElementById('register-email').value);
    const password = document.getElementById('register-password').value;

    if (!name || !email || !password) {
        showAuthMessage('Please fill in all registration fields.', true);
        return;
    }

    const existingAccount = loadAccounts().find(user => user.email === email);
    if (existingAccount) {
        showAuthMessage('An account with that email already exists.', true);
        return;
    }

    const newAccount = {
        role,
        email,
        password,
        name
    };

    saveAccount(newAccount);
    showAuthMessage(`Account created for ${name}. You can now log in.`, false);
    document.getElementById('register-form').reset();
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

function getApiBaseUrl() {
    return 'http://127.0.0.1:8000';
}

function getActivePatientId() {
    const user = getAuthUser();
    if (!user) return null;
    return user.patientId ?? (user.role === 'doctor' ? 0 : 1);
}

async function loadPrescriptions(patientId) {
    const response = await fetch(`${getApiBaseUrl()}/api/medications/${patientId}`);
    if (!response.ok) {
        throw new Error('Unable to load prescriptions from the backend.');
    }
    return response.json();
}

async function submitPrescription({ patientId, medicationName, dosage, frequency, doctorName }) {
    const response = await fetch(`${getApiBaseUrl()}/api/prescribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patient_id: Number(patientId),
            doctor_name: doctorName || 'Doctor',
            medication_name: medicationName,
            dosage,
            frequency
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to save the prescription.');
    }

    return response.json();
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', login);
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', register);
        }
    });
}
