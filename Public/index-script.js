// 1. Initialize Socket
const URL = "https://non-e.onrender.com"; 
const socket = io(URL, {
    withCredentials: true,
    transports: ["websocket", "polling"]
});

// --- SELECTORS ---
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authModal = document.getElementById('auth');
const closeBut = document.querySelector('.close-but');
const loginForm = document.getElementById('logins');
const signupForm = document.getElementById('signups');
const switchForms = document.querySelectorAll('.switch-process');

// --- SESSION RESTORATION (The MongoDB Power) ---
// When the page loads, the server checks the MongoDB session cookie.
// If valid, it emits 'sessionRestore' automatically.
socket.on('sessionRestore', (data) => {
    if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        // If they are on the landing page, send them to the chat
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            window.location.href = 'This page.html'; 
        }
    }
});

// --- UI LOGIC ---
signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    authModal.classList.remove('hidden');
    loginForm.classList.remove('active'); // Use 'active' to match your CSS classes
    signupForm.classList.add('active');
});

loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    authModal.classList.remove('hidden');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
});

closeBut.addEventListener('click', () => authModal.classList.add('hidden'));

// --- AUTH ACTIONS ---

// Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = signupForm.querySelector('input[type="text"]').value;
    const email = signupForm.querySelector('input[type="email"]').value;
    const password = signupForm.querySelectorAll('input[type="password"]')[0].value;
    
    socket.emit('signup', { name, email, password });
});

socket.on('signupResponse', (response) => {
    if (response.success) {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        alert(`Welcome, ${response.user.name}!`);
        window.location.href = 'This page.html'; 
    } else {
        alert("Signup failed: " + response.message);
    }
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    socket.emit('login', { email, password });
});

socket.on('loginResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        window.location.href = 'This page.html'; 
    } else {
        alert(res.message);
    }
});

// Logout (Add this to your logout button in the UI)
function handleLogout() {
    socket.emit('logout');
}

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});