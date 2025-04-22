// Declare variables (assuming these are defined elsewhere in the project)
const firebase = window.firebase // Assuming firebase is available globally
const db = firebase.firestore() // Assuming you are using Firebase Firestore
const inviteForm = document.getElementById("invite-form") // Or however you are selecting the form
const currentUser = firebase.auth().currentUser // Assuming you are using Firebase Authentication
const closeAllModals = () => {
  // Implementation to close all modals
  const modals = document.querySelectorAll(".modal") // Example selector
  modals.forEach((modal) => {
    modal.style.display = "none" // Example hide
  })
}

// Invite Form Submission
inviteForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("invite-email").value
  const role = document.getElementById("invite-role").value

  try {
    // Create invitation in Firestore
    await db.collection("invitations").add({
      email,
      role,
      teamId: currentUser.uid, // Using user ID as team ID for simplicity
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })

    alert(`Invitation sent to ${email}`)
    closeAllModals()
  } catch (error) {
    console.error("Error sending invitation:", error)
    alert("Error sending invitation. Please try again.")
  }
})

// Load Team Members
function loadTeamMembers() {
  // For demo purposes, we'll create some sample team members
  // In a real app, you would fetch this from Firestore
  const teamMembers = [
    {
      id: "1",
      name: "John Doe",
      role: "Admin",
      tasksCompleted: 24,
      tasksInProgress: 5,
    },
    {
      id: "2",
      name: "Jane Smith",
      role: "Team Member",
      tasksCompleted: 18,
      tasksInProgress: 3,
    },
    {
      id: "3",
      name: "Mike Johnson",
      role: "Team Member",
      tasksCompleted: 12,
      tasksInProgress: 7,
    },
  ]

  renderTeamMembers(teamMembers)
  updateAssigneeDropdowns(teamMembers)
}

// Render Team Members
function renderTeamMembers(members) {
  const container = document.getElementById("team-members")
  container.innerHTML = ""

  if (members.length === 0) {
    container.innerHTML = '<div class="empty-state">No team members found</div>'
    return
  }

  // Add current user as first member
  const currentUserElement = document.createElement("div")
  currentUserElement.className = "team-card"

  currentUserElement.innerHTML = `
    <div class="team-avatar">
      <i class="fas fa-user"></i>
    </div>
    <div class="team-name">${currentUser.displayName || "You"}</div>
    <div class="team-role">Admin (You)</div>
    <div class="team-stats">
      <div class="team-stat">
        <div class="team-stat-value" id="user-completed-tasks">0</div>
        <div class="team-stat-label">Completed</div>
      </div>
      <div class="team-stat">
        <div class="team-stat-value" id="user-in-progress-tasks">0</div>
        <div class="team-stat-label">In Progress</div>
      </div>
    </div>
  `

  container.appendChild(currentUserElement)

  // Get task counts for current user
  db.collection("tasks")
    .where("userId", "==", currentUser.uid)
    .get()
    .then((snapshot) => {
      const tasks = snapshot.docs.map((doc) => doc.data())
      const completedTasks = tasks.filter((task) => task.status === "completed").length
      const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length

      document.getElementById("user-completed-tasks").textContent = completedTasks
      document.getElementById("user-in-progress-tasks").textContent = inProgressTasks
    })
    .catch((error) => {
      console.error("Error loading user tasks:", error)
    })

  // Render other team members
  members.forEach((member) => {
    const memberElement = document.createElement("div")
    memberElement.className = "team-card"

    memberElement.innerHTML = `
      <div class="team-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="team-name">${member.name}</div>
      <div class="team-role">${member.role}</div>
      <div class="team-stats">
        <div class="team-stat">
          <div class="team-stat-value">${member.tasksCompleted}</div>
          <div class="team-stat-label">Completed</div>
        </div>
        <div class="team-stat">
          <div class="team-stat-value">${member.tasksInProgress}</div>
          <div class="team-stat-label">In Progress</div>
        </div>
      </div>
      <div class="team-actions">
        <button class="remove-member">Remove</button>
      </div>
    `

    // Add event listener for remove button
    memberElement.querySelector(".remove-member").addEventListener("click", () => {
      if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
        // In a real app, you would remove the member from Firestore
        alert(`${member.name} has been removed from the team`)
        memberElement.remove()
      }
    })

    container.appendChild(memberElement)
  })
}

// Update Assignee Dropdowns
function updateAssigneeDropdowns(members) {
  const assigneeDropdowns = document.querySelectorAll("#task-assignee")

  assigneeDropdowns.forEach((dropdown) => {
    // Save current selection
    const currentValue = dropdown.value

    // Clear options except the first one
    while (dropdown.options.length > 1) {
      dropdown.remove(1)
    }

    // Add member options
    members.forEach((member) => {
      const option = document.createElement("option")
      option.value = member.id
      option.textContent = member.name
      dropdown.appendChild(option)
    })

    // Restore selection if possible
    if (currentValue) {
      dropdown.value = currentValue
    }
  })
}
