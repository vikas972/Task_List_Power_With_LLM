document.addEventListener('DOMContentLoaded', function() {
    const taskList = document.getElementById('taskList');
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const startTimerButton = document.getElementById('startTimerButton');
    const stopTimerButton = document.getElementById('stopTimerButton');
    const minutesSpan = document.getElementById('minutes');
    const secondsSpan = document.getElementById('seconds');
    const completedCount = document.getElementById('completedCount');
    const incompleteCount = document.getElementById('incompleteCount');

    let tasks = [];
    let timeLeft = 25 * 60;
    let isTimerRunning = false;
    let timerInterval;

    // Load tasks from storage
    chrome.storage.sync.get('tasks', (data) => {
        if (data.tasks) {
            tasks = data.tasks;
            updateTaskList();
        }
    });

    // Load timer state from background script
    chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
        if (response.isRunning) {
            startTimer(response.timeLeft);
        }
    });




    addTaskButton.addEventListener('click', addTask);
    startTimerButton.addEventListener('click', () => startTimer(timeLeft));
    stopTimerButton.addEventListener('click', stopTimer);

    function updateTaskList() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.classList.toggle('editMode', task.editMode);

            const view = document.createElement('div');
            view.className = 'view';
            view.textContent = task.name;
            view.addEventListener('click', () => toggleEditMode(index));

            const edit = document.createElement('input');
            edit.className = 'edit';
            edit.type = 'text';
            edit.value = task.name;
            edit.addEventListener('blur', () => saveTask(index, edit.value));

            const completeButton = document.createElement('button');
            completeButton.textContent = 'Complete';
            completeButton.addEventListener('click', () => completeTask(index));

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTask(index));

            li.appendChild(view);
            li.appendChild(edit);
            li.appendChild(completeButton);
            li.appendChild(deleteButton);

            taskList.appendChild(li);
        });
        updateTaskSummary();
    }

    function completeTask(index) {
        tasks[index].completed = true;
        updateTaskList();
        saveTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        updateTaskList();
        saveTasks();
    }

    function toggleEditMode(index) {
        tasks[index].editMode = !tasks[index].editMode;
        updateTaskList();
    }

    function saveTask(index, newName) {
        tasks[index].name = newName;
        tasks[index].editMode = false;
        updateTaskList();
        saveTasks();
    }

    function addTask() {
        const taskName = taskInput.value;
        if (taskName) {
            tasks.push({ name: taskName, completed: false, editMode: false });
            taskInput.value = '';
            updateTaskList();
            saveTasks();
        }
    }

    function updateTaskSummary() {
        const completedTasks = tasks.filter(task => task.completed).length;
        const incompleteTasks = tasks.length - completedTasks;
        completedCount.textContent = completedTasks;
        incompleteCount.textContent = incompleteTasks;
    }

    function startTimer(duration) {
        if (isTimerRunning) return;
        isTimerRunning = true;
        timeLeft = duration;
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            minutesSpan.textContent = String(minutes).padStart(2, '0');
            secondsSpan.textContent = String(seconds).padStart(2, '0');
            chrome.runtime.sendMessage({ action: 'updateTimer', timeLeft, isRunning: isTimerRunning });
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                chrome.runtime.sendMessage({ action: 'timerEnded' });
                notifyTimerEnd();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        chrome.runtime.sendMessage({ action: 'updateTimer', timeLeft, isRunning: isTimerRunning });
    }

    function notifyTimerEnd() {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../images/icon128.png',
            title: 'Pomodoro Timer',
            message: 'Time is up! Take a break or start a new session.',
            priority: 2
        });
    }

    async function sendToLLM() {
        const taskTexts = tasks.map(task => task.name).join("\n");
        const userInput = document.getElementById('userInput').value;
        const prompt = `Here is a list of tasks:\n${taskTexts}\nUser input: ${userInput}\nHow can I optimize this list to achieve maximum productivity?`;

        chrome.storage.local.get(['hf_api_token', 'model_name'], async function(result) {
            const apiToken = result.hf_api_token;
            const modelName = result.model_name;
            if (!apiToken || !modelName) {
                alert('API token or model name is not set.');
                return;
            }
            try {
                const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: prompt
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    displayOptimizedTasks(data[0].generated_text);
                } else {
                    console.error('Error optimizing tasks:', data);
                    alert('Error optimizing tasks. Check console for details.');
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('Network error. Check console for details.');
            }
        });
    }

    function displayOptimizedTasks(optimizedText) {
        const optimizedTasksOutput = document.getElementById('optimizedTasksOutput');
        optimizedTasksOutput.innerHTML = `<p>Optimized Task List:</p><pre>${optimizedText}</pre>`;
    }

    let sendToLLMButton = document.getElementById('sendToLLMButton');
    sendToLLMButton.addEventListener('click', sendToLLM);

    function saveTasks() {
        chrome.storage.sync.set({ tasks });
    }
});
