// Background service worker
let isWorking = true;
let remainingTime = 25 * 60;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTimer') {
        createAlarm();
    } else if (request.action === 'resetTimer') {
        chrome.alarms.clearAll();
        isWorking = !isWorking;
        remainingTime = isWorking ? 25 * 60 : 5 * 60;
        updateBadge();
    }
});

function createAlarm() {
    chrome.alarms.create('pomodoro', {
        delayInMinutes: 1/60
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoro') {
        remainingTime--;
        updateBadge();

        if (remainingTime <= 0) {
            showNotification();
            chrome.alarms.clearAll();
            remainingTime = isWorking ? 5 * 60 : 25 * 60;
            isWorking = !isWorking;
        } else {
            createAlarm();
        }
    }
});

function updateBadge() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    chrome.action.setBadgeText({
        text: `${minutes}:${seconds.toString().padStart(2, '0')}`
    });
}

function showNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png',
        title: isWorking ? 'Break Time!' : 'Work Time!',
        message: isWorking ?
            '25-minute work session completed. Take a 5-minute break.' :
            'Break finished. Time to focus!'
    });
}
