let timerState = {
    isRunning: false,
    timeLeft: 25 * 60
};


chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ tasks: [] });
    chrome.contextMenus.create({
        id: 'addTask',
        title: 'Add Task',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'addTask') {
        chrome.storage.sync.get('tasks', (data) => {
            const tasks = data.tasks || [];
            tasks.push({ name: info.selectionText, completed: false, editMode: false });
            chrome.storage.sync.set({ tasks });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateTimer') {
        timerState.isRunning = request.isRunning;
        timerState.timeLeft = request.timeLeft;
        sendResponse({ status: 'timer updated' });
    } else if (request.action === 'getTimerState') {
        sendResponse(timerState);
    } else if (request.action === 'timerEnded') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../images/icon128.png',
            title: 'Pomodoro Timer',
            message: 'Time is up! Take a break or start a new session.',
            priority: 2
        });
    }
    return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroTimer') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../images/icon128.png',
            title: 'Pomodoro Timer',
            message: 'Time is up! Take a break or start a new session.',
            priority: 2
        });
    }
});

// Handle task synchronization
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.tasks) {
        updateTaskLists(changes.tasks.newValue);
    }
});

function updateTaskLists(tasks) {
    // Implement your task update logic here
}

// Function to export data
function exportData(format) {
    chrome.storage.sync.get('tasks', (data) => {
        const tasks = data.tasks || [];
        let exportedData = '';
        if (format === 'csv') {
            exportedData = tasks.map(task => `${task.name},${task.completed}`).join('\n');
        } else if (format === 'json') {
            exportedData = JSON.stringify(tasks, null, 2);
        }
        downloadFile(exportedData, `tasks.${format}`);
    });
}

function downloadFile(data, filename) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename, saveAs: true });
}

// Listen for messages to trigger export
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'exportData') {
        exportData(request.format);
    }
    sendResponse({ status: 'done' });
});
