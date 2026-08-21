const API_URL = "http://localhost:8000";

const authScreen = document.getElementById("auth-screen");
const tasksScreen = document.getElementById("tasks-screen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");

document.getElementById("btn-register").addEventListener("click", async () => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value,
      password: passwordInput.value
    })
  });

  if (response.ok) {
    authError.textContent = "Cadastrado! Agora faça login.";
  } else {
    const error = await response.json();
    authError.textContent = error.detail;
  }
});

document.getElementById("btn-login").addEventListener("click", async () => {
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
    authError.textContent = "Email ou senha incorretos";
  }
});

function showTasksScreen() {
  authScreen.hidden = true;
  tasksScreen.hidden = false;
  loadTasks();
}

if (localStorage.getItem("token")) {
  showTasksScreen();
}

const taskList = document.getElementById("task-list");

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

  const tasks = await response.json();
  taskList.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = `${task.title} — ${task.description || ""}`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => editTask(task));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Excluir";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

async function editTask(task) {
  const newTitle = prompt("Novo título:", task.title);
  if (newTitle === null) return;

  const newDescription = prompt("Nova descrição:", task.description || "");

  await fetch(`${API_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ title: newTitle, description: newDescription })
  });

  loadTasks();
}

async function deleteTask(id) {
  if (!confirm("Tem certeza que quer excluir essa tarefa?")) return;

  await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  loadTasks();
}

document.getElementById("btn-add-task").addEventListener("click", async () => {
  const title = document.getElementById("new-title").value;
  const description = document.getElementById("new-description").value;

  await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, description })
  });

  document.getElementById("new-title").value = "";
  document.getElementById("new-description").value = "";
  loadTasks();
});

document.getElementById("btn-logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  location.reload();
});