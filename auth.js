// Import Firebase modules (replace with your actual Firebase configuration)
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

// Initialize Firebase (replace with your actual Firebase configuration)
const firebaseConfig = {
  // Your Firebase configuration here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}

firebase.initializeApp(firebaseConfig)

// Get Firestore instance
const db = firebase.firestore()

// DOM Elements
const authSection = document.getElementById("auth-section")
const appSection = document.getElementById("app-section")
const loginTab = document.getElementById("login-tab")
const signupTab = document.getElementById("signup-tab")
const loginForm = document.getElementById("login-form")
const signupForm = document.getElementById("signup-form")
const loginButton = document.getElementById("login-button")
const signupButton = document.getElementById("signup-button")
const logoutButton = document.getElementById("logout-button")
const userInfo = document.getElementById("user-info")
const userName = document.getElementById("user-name")

// Authentication State
let currentUser = null

// Tab Switching
loginTab.addEventListener("click", () => {
  loginTab.classList.add("active")
  signupTab.classList.remove("active")
  loginForm.classList.remove("hidden")
  signupForm.classList.add("hidden")
})

signupTab.addEventListener("click", () => {
  signupTab.classList.add("active")
  loginTab.classList.remove("active")
  signupForm.classList.remove("hidden")
  loginForm.classList.add("hidden")
})

// Login
loginButton.addEventListener("click", async (e) => {
  e.preventDefault()

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value

  if (!email || !password) {
    alert("Please enter both email and password")
    return
  }

  try {
    loginButton.disabled = true
    loginButton.textContent = "Logging in..."

    await firebase.auth().signInWithEmailAndPassword(email, password)

    // Reset form
    document.getElementById("login-email").value = ""
    document.getElementById("login-password").value = ""
  } catch (error) {
    alert(`Login failed: ${error.message}`)
    loginButton.disabled = false
    loginButton.textContent = "Login"
  }
})

// Sign Up
signupButton.addEventListener("click", async (e) => {
  e.preventDefault()

  const name = document.getElementById("signup-name").value
  const email = document.getElementById("signup-email").value
  const password = document.getElementById("signup-password").value

  if (!name || !email || !password) {
    alert("Please fill in all fields")
    return
  }

  try {
    signupButton.disabled = true
    signupButton.textContent = "Creating account..."

    // Create user in Firebase Auth
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password)
    const user = userCredential.user

    // Create user document in Firestore
    await db.collection("users").doc(user.uid).set({
      name: name,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      role: "member",
    })

    // Update user profile
    await user.updateProfile({
      displayName: name,
    })

    // Reset form
    document.getElementById("signup-name").value = ""
    document.getElementById("signup-email").value = ""
    document.getElementById("signup-password").value = ""
  } catch (error) {
    alert(`Sign up failed: ${error.message}`)
    signupButton.disabled = false
    signupButton.textContent = "Sign Up"
  }
})

// Logout
logoutButton.addEventListener("click", async () => {
  try {
    await firebase.auth().signOut()
  } catch (error) {
    console.error("Logout error:", error)
  }
})

// Auth State Change Listener
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    // User is signed in
    currentUser = user

    // Get user data from Firestore
    try {
      const userDoc = await db.collection("users").doc(user.uid).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        userName.textContent = userData.name || user.displayName || "User"
      } else {
        userName.textContent = user.displayName || "User"
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      userName.textContent = user.displayName || "User"
    }

    // Show app, hide auth
    authSection.classList.add("hidden")
    appSection.classList.remove("hidden")

    // Initialize app data
    initializeApp()
  } else {
    // User is signed out
    currentUser = null

    // Show auth, hide app
    authSection.classList.remove("hidden")
    appSection.classList.add("hidden")

    // Reset buttons
    loginButton.disabled = false
    loginButton.textContent = "Login"
    signupButton.disabled = false
    signupButton.textContent = "Sign Up"
  }
})

// Initialize App (replace with your actual app initialization logic)
function initializeApp() {
  // Your app initialization code here
  console.log("App initialized")
}
