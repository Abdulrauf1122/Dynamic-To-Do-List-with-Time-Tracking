let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let totalSeconds = 0;

document.addEventListener('DOMContentLoaded', loadTasks);

function loadTasks() {
  tasks.forEach(task => createTaskElement(task));
  updateTotalTime();
  updateProgress();
}

function addTask() {
  const taskInput = document.getElementById('new-task');
  const taskText = taskInput.value.trim();
  const taskTag = document.getElementById('task-tag').value.trim();

  if (taskText) {
    const newTask = {
      id: Date.now(),
      text: taskText,
      tag: taskTag,
      timeSpent: 0,
      running: false,
    };

    tasks.push(newTask);
    saveTasks();
    createTaskElement(newTask);
    taskInput.value = '';
    document.getElementById('task-tag').value = '';
  }
}

function createTaskElement(task) {
  const taskList = document.getElementById('task-list');
  const taskElement = document.createElement('li');
  taskElement.className = 'task';
  taskElement.dataset.id = task.id;
  taskElement.draggable = true;

  const taskInfo = document.createElement('div');
  taskInfo.className = 'task-info';

  const taskText = document.createElement('span');
  taskText.contentEditable = true;
  taskText.textContent = task.text;
  taskText.onblur = () => updateTaskText(task.id, taskText.textContent);

  const taskTag = document.createElement('span');
  taskTag.className = 'tags';
  taskTag.textContent = `#${task.tag || "No tag"}`;

  const timer = document.createElement('span');
  timer.className = 'timer';
  timer.textContent = formatTime(task.timeSpent);

  const startButton = document.createElement('button');
  startButton.className = 'start-timer';
  startButton.textContent = task.running ? 'Pause' : 'Start';
  startButton.onclick = () => toggleTimer(task.id, timer, startButton);

  const removeButton = document.createElement('button');
  removeButton.className = 'remove-task';
  removeButton.textContent = 'Remove';
  removeButton.onclick = () => removeTask(task.id, taskElement);

  taskInfo.appendChild(taskText);
  taskInfo.appendChild(taskTag);
  taskInfo.appendChild(timer);
  taskElement.appendChild(taskInfo);
  taskElement.appendChild(startButton);
  taskElement.appendChild(removeButton);
  taskList.appendChild(taskElement);

  taskElement.addEventListener('dragstart', () => taskElement.classList.add('dragging'));
  taskElement.addEventListener('dragend', () => taskElement.classList.remove('dragging'));

  taskList.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement) {
      taskList.insertBefore(taskElement, afterElement);
    } else {
      taskList.appendChild(taskElement);
    }
  });
}

function updateTaskText(id, text) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.text = text;
    saveTasks();
  }
}

function toggleTimer(id, timerElement, button) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.running = !task.running;
    button.textContent = task.running ? 'Pause' : 'Start';

    if (task.running) {
      task.interval = setInterval(() => {
        task.timeSpent++;
        timerElement.textContent = formatTime(task.timeSpent);
        updateTotalTime();
        updateProgress();
        saveTasks();
      }, 1000);
    } else {
      clearInterval(task.interval);
    }
  }
}

function removeTask(id, taskElement) {
  tasks = tasks.filter(t => t.id !== id);
  taskElement.remove();
  saveTasks();
  updateTotalTime();
  updateProgress();
}

function formatTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function updateTotalTime() {
  totalSeconds = tasks.reduce((total, task) => total + task.timeSpent, 0);
  document.getElementById('total-time').textContent = formatTime(totalSeconds);
}

function updateProgress() {
  const totalTime = tasks.reduce((total, task) => total + task.timeSpent, 0);
  const progressBar = document.getElementById('progress');
  const percentage = (totalTime / (totalSeconds || 1)) * 100; // Avoid division by zero

  progressBar.style.width = `${percentage}%`;
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
