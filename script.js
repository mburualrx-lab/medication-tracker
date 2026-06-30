function getLocalMeds() {
    try {
        const savedMeds = localStorage.getItem('meds');
        return savedMeds ? JSON.parse(savedMeds) : [];
    } catch (error) {
        return [];
    }
}

function saveLocalMeds(meds) {
    localStorage.setItem('meds', JSON.stringify(meds));
}

let reminderTimers = [];

function clearReminderTimers() {
    reminderTimers.forEach((timerId) => clearTimeout(timerId));
    reminderTimers = [];
}

function parseMedicationTime(med) {
    const directTime = med.time || '';
    if (/^\d{1,2}:\d{2}$/.test(directTime)) {
        return directTime;
    }

    const frequencyText = med.frequency || '';
    const match = frequencyText.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
    }

    return null;
}

function scheduleMedicationReminders(meds = getLocalMeds()) {
    clearReminderTimers();

    if (!Array.isArray(meds)) return;

    meds.forEach((med) => {
        const targetTime = parseMedicationTime(med);
        if (!targetTime) return;

        const [hours, minutes] = targetTime.split(':').map(Number);
        const now = new Date();
        const nextReminderTime = new Date(now);
        nextReminderTime.setHours(hours, minutes, 0, 0);

        if (nextReminderTime <= now) {
            nextReminderTime.setDate(nextReminderTime.getDate() + 1);
        }

        const delay = nextReminderTime.getTime() - now.getTime();
        const timerId = window.setTimeout(() => {
            if (Notification.permission === 'granted') {
                new Notification('Medication Reminder!', {
                    body: `It's time to take your ${med.medication_name || med.name}.`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png'
                });
            }
            scheduleMedicationReminders(meds);
        }, delay);

        reminderTimers.push(timerId);
    });
}

function displayMeds(meds = null) {
    const medList = document.getElementById('med-list');
    if (!medList) return;

    medList.innerHTML = '';
    const medicationList = Array.isArray(meds) ? meds : getLocalMeds();

    if (!medicationList.length) {
        const emptyState = document.createElement('li');
        emptyState.textContent = 'No medications yet. Add one to get started.';
        medList.appendChild(emptyState);
        return;
    }

    medicationList.forEach((med) => {
        const li = document.createElement('li');
        const name = med.medication_name || med.name || 'Medication';
        const time = med.frequency || med.time || 'scheduled';
        const dosage = med.dosage ? ` • ${med.dosage}` : '';
        li.innerHTML = `💊 <strong>${name}</strong><br><span>${time}${dosage}</span>`;
        medList.appendChild(li);
    });
}

async function refreshMeds() {
    const patientId = getActivePatientId();
    if (!patientId) return;

    const localMeds = getLocalMeds();
    displayMeds(localMeds);
    scheduleMedicationReminders(localMeds);

    try {
        const serverMeds = await loadPrescriptions(patientId);
        if (Array.isArray(serverMeds)) {
            saveLocalMeds(serverMeds);
            displayMeds(serverMeds);
            scheduleMedicationReminders(serverMeds);
        }
    } catch (error) {
        console.warn('Backend sync failed:', error);
    }
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authUser = getAuthUser();
    if (!authUser || authUser.role !== 'user') {
        window.location.href = 'index.html';
        return;
    }

    const medForm = document.getElementById('med-form');
    if (medForm) {
        medForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('med-name').value.trim();
            const time = document.getElementById('med-time').value;
            const patientId = getActivePatientId();

            if (!name || !time || !patientId) return;

            try {
                await submitPrescription({
                    patientId,
                    medicationName: name,
                    dosage: 'As scheduled',
                    frequency: `At ${time}`,
                    doctorName: authUser.name
                });

                await refreshMeds();
                medForm.reset();
                const status = document.getElementById('sync-status');
                if (status) {
                    status.textContent = 'Medication synced to the backend.';
                    status.className = 'auth-message success';
                }
            } catch (error) {
                const status = document.getElementById('sync-status');
                if (status) {
                    status.textContent = error.message || 'Could not sync medication.';
                    status.className = 'auth-message error';
                }
            }
        });
    }

    displayMeds(getLocalMeds());
    requestNotificationPermission();
    scheduleMedicationReminders(getLocalMeds());
    refreshMeds();
});