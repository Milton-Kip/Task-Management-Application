// Assuming these variables are defined elsewhere, likely in a main script or HTML
// For the sake of this example, I'm declaring them here.  In a real application,
// these would be initialized with actual values or imported from modules.
const firebase = window.firebase // Assuming firebase is globally available
const db = firebase.firestore() // Assuming firebase is globally available
const projectForm = document.getElementById("project-form") // Or however it's defined
const currentUser = firebase.auth().currentUser || { uid: "testUserId" } // Example user

// Mock functions for undeclared variables
function loadDashboardData() {
  console.log("loadDashboardData called (mock function)")
}

function openModal(modalId) {
  console.log(`openModal called with id: ${modalId} (mock function)`)
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "block"
  }
}

function closeAllModals() {
  // Implementation to close all modals
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.style.display = "none"
  })
}

// Mock function for loadTasks
function loadTasks() {
  console.log("loadTasks called (mock function)")
}

// Project Form Submission
projectForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const projectId = document.getElementById("project-id").value
  const name = document.getElementById("project-name").value
  const description = document.getElementById("project-description").value
  const color = document.getElementById("project-color").value

  try {
    if (projectId) {
      // Update existing project
      await db.collection("projects").doc(projectId).update({
        name,
        description,
        color,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    } else {
      // Create new project
      await db.collection("projects").add({
        name,
        description,
        color,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    }

    closeAllModals()
    loadProjects()
    updateProjectDropdowns()
    loadDashboardData()
  } catch (error) {
    console.error("Error saving project:", error)
    alert("Error saving project. Please try again.")
  }
})

// Load Projects
function loadProjects() {
  // Get projects from Firestore
  db.collection("projects")
    .where("userId", "==", currentUser.uid)
    .get()
    .then((snapshot) => {
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      renderProjects(projects)
      updateProjectDropdowns(projects)
    })
    .catch((error) => {
      console.error("Error loading projects:", error)
    })
}

// Render Projects
function renderProjects(projects) {
  const container = document.getElementById("projects-list")
  container.innerHTML = ""

  if (projects.length === 0) {
    container.innerHTML = '<div class="empty-state">No projects found</div>'
    return
  }

  // Get task counts for each project
  db.collection("tasks")
    .where("userId", "==", currentUser.uid)
    .get()
    .then((snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Count tasks per project
      const taskCounts = {}
      tasks.forEach((task) => {
        if (task.projectId) {
          taskCounts[task.projectId] = (taskCounts[task.projectId] || 0) + 1
        }
      })

      // Render each project
      projects.forEach((project) => {
        const projectElement = document.createElement("div")
        projectElement.className = "project-card"
        projectElement.setAttribute("data-id", project.id)
        projectElement.style.borderTopColor = project.color

        const taskCount = taskCounts[project.id] || 0

        projectElement.innerHTML = `
          <div class="project-header">
            <div class="project-name">${project.name}</div>
            <div class="project-actions">
              <button class="edit-project" title="Edit Project"><i class="fas fa-edit"></i></button>
              <button class="delete-project" title="Delete Project"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="project-description">${project.description || "No description"}</div>
          <div class="project-meta">
            <div class="project-tasks">
              <i class="fas fa-tasks"></i>
              <span>${taskCount} tasks</span>
            </div>
          </div>
        `

        // Add event listeners
        projectElement.querySelector(".edit-project").addEventListener("click", (e) => {
          e.stopPropagation()
          editProject(project)
        })

        projectElement.querySelector(".delete-project").addEventListener("click", (e) => {
          e.stopPropagation()
          deleteProject(project.id)
        })

        container.appendChild(projectElement)
      })
    })
    .catch((error) => {
      console.error("Error loading tasks for projects:", error)
    })
}

// Update Project Dropdowns
function updateProjectDropdowns(projects) {
  if (!projects) {
    // If projects not provided, fetch them
    db.collection("projects")
      .where("userId", "==", currentUser.uid)
      .get()
      .then((snapshot) => {
        const projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        updateProjectDropdownOptions(projects)
      })
      .catch((error) => {
        console.error("Error loading projects for dropdown:", error)
      })
  } else {
    updateProjectDropdownOptions(projects)
  }
}

function updateProjectDropdownOptions(projects) {
  const projectDropdowns = document.querySelectorAll("#task-project")

  projectDropdowns.forEach((dropdown) => {
    // Save current selection
    const currentValue = dropdown.value

    // Clear options except the first one
    while (dropdown.options.length > 1) {
      dropdown.remove(1)
    }

    // Add project options
    projects.forEach((project) => {
      const option = document.createElement("option")
      option.value = project.id
      option.textContent = project.name
      dropdown.appendChild(option)
    })

    // Restore selection if possible
    if (currentValue) {
      dropdown.value = currentValue
    }
  })
}

// Edit Project
function editProject(project) {
  document.getElementById("project-modal-title").textContent = "Edit Project"
  document.getElementById("project-id").value = project.id
  document.getElementById("project-name").value = project.name
  document.getElementById("project-description").value = project.description || ""
  document.getElementById("project-color").value = project.color

  openModal("project-modal")
}

// Delete Project
function deleteProject(projectId) {
  if (confirm("Are you sure you want to delete this project? This will not delete associated tasks.")) {
    db.collection("projects")
      .doc(projectId)
      .delete()
      .then(() => {
        // Update tasks to remove project reference
        db.collection("tasks")
          .where("projectId", "==", projectId)
          .get()
          .then((snapshot) => {
            const batch = db.batch()

            snapshot.docs.forEach((doc) => {
              batch.update(doc.ref, { projectId: null })
            })

            return batch.commit()
          })
          .then(() => {
            loadProjects()
            loadTasks()
            loadDashboardData()
          })
          .catch((error) => {
            console.error("Error updating tasks after project deletion:", error)
          })
      })
      .catch((error) => {
        console.error("Error deleting project:", error)
        alert("Error deleting project. Please try again.")
      })
  }
}
