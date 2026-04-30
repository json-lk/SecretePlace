// 1. Initialize Socket
const URL = "https://non-e.onrender.com"; 
const socket = io(URL, {
    withCredentials: true, // Crucial for sending MongoDB session cookies
    transports: ["websocket", "polling"]
});

// --- SELECTORS ---
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authModal = document.getElementById('auth');
const closeBut = document.querySelector('.close-but');
const loginForm = document.getElementById('logins');
const signupForm = document.getElementById('signups');

// --- SESSION RESTORATION ---
// Triggered if the server finds a valid session ID in its MongoDB store
socket.on('sessionRestore', (data) => {
    if (data.user) {
        // MongoDB returns '_id', we store the whole object for frontend use
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        const path = window.location.pathname;
        if (path.includes('index.html') || path === '/') {
            window.location.href = 'This page.html'; 
        }
    }
});

// --- UI LOGIC ---
const toggleModal = (show, isLogin = true) => {
    authModal.classList.toggle('hidden', !show);
    if (show) {
        loginForm.classList.toggle('active', isLogin);
        signupForm.classList.toggle('active', !isLogin);
    }
};

signupBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleModal(true, false); });
loginBtn?.addEventListener('click', (e) => { e.preventDefault(); toggleModal(true, true); });
closeBut?.addEventListener('click', () => toggleModal(false));

// --- AUTH ACTIONS ---

// Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = signupForm.querySelector('input[type="text"]').value;
    const email = signupForm.querySelector('input[type="email"]').value;
    const password = signupForm.querySelectorAll('input[type="password"]')[0].value;
    
    // Ensure we aren't sending empty strings to MongoDB
    if(!name || !email || !password) return alert("Please fill all fields");

    socket.emit('signup', { name, email, password });
});

switchForms.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const target = btn.getAttribute('data-target');
    document.querySelectorAll('.authin').forEach(form => form.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    socket.emit('login', { email, password });
});

socket.on('signupResponse', (response) => {
    if (response.success) {
        // MongoDB users have a unique ._id property
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        alert(`Account created! Welcome, ${response.user.name}`);
        window.location.href = 'This page.html'; 
    } else {
        alert("Signup Error: " + response.message);
    }
});

socket.on('loginResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        window.location.href = 'This page.html'; 
    } else {
        // Common MongoDB/Auth error: "User not found" or "Invalid credentials"
        alert(res.message);
    }
});

// Logout
function handleLogout() {
    socket.emit('logout');
}

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});
