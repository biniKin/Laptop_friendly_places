const button = document.getElementById('strt-btn');

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55bmFtZSI6IkJpbml5YW0iLCJkZXNjcmlwdGlvbiI6ImJmMzY3OTE3LWE2YzYtNDRmNS1hOTVhLTA0N2U2N2QxOTNhNSIsImlkIjoiNjhjNTk0ZWUtYzQ0Mi00ZThmLWFjM2EtYTIwNWY5ZDlkM2EwIiwiaXNzdWVkX2F0IjoxNzYzNzMwNzQyLCJpc3N1ZXIiOiJodHRwczovL21hcGFwaS5nZWJldGEuYXBwIiwiand0X2lkIjoiMCIsInNjb3BlcyI6WyJGRUFUVVJFX0FMTCJdLCJ1c2VybmFtZSI6ImJpbmlLaW4ifQ.kTxObg3G8jK_6DwkQKAByQdOuuwyej89kaKX59xRGFI'

async function fetchMap() {
    const res = fetch(`https://mapapi.gebeta.app/api/route/direction/?origin={8.989022,38.79036}&destination={9.03045,38.76530}&apiKey=${apiKey}`)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

function getLocation(){
    // get location from user
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(getPos, posError);
    } else{
        alert("Location is required to contiune")
    }
}

const getPos = (pos) => {
    let lati = pos.coords.latitude;
    let long = pos.coords.longitude;

    console.log(lati, long);
}

const posError = (error)=>{
    switch (error.code){
        case error.PERMISSION_DENIED:
            alert('Location permission denied.');
            break;

        case error.PERMISSION_UNAVAILABLE:
            alert('Location permission is unavailable.');
            break;

        case error.TIMEOUT:
            alert('Time out error.');
            break;

        case error.UNKOWN_ERROR:
            alert('An unkown error occurred.');
            break;
        
        default:
            alert('An unkown error occurred.')
    }
}

button.addEventListener('click', ()=>{
    // getLocation();
    // fetchMap();
    window.location.href = '../pages/home.html'
});

document.addEventListener('DOMContentLoaded', function() {
    // Function to toggle password visibility
    function setupPasswordToggle(toggleButtonId, passwordInputId) {
        const toggleButton = document.getElementById(toggleButtonId);
        const passwordInput = document.getElementById(passwordInputId);
        
        if (toggleButton && passwordInput) {
            toggleButton.addEventListener('click', function() {
                // Toggle between password and text type
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.setAttribute('aria-label', 'Hide password');
                    this.classList.add('password-visible');
                } else {
                    passwordInput.type = 'password';
                    this.setAttribute('aria-label', 'Show password');
                    this.classList.remove('password-visible');
                }
            });
        }
    }
    
    // Set up both password toggle buttons
    setupPasswordToggle('loginPasswordToggle', 'password');
    setupPasswordToggle('signupPasswordToggle', 'signuppassword');
});
// Minimal validation for login form
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    let isValid = true;
    
    // Check email
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        document.getElementById('emailError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('emailError').classList.remove('show');
    }
    
    // Check password
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        document.getElementById('passwordError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('passwordError').classList.remove('show');
    }
    
    // If valid, show success
    if (isValid) {
        alert('Login form is valid!');
        // Add your login logic here
    }
});
