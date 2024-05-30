document.addEventListener('DOMContentLoaded', function() {
    const timerElement = document.createElement('div');
    timerElement.id = 'pomodoro-timer';
    document.body.appendChild(timerElement);

    let timeLeft = 0;
    let isTimerRunning = false;

    chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
        timeLeft = response.timeLeft;
        isTimerRunning = response.isRunning;
        updateTimerDisplay();
        if (isTimerRunning) {
            startTimerInterval();
        }
    });

    function startTimerInterval() {
        setInterval(() => {
            if (isTimerRunning) {
                timeLeft--;
                updateTimerDisplay();
                chrome.runtime.sendMessage({ action: 'updateTimer', timeLeft, isRunning: isTimerRunning });
                if (timeLeft <= 0) {
                    isTimerRunning = false;
                    chrome.runtime.sendMessage({ action: 'timerEnded' });
                }
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
});
