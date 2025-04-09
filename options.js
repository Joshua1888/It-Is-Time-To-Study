document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('save-settings').addEventListener('click', saveSettings);

function loadSettings() {
    chrome.storage.local.get({
        workDuration: 25,
        breakDuration: 5
    }, ({ workDuration, breakDuration }) => {
        document.getElementById('work-time').value = workDuration;
        document.getElementById('break-time').value = breakDuration;
    });
}

function saveSettings() {
    const workDuration = parseInt(document.getElementById('work-time').value);
    const breakDuration = parseInt(document.getElementById('break-time').value);

    chrome.storage.local.set({ workDuration, breakDuration }, () => {
        alert('Settings saved successfully!');
        window.close();
    });
}
