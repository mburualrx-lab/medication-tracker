const accounts = [
    { role: 'doctor', email: 'doctor@example.com', password: 'doctor123', name: 'Dr. Jane Doe' },
    { role: 'doctor', email: 'doctor2@example.com', password: 'doctor456', name: 'Dr. Sam Green' },
    { role: 'nurse', email: 'nurse@example.com', password: 'nurse123', name: 'Nurse Joy' }
];

const patients = [
    { id: 1, name: 'Patient User' },
    { id: 2, name: 'Patient Two' },
    { id: 3, name: 'Patient Three' }
];

const defaultDoctorPatientAssignments = {
    'doctor@example.com': [1],
    'doctor2@example.com': []
};

function loadDoctorPatientAssignments() {
    try {
        const data = JSON.parse(localStorage.getItem('doctorPatientAssignments'));
        return data && typeof data === 'object' ? data : defaultDoctorPatientAssignments;
    } catch (error) {
        return defaultDoctorPatientAssignments;
    }
}

function saveDoctorPatientAssignments(assignments) {
    localStorage.setItem('doctorPatientAssignments', JSON.stringify(assignments));
}

function getAssignedPatients(doctorEmail) {
    const assignments = loadDoctorPatientAssignments();
    const assignedIds = assignments[doctorEmail] || [];
    return getPatients().filter((patient) => assignedIds.includes(patient.id));
}

function getPatientAssignment(patientId) {
    const assignments = loadDoctorPatientAssignments();
    const id = Number(patientId);
    for (const [doctorEmail, patientIds] of Object.entries(assignments)) {
        if (patientIds.includes(id)) {
            return doctorEmail;
        }
    }
    return null;
}

function assignPatientToDoctor(patientId, doctorEmail) {
    const assignments = loadDoctorPatientAssignments();
    const id = Number(patientId);

    Object.keys(assignments).forEach((email) => {
        assignments[email] = assignments[email].filter((existingId) => existingId !== id);
    });

    if (doctorEmail) {
        if (!assignments[doctorEmail]) {
            assignments[doctorEmail] = [];
        }
        if (!assignments[doctorEmail].includes(id)) {
            assignments[doctorEmail].push(id);
        }
    }

    saveDoctorPatientAssignments(assignments);
    return assignments;
}

function getDoctors() {
    return loadAccounts().filter((user) => user.role === 'doctor');
}

function loadPatients() {
    try {
        return JSON.parse(localStorage.getItem('medPatients')) || [];
    } catch (error) {
        return [];
    }
}

function savePatients(patientList) {
    localStorage.setItem('medPatients', JSON.stringify(patientList));
}

function getPatients() {
    const stored = loadPatients();
    const defaultIds = new Set(patients.map((p) => p.id));
    const combined = [...patients];
    for (const patient of stored) {
        if (!defaultIds.has(patient.id)) {
            combined.push(patient);
        }
    }
    return combined;
}

function createPatient(name) {
    const allPatients = getPatients();
    const nextId = Math.max(...allPatients.map((patient) => patient.id), 0) + 1;
    const newPatient = { id: nextId, name };
    const patientList = loadPatients();
    patientList.push(newPatient);
    savePatients(patientList);
    return newPatient;
}

function getPatientDisplayName(patientId) {
    const patient = getPatients().find((p) => p.id === Number(patientId));
    return patient ? `${patient.name} (#${patient.id})` : `Patient ${patientId}`;
}

function getDoctorDisplayName(email) {
    const doctor = getDoctors().find((doc) => doc.email === email);
    return doctor ? `${doctor.name} (${doctor.email})` : 'Unassigned';
}

function getDoctorAvailability(email) {
    const assignments = loadDoctorPatientAssignments();
    const assignedCount = (assignments[email] || []).length;
    return assignedCount < 4;
}

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

function showPageStatus(message, isError = true, elementId = 'page-status') {
    const element = document.getElementById(elementId);
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
    const remember = document.getElementById('remember-me')?.checked;

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

    persistAuthUser(authUser, remember);
    window.location.href = account.role === 'doctor'
        ? 'doctor.html'
        : account.role === 'nurse'
        ? 'nurse.html'
        : 'med.html';
}

function register(event) {
    if (event) {
        event.preventDefault();
    }

    const role = document.getElementById('register-role').value;
    const name = document.getElementById('register-name').value.trim();
    const email = normalizeEmail(document.getElementById('register-email').value);
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (!name || !email || !password || !confirmPassword) {
        showAuthMessage('Please fill in all registration fields.', true);
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match. Please confirm your password.', true);
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

function persistAuthUser(authUser, remember = false) {
    sessionStorage.removeItem('medAuthUser');
    localStorage.removeItem('medAuthUser');

    if (remember) {
        localStorage.setItem('medAuthUser', JSON.stringify(authUser));
    } else {
        sessionStorage.setItem('medAuthUser', JSON.stringify(authUser));
    }
}

function getAuthUser() {
    try {
        return JSON.parse(localStorage.getItem('medAuthUser')) || JSON.parse(sessionStorage.getItem('medAuthUser'));
    } catch (error) {
        return null;
    }
}

function requireAuth(expectedRole) {
    const user = getAuthUser();
    if (!user) {
        showPageStatus('Please sign in first to access this page.', true);
        return null;
    }
    if (expectedRole && user.role !== expectedRole) {
        showPageStatus('This page is for the other role. Use the navigation links below.', true);
        return null;
    }
    return user;
}

function redirectIfAuthenticated() {
    const user = getAuthUser();
    if (!user) return false;

    const message = document.getElementById('auth-message');
    if (message) {
        message.textContent = `You are already signed in as ${user.name}.`;
        message.className = 'auth-message success';
    }

    const infoCard = document.querySelector('.info-card');
    if (infoCard && !document.getElementById('auth-links')) {
        const links = document.createElement('p');
        links.id = 'auth-links';
        links.innerHTML = `<a href="med.html">Open patient page</a> · <a href="doctor.html">Open doctor page</a>`;
        infoCard.appendChild(links);
    }

    return true;
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
    sessionStorage.removeItem('medAuthUser');
    window.location.href = 'index.html';
}

function ensureRolePageAccess(expectedRole) {
    const user = getAuthUser();
    if (!user) {
        showPageStatus('Please sign in first to access this page.', true);
        return false;
    }
    if (user.role !== expectedRole) {
        showPageStatus('This page is for the other role. Use the back link below to return.', true);
        return false;
    }
    return true;
}

function getApiBaseUrl() {
    return 'http://127.0.0.1:8000';
}

function getActivePatientId() {
    const user = getAuthUser();
    if (!user) return null;
    return user.patientId ?? (user.role === 'doctor' ? 0 : 1);
}

function getStoredPrescriptions() {
    try {
        return JSON.parse(localStorage.getItem('medPrescriptions')) || [];
    } catch (error) {
        return [];
    }
}

function saveStoredPrescriptions(prescriptions) {
    localStorage.setItem('medPrescriptions', JSON.stringify(prescriptions));
}

function addStoredPrescription(prescription) {
    const prescriptions = getStoredPrescriptions();
    prescriptions.push(prescription);
    saveStoredPrescriptions(prescriptions);
    return prescriptions;
}

function matchesDoctor(prescription, doctorEmail = null, doctorName = null) {
    if (!doctorEmail && !doctorName) {
        return true;
    }

    const emailMatch = doctorEmail && prescription.doctor_email === doctorEmail;
    const nameMatch = doctorName && prescription.doctor_name === doctorName;
    return Boolean(emailMatch || nameMatch);
}

async function loadPrescriptions(patientId, doctorEmail = null, doctorName = null) {
    const allPatientPrescriptions = getStoredPrescriptions().filter((item) => String(item.patient_id) === String(patientId));
    const filtered = (doctorEmail || doctorName)
        ? allPatientPrescriptions.filter((item) => matchesDoctor(item, doctorEmail, doctorName))
        : allPatientPrescriptions;

    if (allPatientPrescriptions.length) {
        return filtered;
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/medications/${patientId}`);
        if (!response.ok) {
            throw new Error('Unable to load prescriptions from the backend.');
        }
        const backendPrescriptions = await response.json();
        saveStoredPrescriptions(backendPrescriptions);
        return (doctorEmail || doctorName)
            ? backendPrescriptions.filter((item) => String(item.patient_id) === String(patientId) && matchesDoctor(item, doctorEmail, doctorName))
            : backendPrescriptions.filter((item) => String(item.patient_id) === String(patientId));
    } catch (error) {
        return [];
    }
}

async function submitPrescription({ patientId, medicationName, dosage, frequency, doctorName, doctorEmail }) {
    const prescription = {
        patient_id: Number(patientId),
        doctor_name: doctorName || 'Doctor',
        doctor_email: doctorEmail || '',
        medication_name: medicationName,
        dosage,
        frequency,
        time: frequency.includes(':') ? frequency : `At ${frequency}`
    };

    addStoredPrescription(prescription);

    try {
        const response = await fetch(`${getApiBaseUrl()}/api/prescribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescription)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Unable to save the prescription.');
        }

        return response.json();
    } catch (error) {
        return { status: 'saved-locally', message: 'Saved locally while backend is unavailable.' };
    }
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

        document.querySelectorAll('.password-toggle').forEach((button) => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);
                if (!input) return;

                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                button.textContent = isHidden ? '🙈' : '👁️';
                button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
            });
        });
    });
}
