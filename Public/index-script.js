// This works because the CDN script adds 'io' to the global window object
const URL = "https://non-e.onrender.com"; // Put your actual Render URL here

// Initialize socket connection with Vercel-compatible settings
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authModal = document.getElementById('auth');
const closeBut = document.querySelector('.close-but');
const loginForm = document.getElementById('logins');
const signupForm = document.getElementById('signups');
const switchForms = document.querySelectorAll('.switch-process');

signupBtn.addEventListener('click', (e) => {
  e.preventDefault();
  authModal.classList.remove('hidden');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('active');
});

loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  authModal.classList.remove('hidden');
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
});

closeBut.addEventListener('click', () => {
  authModal.classList.add('hidden');
});

authModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    authModal.classList.add('hidden');
  }
});

switchForms.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const target = btn.getAttribute('data-target');
    document.querySelectorAll('.authin').forEach(form => form.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// Handle signup form submission
// Keep the listener outside the submit block to avoid memory leaks
socket.on('signupResponse', (response) => {
    if (response.success) {
        // --- THE "AUTO-LOGIN" MAGIC ---
        // We save the user data returned from the server into localStorage
        // This makes the user 'persist' across page refreshes and redirects
        const userData = {
            name: response.user.name,
            email: response.user.email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));

        alert("Welcome, " + response.user.name + "! Logging you in...");
        
        // Redirect to the chat page
        window.location.href = 'This page.html'; 
    } else {
        alert("Signup failed: " + response.message);
    }
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = signupForm.querySelector('input[type="text"]').value;
    const email = signupForm.querySelector('input[type="email"]').value;
    const password = signupForm.querySelectorAll('input[type="password"]')[0].value;
    
    socket.emit('signup', { name, email, password });
});

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = loginForm.querySelector('input[type="email"]').value;
  const password = loginForm.querySelector('input[type="password"]').value;

  socket.emit('login', { email, password });
  socket.on('loginResponse', (res) => {
    if (res.success) {
        // SAVE HERE first before moving pages
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        // Then move to the chat page
        window.location.href = 'This page.html'; 
    } else {
        alert(res.message);
    }
});
});
