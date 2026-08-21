const API_URL = "http://localhost:8000";

const authScreen = document.getElementById("auth-screen");
const tasksScreen = document.getElementById("tasks-screen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
const authForm = document.getElementById("auth-form");
const authSubmitBtn = document.getElementById("btn-auth-submit");
const authTabs = document.querySelectorAll(".auth-tab");

let authMode = "login";

authTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    authTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    authMode = tab.dataset.tab;
    authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Cadastrar";
    hideAuthError();
  });
});

function showAuthMessage(message, type = "error") {
  authError.textContent = message;
  authError.classList.toggle("success", type === "success");
  authError.hidden = false;
}

function hideAuthError() {
  authError.hidden = true;
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAuthError();

  if (authMode === "register") {
    await handleRegister();
  } else {
    await handleLogin();
  }
});

async function handleRegister() {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value,
      password: passwordInput.value
    })
  });

  if (response.ok) {
    document.querySelector('.auth-tab[data-tab="login"]').click();
    showAuthMessage("Cadastrado! Agora faça login.", "success");
  } else {
    const error = await response.json();
    showAuthMessage(error.detail);
  }
}

async function handleLogin() {
  const formData = new URLSearchParams();
  formData.append("username", emailInput.value);
  formData.append("password", passwordInput.value);

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    showTasksScreen();
  } else {
    showAuthMessage("Email ou senha incorretos");
  }
}

function showTasksScreen() {
  authScreen.hidden = true;
  tasksScreen.hidden = false;
  loadTasks();
}

if (localStorage.getItem("token")) {
  showTasksScreen();
}

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "all";
let cachedTasks = [];

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

function authHeaders() {
  return {
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  };
}

async function loadTasks() {
  const response = await fetch(`${API_URL}/tasks`, {
    headers: authHeaders()
  });

  cachedTasks = await response.json();
  renderTasks();
}

function renderTasks() {
  const filtered = cachedTasks.filter(task => {
    if (currentFilter === "pending") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  taskList.innerHTML = "";
  emptyState.hidden = filtered.length > 0;

  filtered.forEach(task => taskList.appendChild(buildTaskItem(task)));

  const doneCount = cachedTasks.filter(t => t.done).length;
  taskCount.textContent = cachedTasks.length
    ? `${doneCount} de ${cachedTasks.length} concluídas`
    : "";
}

function buildTaskItem(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.done ? " done" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.done;
  checkbox.addEventListener("change", () => toggleDone(task, checkbox.checked));

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;
  content.appendChild(title);

  if (task.description) {
    const desc = document.createElement("span");
    desc.className = "task-description";
    desc.textContent = task.description;
    content.appendChild(desc);
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn";
  editBtn.title = "Editar";
  editBtn.textContent = "✏️";
  editBtn.addEventListener("click", () => startEdit(li, task));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "icon-btn";
  deleteBtn.title = "Excluir";
  deleteBtn.textContent = "🗑️";
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(content);
  li.appendChild(actions);

  return li;
}

function startEdit(li, task) {
  li.innerHTML = "";
  li.classList.add("editing");

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = task.title;

  const descInput = document.createElement("input");
  descInput.type = "text";
  descInput.value = task.description || "";
  descInput.placeholder = "Descrição (opcional)";

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "icon-btn";
  saveBtn.title = "Salvar";
  saveBtn.textContent = "✅";
  saveBtn.addEventListener("click", () => saveEdit(task, titleInput.value, descInput.value));

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "icon-btn";
  cancelBtn.title = "Cancelar";
  cancelBtn.textContent = "✖️";
  cancelBtn.addEventListener("click", renderTasks);

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  li.appendChild(titleInput);
  li.appendChild(descInput);
  li.appendChild(actions);

  titleInput.focus();
}

async function saveEdit(task, title, description) {
  if (!title.trim()) return;

  await fetch(`${API_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ title, description })
  });

  loadTasks();
}

async function toggleDone(task, done) {
  await fetch(`${API_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ done })
  });

  task.done = done;
  renderTasks();
}

async function deleteTask(id) {
  if (!confirm("Tem certeza que quer excluir essa tarefa?")) return;

  await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  loadTasks();
}

document.getElementById("new-task-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const titleField = document.getElementById("new-title");
  const descField = document.getElementById("new-description");

  await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title: titleField.value, description: descField.value })
  });

  titleField.value = "";
  descField.value = "";
  loadTasks();
});

document.getElementById("btn-logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  location.reload();
});
