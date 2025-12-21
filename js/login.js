import {auth, db} from "./firebase/init.js";
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User already logged in → redirect
    window.location.replace("home.html");
  }
});

// Get forms
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");


function setError(id, message) {
    document.getElementById(id).innerText = message;
}

function clearErrors() {
    document.querySelectorAll(".error").forEach(e => e.innerText = "");
}

// Switch buttons
document.getElementById("showSignup").onclick = () => {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
};

document.getElementById("showLogin").onclick = () => {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
};

// Get users from localStorage (JSON)
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

// Save users to localStorage (JSON)
function saveUsers(users) {

    localStorage.setItem("users", JSON.stringify(users));
}

const signUp = async (name, email, password) => {
    const submitText = signupForm.querySelector(".btn-text");
    const spinner = signupForm.querySelector(".spinner");
    const msg = signupForm.querySelector(".msg");

    submitText.style.display = "none";
    spinner.style.display = "block";
    try{
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        await updateProfile(user, {
            displayName: name
        });

        msg.innerText = "Succesfully logged in.";
        console.log(user);
    }catch(e){
        console.log(`error on create user: ${e}`);
    } finally{
        submitText.style.display = "block";
        spinner.style.display = "none"
    }
    
}

const logIn = async (email, password) => {
    const submitText = loginForm.querySelector(".btn-text");
    const spinner = loginForm.querySelector(".spinner");
    const msg = loginForm.querySelector(".msg");
    
    if (!submitText || !spinner) {
        console.error("Required DOM elements (submitText or spinner) were not found.");
        return;
    }
    submitText.style.display = "none";
    spinner.style.display = "block";

    try{
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // msg.innerText = "Succesfully logged in.";
       
        console.log(`user login successfully: ${user}`);
    }catch(e){
        msg.style.display = "block";
        msg.style.color = "black";
        msg.innerText = "Error";
        console.log(`user login failed ${e}`);
    } finally{
        submitText.style.display = "block";
        spinner.style.display = "none"
    }
}

/* ================= SIGN UP ================= */
signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

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

    // let users = getUsers();

    // Check if email exists
    // const exists = users.some(user => user.email === email);
    // if (exists) {
    //     alert("Email already registered");
    //     return;
    // }

    // Save user
    // users.push({
    //     name: name,
    //     email: email,
    //     password: password
    // });

    // saveUsers(users);
    
    signUp(name, email, password);
    

    signupForm.reset();
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
});

/* ================= LOGIN ================= */
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    // let users = getUsers();

    // const user = users.find(
    //     user => user.email === email && user.password === password
    // );

    // if (user) {
    //     alert(`Welcome ${user.name}!`);
    // } else {
    //     alert("Invalid email or password");
    // }

    logIn(email, password,);


    loginForm.reset();
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

