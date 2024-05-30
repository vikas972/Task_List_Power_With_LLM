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
