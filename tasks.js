// Declare variables (assuming these are defined elsewhere in your project)
const taskForm = document.getElementById("task-form") // Or however you are selecting the form
const firebase = window.firebase // Assuming firebase is available globally
const currentUser = firebase.auth().currentUser // Example: Get current user from Firebase auth
const db = firebase.firestore() // Initialize Firestore
const currentFilter = "all" // Declare currentFilter
const loadDashboardData = () => {
  // Implementation to load dashboard data
  console.log("loadDashboardData function called")
}

const closeAllModals = () => {
  // Implementation to close all modals
  const modals = document.querySelectorAll(".modal") // Example selector
  modals.forEach((modal) => {
    modal.style.display = "none"
  })
  const modalBackdrops = document.querySelectorAll(".modal-backdrop")
  modalBackdrops.forEach((backdrop) => {
    backdrop.remove()
  })
}

// Task Form Submission
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const taskId = document.getElementById("task-id").value
  const title = document.getElementById("task-title").value
  const description = document.getElementById("task-description").value
  const projectId = document.getElementById("task-project").value
  const status = document.getElementById("task-status").value
  const dueDate = document.getElementById("task-due-date").value
  const priority = document.getElementById("task-priority").value
  const assigneeId = document.getElementById("task-assignee").value || currentUser.uid

  try {
    if (taskId) {
      // Update existing task
      await db
        .collection("tasks")
        .doc(taskId)
        .update({
          title,
          description,
          projectId: projectId || null,
          status,
          dueDate: dueDate || null,
          priority,
          assigneeId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
    } else {
      // Create new task
      await db.collection("tasks").add({
        title,
        description,
        projectId: projectId || null,
        status,
        dueDate: dueDate || null,
        priority,
        assigneeId,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    }

    closeAllModals()
    loadTasks()
    loadDashboardData()
  } catch (error) {
    console.error("Error saving task:", error)
    alert("Error saving task. Please try again.")
  }
})

// Load Tasks
function loadTasks() {
  // Get tasks from Firestore
  let query = db.collection("tasks").where("userId", "==", currentUser.uid)

  // Apply filter if not 'all'
  if (currentFilter !== "all") {
    query = query.where("status", "==", currentFilter)
  }

  query
    .get()
    .then((snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Group tasks by status
      const todoTasks = tasks.filter((task) => task.status === "todo")
      const inProgressTasks = tasks.filter((task) => task.status === "in-progress")
      const completedTasks = tasks.filter((task) => task.status === "completed")

      // Update counts
      document.getElementById("todo-count").textContent = todoTasks.length
      document.getElementById("in-progress-count").textContent = inProgressTasks.length
      document.getElementById("completed-count").textContent = completedTasks.length

      // Render task lists
      renderTaskList("todo-tasks", todoTasks)
      renderTaskList("in-progress-tasks", inProgressTasks)
      renderTaskList("completed-tasks", completedTasks)
    })
    .catch((error) => {
      console.error("Error loading tasks:", error)
    })
}

// Render Task List
function renderTaskList(containerId, tasks) {
  const container = document.getElementById(containerId)
  container.innerHTML = ""

  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">No tasks found</div>'
    return
  }

  // Get projects for task labels
  db.collection("projects")
    .where("userId", "==", currentUser.uid)
    .get()
    .then((snapshot) => {
      const projects = {}
      snapshot.docs.forEach((doc) => {
        projects[doc.id] = doc.data()
      })

      // Render each task
      tasks.forEach((task) => {
        const taskElement = document.createElement("div")
        taskElement.className = "task-card"
        taskElement.setAttribute("data-id", task.id)

        const priorityClass = `priority-${task.priority}`
        const projectName = task.projectId && projects[task.projectId] ? projects[task.projectId].name : null
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null

        taskElement.innerHTML = `
          <div class="task-header">
            <div class="task-title">${task.title}</div>
            <div class="task-priority ${priorityClass}">${task.priority}</div>
          </div>
          ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
          <div class="task-meta">
            ${projectName ? `<div class="task-project">${projectName}</div>` : ""}
            ${dueDate ? `<div class="task-due-date"><i class="fas fa-calendar"></i> ${dueDate}</div>` : ""}
          </div>
        `

        // Add click event to edit task
        taskElement.addEventListener("click", () => {
          editTask(task)
        })

        container.appendChild(taskElement)
      })
    })
    .catch((error) => {
      console.error("Error loading projects for tasks:", error)
    })
}

// Edit Task
function editTask(task) {
  document.getElementById("task-modal-title").textContent = "Edit Task"
  document.getElementById("task-id").value = task.id
  document.getElementById("task-title").value = task.title
  document.getElementById("task-description").value = task.description || ""
  document.getElementById("task-project").value = task.projectId || ""
  document.getElementById("task-status").value = task.status
  document.getElementById("task-due-date").value = task.dueDate || ""
  document.getElementById("task-priority").value = task.priority
  document.getElementById("task-assignee").value = task.assigneeId || currentUser.uid

  openModal("task-modal")
}

// Open Modal Function (Declare it)
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  modal.style.display = "block"

  // Create and append a modal backdrop
  const backdrop = document.createElement("div")
  backdrop.className = "modal-backdrop fade show" // Bootstrap classes for backdrop
  document.body.appendChild(backdrop)

  // Prevent scrolling on the body
  document.body.classList.add("modal-open")
}
