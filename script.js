/* ==========================================================================
   TO-DO LIST APP — script.js
   A beginner-friendly, fully-commented implementation using plain
   JavaScript (no frameworks). Tasks are stored in an array and saved
   to localStorage so they survive a page refresh.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. GRAB REFERENCES TO THE ELEMENTS WE'LL NEED
   -------------------------------------------------------------------------- */
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCounter = document.getElementById("task-counter");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

/* --------------------------------------------------------------------------
   2. APP STATE
   `tasks` is the single source of truth: every task is an object like
   { id: "175...", text: "Buy milk", completed: false }.
   `currentFilter` controls which tasks renderTasks() shows: "all",
   "active", or "completed".
   -------------------------------------------------------------------------- */
let tasks = [];
let currentFilter = "all";

const STORAGE_KEY = "todoTasks"; // the key we use in localStorage

/* --------------------------------------------------------------------------
   3. LOCAL STORAGE HELPERS
   localStorage can only store strings, so we JSON.stringify() when saving
   and JSON.parse() when loading.
   -------------------------------------------------------------------------- */
function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  tasks = stored ? JSON.parse(stored) : [];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* Generates a reasonably unique id for each new task (current timestamp
   plus a few random characters). Good enough for a client-side app. */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Escapes a piece of text before we put it into innerHTML, so a task
   like "<script>" is shown as plain text instead of being run as HTML. */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
   4. RENDERING
   renderTasks() is the one function that draws the list on screen. It is
   called after every change (add, delete, edit, toggle, filter) so the
   page always matches the `tasks` array.
   -------------------------------------------------------------------------- */
function renderTasks() {
  // Start with a clean list every time — simpler than trying to patch
  // individual items, and plenty fast for a to-do list of this size.
  taskList.innerHTML = "";

  // Work out which tasks should be visible under the current filter.
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true; // "all"
  });

  // Show a friendly message instead of a blank box when there's nothing to show.
  emptyState.style.display = visibleTasks.length === 0 ? "block" : "none";

  visibleTasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });

  updateTaskCounter();
}

/* Builds one <li> for a single task, including its own event listeners. */
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " completed" : "");
  li.dataset.id = task.id;

  li.innerHTML = `
    <label class="task-checkbox">
      <input type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task complete" />
      <svg class="check-icon" viewBox="0 0 24 24">
        <path d="M4 12l5 5L20 6" />
      </svg>
    </label>

    <span class="task-text">${escapeHtml(task.text)}</span>
    <input type="text" class="edit-input" value="${escapeHtml(task.text)}" maxlength="120" />

    <div class="task-actions">
      <button class="edit-btn" type="button" title="Edit task" aria-label="Edit task">✏️</button>
      <button class="delete-btn" type="button" title="Delete task" aria-label="Delete task">🗑️</button>
    </div>
  `;

  // --- wire up this task's controls --------------------------------------
  const checkbox = li.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", () => toggleComplete(task.id));

  const deleteBtn = li.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  const editBtn = li.querySelector(".edit-btn");
  editBtn.addEventListener("click", () => enterEditMode(li));

  const editInput = li.querySelector(".edit-input");
  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit(li, task.id);
    }
    if (event.key === "Escape") {
      cancelEdit(li, task.id);
    }
  });
  // Also save if the user clicks away without pressing Enter.
  editInput.addEventListener("blur", () => saveEdit(li, task.id));

  return li;
}

/* --------------------------------------------------------------------------
   5. ADD TASK
   -------------------------------------------------------------------------- */
function addTask(text) {
  const trimmed = text.trim();
  if (trimmed === "") return; // ignore empty / whitespace-only input

  tasks.push({
    id: generateId(),
    text: trimmed,
    completed: false,
  });

  saveTasks();
  renderTasks();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the form from reloading the page
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

/* --------------------------------------------------------------------------
   6. DELETE TASK
   -------------------------------------------------------------------------- */
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

/* --------------------------------------------------------------------------
   7. MARK AS COMPLETE / INCOMPLETE
   -------------------------------------------------------------------------- */
function toggleComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

/* --------------------------------------------------------------------------
   8. EDIT / UPDATE TASK
   -------------------------------------------------------------------------- */
function enterEditMode(li) {
  li.classList.add("editing");
  const input = li.querySelector(".edit-input");
  input.focus();
  input.select();
}

function cancelEdit(li, id) {
  // Put the original text back into the input before closing edit mode,
  // so any unsaved changes the user typed are discarded.
  const task = tasks.find((task) => task.id === id);
  li.querySelector(".edit-input").value = task.text;
  li.classList.remove("editing");
}

function saveEdit(li, id) {
  // Guard against this running twice (Enter triggers it, then the
  // input's blur event fires right after and would try to run it again).
  if (!li.classList.contains("editing")) return;

  const newText = li.querySelector(".edit-input").value.trim();

  if (newText === "") {
    // Saving an empty task doesn't make sense — just remove it instead.
    deleteTask(id);
    return;
  }

  tasks = tasks.map((task) => (task.id === id ? { ...task, text: newText } : task));
  saveTasks();
  li.classList.remove("editing");
  renderTasks();
}

/* --------------------------------------------------------------------------
   9. TASK COUNTER
   -------------------------------------------------------------------------- */
function updateTaskCounter() {
  const remaining = tasks.filter((task) => !task.completed).length;
  taskCounter.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;
}

/* --------------------------------------------------------------------------
   10. CLEAR COMPLETED TASKS
   -------------------------------------------------------------------------- */
clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

/* --------------------------------------------------------------------------
   11. FILTER TABS (All / Active / Completed)
   -------------------------------------------------------------------------- */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

/* --------------------------------------------------------------------------
   12. STARTUP
   Load whatever was saved last time, then draw the list.
   -------------------------------------------------------------------------- */
loadTasks();
renderTasks();