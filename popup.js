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

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
let isRunning = false;

// Initialize timer
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    updateTimerDisplay(response.remaining);
    updateStatusText(response.isWorking);
});

// Button handlers
startBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    startBtn.textContent = isRunning ? 'Pause' : 'Resume';
    startBtn.classList.toggle('running', isRunning);
    chrome.runtime.sendMessage({ action: isRunning ? 'startTimer' : 'pauseTimer' });
});

resetBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resetTimer' });
});

// Update display
function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timerDisplay.textContent =
        `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateStatusText(isWorking) {
    document.getElementById('timer-status').textContent =
        `Current Mode: ${isWorking ? 'Work Session' : 'Break Time'}`;
}

// Listen for updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'timerUpdate') {
        updateTimerDisplay(message.remaining);
        updateStatusText(message.isWorking);
    }
});


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