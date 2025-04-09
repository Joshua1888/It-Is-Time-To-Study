// 初始化加载任务
document.addEventListener('DOMContentLoaded', loadTasks);

// 添加任务
document.getElementById('add-btn').addEventListener('click', addTask);

// 数据结构示例
const Task = {
    id: Date.now(),
    text: '学习JavaScript',
    completed: false,
    timestamp: Date.now()
};

// 添加任务函数
function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();

    if (text) {
        chrome.storage.local.get({ tasks: [] }, ({ tasks }) => {
            const newTask = {
                id: Date.now(),
                text: text,
                completed: false,
                timestamp: Date.now()
            };

            tasks.push(newTask);
            chrome.storage.local.set({ tasks }, () => {
                input.value = '';
                renderTasks(tasks);
            });
        });
    }
}

// 渲染任务列表
function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
      <span style="${task.completed ? 'text-decoration: line-through' : ''}">${task.text}</span>
      <button class="delete-btn" data-id="${task.id}">DELETE</button>
    `;

        // 添加事件监听
        li.querySelector('input').addEventListener('change', toggleTask);
        li.querySelector('.delete-btn').addEventListener('click', deleteTask);

        list.appendChild(li);
    });
}

// 加载任务
function loadTasks() {
    chrome.storage.local.get({ tasks: [] }, ({ tasks }) => {
        renderTasks(tasks);
    });
}

// 切换任务状态
function toggleTask(e) {
    const taskId = Number(e.target.dataset.id);
    chrome.storage.local.get({ tasks: [] }, ({ tasks }) => {
        const updatedTasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        chrome.storage.local.set({ tasks: updatedTasks }, () => renderTasks(updatedTasks));
    });
}

// 删除任务
function deleteTask(e) {
    const taskId = Number(e.target.dataset.id);
    chrome.storage.local.get({ tasks: [] }, ({ tasks }) => {
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        chrome.storage.local.set({ tasks: filteredTasks }, () => renderTasks(filteredTasks));
    });
}



// Timer functionality
let timerId = null;
let isPaused = false;
let endTime = null;
let currentMode = 'focus';

// Timer functions
function startTimer(duration, mode) {
    clearInterval(timerId);
    currentMode = mode;
    timeLeft = duration * 60;
    endTime = Date.now() + timeLeft * 1000;

    chrome.storage.local.set({
        timer: {
            endTime,
            mode,
            paused: false
        }
    });

    timerId = setInterval(updateTimer, 1000);
    updateDisplay();
}

function updateTimer() {
    const currentTime = Date.now();
    timeLeft = Math.round((endTime - currentTime) / 1000);

    if (timeLeft <= 0) {
        clearInterval(timerId);
        notifyCompletion();
        if (currentMode === 'focus') {
            startTimer(5, 'break');
        } else {
            startTimer(25, 'focus');
        }
        return;
    }

    chrome.storage.local.set({
        timer: {
            endTime,
            mode: currentMode,
            paused: false
        }
    });

    updateDisplay();
}

function togglePause() {
    isPaused = !isPaused;
    const button = document.getElementById('pause-resume');

    if (isPaused) {
        clearInterval(timerId);
        button.textContent = 'Resume';
        chrome.storage.local.set({ timer: { endTime, mode: currentMode, paused: true } });
    } else {
        endTime = Date.now() + timeLeft * 1000;
        timerId = setInterval(updateTimer, 1000);
        button.textContent = 'Pause';
        chrome.storage.local.set({ timer: { endTime, mode: currentMode, paused: false } });
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
}

function notifyCompletion() {
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png',
        title: `Time's up!`,
        message: `${currentMode === 'focus' ? 'Take a break!' : 'Time to focus!'}`
    });
}

// Load saved timer
chrome.storage.local.get(['timer'], ({ timer }) => {
    if (timer) {
        const remaining = Math.round((timer.endTime - Date.now()) / 1000);
        if (remaining > 0) {
            timeLeft = remaining;
            endTime = timer.endTime;
            currentMode = timer.mode;
            isPaused = timer.paused;

            if (!isPaused) {
                startTimer(timeLeft / 60, currentMode);
            } else {
                updateDisplay();
                document.getElementById('pause-resume').textContent = 'Resume';
            }
        }
    }
});

// Event listeners
document.getElementById('start-focus').addEventListener('click', () => startTimer(25, 'focus'));
document.getElementById('start-break').addEventListener('click', () => startTimer(5, 'break'));
document.getElementById('pause-resume').addEventListener('click', togglePause);
