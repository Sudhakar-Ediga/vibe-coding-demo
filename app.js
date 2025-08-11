// Daily Boost - app.js

// ====== Config ======
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // <-- Replace with your OpenWeatherMap API key
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const ZENQUOTES_URL = 'https://zenquotes.io/api/today';

const STORAGE_KEYS = {
  tasks: 'daily_boost_tasks',
  city: 'daily_boost_city',
};

// ====== Utilities ======
function formatToday() {
  const now = new Date();
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function createTask(text) {
  return { id: Date.now().toString(), text: text.trim(), done: false };
}

// ====== DOM ======
const todayEl = document.getElementById('today');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskListEl = document.getElementById('taskList');
const taskSummaryEl = document.getElementById('taskSummary');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const weatherForm = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherInfo = document.getElementById('weatherInfo');

const quoteTextEl = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const refreshQuoteBtn = document.getElementById('refreshQuoteBtn');

// ====== State ======
let tasks = loadFromStorage(STORAGE_KEYS.tasks, []);
let savedCity = loadFromStorage(STORAGE_KEYS.city, '');

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  todayEl.textContent = formatToday();
  renderTasks();

  if (savedCity) {
    cityInput.value = savedCity;
    fetchWeather(savedCity);
  }

  fetchQuote();
});

// ====== Tasks ======
function renderTasks() {
  taskListEl.innerHTML = '';
  if (!Array.isArray(tasks)) tasks = [];

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.done;
    checkbox.dataset.id = task.id;
    checkbox.setAttribute('aria-label', 'Mark task as done');

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = task.text;

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = 'Delete';
    del.dataset.id = task.id;
    del.setAttribute('aria-label', 'Delete task');

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);

    taskListEl.appendChild(li);
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  taskSummaryEl.textContent = total
    ? `${completed}/${total} completed`
    : 'No tasks yet. Add your first task!';
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.unshift(createTask(trimmed));
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
}

function toggleTask(id, done) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done } : t));
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
}

// Events: tasks

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

taskListEl.addEventListener('click', (e) => {
  const target = e.target;
  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    toggleTask(target.dataset.id, target.checked);
  }
  if (target instanceof HTMLButtonElement && target.classList.contains('delete')) {
    deleteTask(target.dataset.id);
  }
});

clearCompletedBtn.addEventListener('click', () => {
  const hasCompleted = tasks.some((t) => t.done);
  if (!hasCompleted) return;
  tasks = tasks.filter((t) => !t.done);
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
});

// ====== Weather ======
async function fetchWeather(city) {
  const cityName = city?.trim();
  if (!cityName) {
    weatherInfo.innerHTML = '<p class="muted">Please enter a city.</p>';
    return;
  }

  if (OPENWEATHER_API_KEY.startsWith('YOUR_')) {
    weatherInfo.innerHTML = '<p class="muted">Add your OpenWeatherMap API key in <code>app.js</code> to load weather.</p>';
    return;
  }

  weatherInfo.innerHTML = '<p class="muted">Loading weather…</p>';
  try {
    const url = `${OPENWEATHER_BASE_URL}?q=${encodeURIComponent(cityName)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Failed to load weather');
    }

    const temperature = Math.round(data.main.temp);
    const description = data.weather?.[0]?.description || '';
    const icon = data.weather?.[0]?.icon || '01d';
    const country = data.sys?.country || '';

    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    weatherInfo.innerHTML = `
      <div class="weather__main">
        <img src="${iconUrl}" alt="${description}" width="64" height="64" />
        <div>
          <div class="weather__temp">${temperature}°C</div>
          <div class="weather__desc">${description}</div>
        </div>
      </div>
      <div class="weather__meta">
        ${cityName}${country ? ', ' + country : ''}
      </div>
    `;

    savedCity = cityName;
    saveToStorage(STORAGE_KEYS.city, savedCity);
  } catch (err) {
    weatherInfo.innerHTML = `<p class="muted">${err.message || 'Could not load weather.'}</p>`;
  }
}

weatherForm.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchWeather(cityInput.value);
});

// ====== Quotes ======
async function fetchQuote() {
  quoteTextEl.textContent = 'Loading quote…';
  quoteAuthorEl.textContent = '';

  try {
    const res = await fetch(ZENQUOTES_URL);
    if (!res.ok) throw new Error('Failed to fetch quote');
    const data = await res.json();
    // ZenQuotes returns an array with objects: { q: 'quote', a: 'author' }
    const item = Array.isArray(data) ? data[0] : null;
    const text = item?.q || '';
    const author = item?.a || 'Unknown';

    if (!text) throw new Error('No quote text');

    quoteTextEl.textContent = `“${text}”`;
    quoteAuthorEl.textContent = `— ${author}`;
  } catch {
    // Fallback to Quotable if ZenQuotes fails (CORS or others)
    try {
      const res2 = await fetch('https://api.quotable.io/random');
      if (!res2.ok) throw new Error('Failed to fetch fallback quote');
      const q = await res2.json();
      quoteTextEl.textContent = `“${q.content}”`;
      quoteAuthorEl.textContent = `— ${q.author}`;
    } catch (err2) {
      quoteTextEl.textContent = 'Keep going. Your future self will thank you.';
      quoteAuthorEl.textContent = '— Unknown';
    }
  }
}

refreshQuoteBtn.addEventListener('click', () => {
  fetchQuote();
});