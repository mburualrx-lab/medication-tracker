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
        li.textContent = `💊 ${name} ${time}${dosage}`;
        medList.appendChild(li);
    });
}

async function refreshMeds() {
    const patientId = getActivePatientId();
    if (!patientId) return;

    displayMeds(getLocalMeds());

    try {
        const serverMeds = await loadPrescriptions(patientId);
        if (Array.isArray(serverMeds)) {
            saveLocalMeds(serverMeds);
            displayMeds(serverMeds);
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

function checkMedicationTimes() {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const meds = getLocalMeds();

    meds.forEach((med) => {
        const time = med.frequency || med.time || '';
        if (time.includes(currentTime)) {
            new Notification('Medication Reminder!', {
                body: `It's time to take your ${med.medication_name || med.name}.`,
                icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png'
            });
        }
    });
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
    setInterval(checkMedicationTimes, 60000);
    refreshMeds();
});