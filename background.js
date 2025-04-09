// Background Service Worker
let isWorking = true;
let remainingTime = 0;
let timerInterval = null;
let timerSettings = {
    workDuration: 25,
    breakDuration: 5
};


let keepAlive = setInterval(() => {
    console.log('Service Worker保持活跃');
}, 1000 * 20);



chrome.storage.local.get(['workDuration', 'breakDuration'], (settings) => {
    timerSettings = {
        workDuration: settings.workDuration || 25,
        breakDuration: settings.breakDuration || 5
    };
    remainingTime = timerSettings.workDuration * 60;
    updateBadge();
});


// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.action) {
        case 'startTimer':
            startTimer();
            break;

        case 'pauseTimer':
            pauseTimer();
            break;

        case 'resetTimer':
            resetTimer();
            break;

        case 'getStatus':
            sendResponse({
                isWorking,
                remaining: remainingTime,
                ...timerSettings
            });
            return true; // 保持异步通道
    }
});


// Alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'pomodoro') {
        remainingTime--;
        updateBadge();

        if (remainingTime <= 0) {
            await handleSessionEnd();
        } else {
            createAlarm();
        }
    }
});

// New session starter
function startNewSession() {
    chrome.storage.local.get(['workDuration', 'breakDuration'], (settings) => {
        timerSettings = {
            workDuration: settings.workDuration || 25,
            breakDuration: settings.breakDuration || 5
        };

        remainingTime = isWorking ?
            timerSettings.workDuration * 60 :
            timerSettings.breakDuration * 60;

        createAlarm();
        updateBadge();
    });
}

// Session end handler
async function handleSessionEnd() {
    chrome.alarms.clearAll();
    showCompletionNotification();

    // Switch mode
    isWorking = !isWorking;
    remainingTime = isWorking ?
        timerSettings.workDuration * 60 :
        timerSettings.breakDuration * 60;
}

// Notification with custom time
function showCompletionNotification() {
    const currentDuration = isWorking ?
        timerSettings.workDuration :
        timerSettings.breakDuration;

    const nextDuration = isWorking ?
        timerSettings.breakDuration :
        timerSettings.workDuration;

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png',
        title: `${isWorking ? 'Work' : 'Break'} Completed! (${currentDuration} mins)`,
        message: `Time for ${nextDuration} min ${isWorking ? 'break' : 'work'}!`,
        buttons: [
            { title: `Start ${isWorking ? 'Break' : 'Work'} ▶️` }
        ]
    });
}

// Reset timer
function resetTimer() {
    chrome.alarms.clearAll();
    isWorking = true;
    remainingTime = timerSettings.workDuration * 60;
    updateBadge();
}

// Helper functions
function createAlarm() {
    chrome.alarms.create('pomodoro', { delayInMinutes: 1/60 });
}

function updateBadge() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    chrome.action.setBadgeText({
        text: `${minutes}:${seconds.toString().padStart(2, '0')}`
    });
    chrome.action.setBadgeBackgroundColor({ color: isWorking ? '#e74c3c' : '#2ecc71' });
}

// Notification button handler
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        chrome.runtime.sendMessage({ action: 'startTimer' });
    }
});
