// DOM Elements
const navItems = document.querySelectorAll(".sidebar nav li")
const contentViews = document.querySelectorAll(".content-view")
const addTaskButtons = document.querySelectorAll("#add-task-button, #add-task-button-2")
const addProjectButton = document.getElementById("add-project-button")
const inviteMemberButton = document.getElementById("invite-member-button")
const filterButton = document.getElementById("filter-button")
const filterDropdown = document.getElementById("filter-dropdown")
const filterOptions = document.querySelectorAll("[data-filter]")
const modals = document.querySelectorAll(".modal")
const closeModalButtons = document.querySelectorAll(".close-modal")
const cancelButtons = document.querySelectorAll(".cancel-button")
const taskForm = document.getElementById("task-form")
const projectForm = document.getElementById("project-form")
const inviteForm = document.getElementById("invite-form")

// App State
let currentView = "dashboard"
let currentFilter = "all"

// Declare variables
let loadTasks
let loadProjects
let loadTeamMembers
let db
let currentUser
let renderTaskList

// Initialize App
function initializeApp() {
  loadDashboardData()
  loadTasks()
  loadProjects()
  loadTeamMembers()
}

// Navigation
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const view = item.getAttribute("data-view")
    changeView(view)
  })
})

function changeView(view) {
  // Update navigation
  navItems.forEach((item) => {
    if (item.getAttribute("data-view") === view) {
      item.classList.add("active")
    } else {
      item.classList.remove("active")
    }
  })

  // Update content view
  contentViews.forEach((contentView) => {
    if (contentView.id === `${view}-view`) {
      contentView.classList.remove("hidden")
    } else {
      contentView.classList.add("hidden")
    }
  })

  currentView = view
}

// View All Links
document.querySelectorAll(".view-all").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault()
    const view = link.getAttribute("data-view")
    changeView(view)
  })
})

// Filter Dropdown
filterButton.addEventListener("click", () => {
  filterDropdown.classList.toggle("hidden")
})

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest("#filter-button") && !e.target.closest("#filter-dropdown")) {
    filterDropdown.classList.add("hidden")
  }
})

// Filter Options
filterOptions.forEach((option) => {
  option.addEventListener("click", (e) => {
    e.preventDefault()
    const filter = option.getAttribute("data-filter")
    currentFilter = filter
    filterDropdown.classList.add("hidden")
    loadTasks()
  })
})

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.remove("hidden")
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden")
}

function closeAllModals() {
  modals.forEach((modal) => {
    modal.classList.add("hidden")
  })
}

// Modal Triggers
addTaskButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("task-modal-title").textContent = "Add New Task"
    document.getElementById("task-id").value = ""
    taskForm.reset()
    openModal("task-modal")
  })
})

addProjectButton.addEventListener("click", () => {
  document.getElementById("project-modal-title").textContent = "Add New Project"
  document.getElementById("project-id").value = ""
  projectForm.reset()
  openModal("project-modal")
})

inviteMemberButton.addEventListener("click", () => {
  inviteForm.reset()
  openModal("invite-modal")
})

// Close Modals
closeModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeAllModals()
  })
})

cancelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeAllModals()
  })
})

// Close modal when clicking outside
modals.forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeAllModals()
    }
  })
})

// Prevent form submission propagation
document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("click", (e) => {
    e.stopPropagation()
  })
})

// Dashboard Data
function loadDashboardData() {
  // Get counts from Firestore
  db.collection("tasks")
    .where("userId", "==", currentUser.uid)
    .get()
    .then((snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const totalTasks = tasks.length
      const completedTasks = tasks.filter((task) => task.status === "completed").length
      const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length

      // Update dashboard stats
      document.getElementById("total-tasks-count").textContent = totalTasks
      document.getElementById("completed-tasks-count").textContent = completedTasks
      document.getElementById("in-progress-tasks-count").textContent = inProgressTasks

      // Load recent tasks
      const recentTasks = tasks.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()).slice(0, 5)

      renderTaskList("recent-tasks", recentTasks)

      // Load upcoming deadlines
      const upcomingDeadlines = tasks
        .filter((task) => task.dueDate && task.status !== "completed")
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 11, 31)
          const dateB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 11, 31)
          return dateA - dateB
        })
        .slice(0, 5)

      renderTaskList("upcoming-deadlines", upcomingDeadlines)
    })
    .catch((error) => {
      console.error("Error loading dashboard data:", error)
    })

  // Get project count
  db.collection("projects")
    .where("userId", "==", currentUser.uid)
    .get()
    .then((snapshot) => {
      document.getElementById("projects-count").textContent = snapshot.size
    })
    .catch((error) => {
      console.error("Error loading project count:", error)
    })
}
