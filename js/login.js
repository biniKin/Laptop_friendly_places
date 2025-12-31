import {auth, db} from "./firebase/init.js";
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User already logged in → redirect to home
    window.location.replace("home.html");
  }
});

// Get forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function clearErrors() {
    document.querySelectorAll(".error").forEach(e => e.innerText = "");
    document.querySelectorAll(".msg").forEach(e => e.style.display = "none");
}

// Switch buttons
document.getElementById("showSignup").onclick = () => {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
    clearErrors();
};

document.getElementById("showLogin").onclick = () => {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
    clearErrors();
};

async function saveUserToFirestore(uid, name, email) {
    try {
        console.log("Saving user to Firestore:");
        console.log(`UID: ${uid}, Name: ${name}, Email: ${email}`);
        
        // Use setDoc with the user's UID as the document ID
        await setDoc(doc(db, "users", uid), {
            name: name,
            email: email,
            created_at: Timestamp.now()
        });
        
        console.log("User saved successfully to Firestore");
    } catch (error) {
        console.error("Error saving user to Firestore:", error);
        throw error;
    }
}

const signUp = async (name, email, password) => {
    const submitText = signupForm.querySelector(".btn-text");
    const spinner = signupForm.querySelector(".spinner");
    const msg = document.getElementById("message");

    submitText.style.display = "none";
    spinner.style.display = "block";
    
    try{
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        await updateProfile(user, {
            displayName: name
        });

        // Save user to Firestore
        await saveUserToFirestore(user.uid, name, email);

        msg.style.display = "block";
        msg.style.color = "#4CAF50";
        msg.style.background = "rgba(76, 175, 80, 0.1)";
        msg.style.border = "1px solid #4CAF50";
        msg.innerText = "Account created successfully! Redirecting...";
        
        console.log("User created:", user);
        
        // Redirect to home page after 1 second
        setTimeout(() => {
            window.location.replace("home.html");
        }, 1000);
        
    } catch(e) {
        console.log(`Error creating user: ${e}`);
        msg.style.display = "block";
        msg.style.color = "#ff4757";
        msg.style.background = "rgba(255, 71, 87, 0.1)";
        msg.style.border = "1px solid #ff4757";
        
        if (e.code === "auth/email-already-in-use") {
            msg.innerText = "Email already in use";
        } else if (e.code === "auth/weak-password") {
            msg.innerText = "Password is too weak";
        } else {
            msg.innerText = "Error creating account. Please try again.";
        }
    } finally {
        submitText.style.display = "block";
        spinner.style.display = "none";
    }
}

const logIn = async (email, password) => {
    const submitText = loginForm.querySelector(".btn-text");
    const spinner = loginForm.querySelector(".spinner");
    const msg = document.getElementById("loginMsg");
    
    if (!submitText || !spinner) {
        console.error("Required DOM elements (submitText or spinner) were not found.");
        return;
    }
    
    submitText.style.display = "none";
    spinner.style.display = "block";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
       
        console.log(`User logged in successfully: ${user.email}`);
        
        // Redirect to home page
        window.location.replace("home.html");
        
    } catch(e) {
        msg.style.display = "block";
        msg.style.color = "#ff4757";
        msg.style.background = "rgba(255, 71, 87, 0.1)";
        msg.style.border = "1px solid #ff4757";
        
        if (e.code === "auth/user-not-found") {
            msg.innerText = "No account found with this email";
        } else if (e.code === "auth/wrong-password") {
            msg.innerText = "Incorrect password";
        } else if (e.code === "auth/invalid-credential") {
            msg.innerText = "Invalid email or password";
        } else {
            msg.innerText = "Login failed. Please try again.";
        }
        
        console.log(`User login failed: ${e.code} - ${e.message}`);
    } finally {
        submitText.style.display = "block";
        spinner.style.display = "none";
    }
}

/* ================= SIGN UP ================= */
signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;
    

    if (!name || !email || !password || !confirm) {
        alert("All fields are required!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match");
        return;
    }

    signUp(name, email, password);
});

/* ================= LOGIN ================= */
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    logIn(email, password);
});

// Password Eye Toggle
document.querySelectorAll(".toggle").forEach(icon => {
    icon.addEventListener("click", () => {
        const input = document.getElementById(icon.dataset.target);

        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});
