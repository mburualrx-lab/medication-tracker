// 1. Load medications and ask for Notification Permission on startup
document.addEventListener('DOMContentLoaded', () => {
    displayMeds();
    requestNotificationPermission();
    // Check every 60 seconds if a medication is due
    setInterval(checkMedicationTimes, 60000); 
});

const medForm = document.getElementById('med-form');
medForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('med-name').value;
    const time = document.getElementById('med-time').value;
    
    const newMed = { name, time };
    
    let meds = localStorage.getItem('meds') ? JSON.parse(localStorage.getItem('meds')) : [];
    meds.push(newMed);
    localStorage.setItem('meds', JSON.stringify(meds));
    
    displayMeds();
    medForm.reset();
});

function displayMeds() {
    const medList = document.getElementById('med-list');
    medList.innerHTML = '';
    let meds = localStorage.getItem('meds') ? JSON.parse(localStorage.getItem('meds')) : [];
    
    meds.forEach((med) => {
        const li = document.createElement('li');
        li.textContent = `💊 ${med.name} at ${med.time}`;
        medList.appendChild(li);
    });
}

// 2. Ethical Consent: Explicitly ask the user if they want notifications
function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
}

// 3. Time Checker: Triggers a notification when the time matches
function checkMedicationTimes() {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    // Formats current time as "HH:MM" to match the input format
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let meds = localStorage.getItem('meds') ? JSON.parse(localStorage.getItem('meds')) : [];

    meds.forEach(med => {
        if (med.time === currentTime) {
            new Notification("Medication Reminder!", {
                body: `It's time to take your ${med.name}.`,
                icon: "https://cdn-icons-png.flaticon.com/512/822/822143.png" // Simple pill icon link
            });
        }
    });
}