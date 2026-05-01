const URL = "https://non-e.onrender.com"; 
const socket = io(URL, {
    withCredentials: true,
    transports: ["websocket", "polling"]
});
const toggleButton = document.getElementById('theme-toggle');
const authModal = document.getElementById('auth');
const accountButton = document.querySelector('.account-button');
const accountDropdown = document.getElementById('account-dropdown');
const editProfileModal = document.getElementById('edit-profile-modal');
const switchFormButtons = document.querySelectorAll('.switch-process');


// --- THEME LOGIC ---
let isDarkMode = false;
toggleButton.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '🌞' : '🌙';
});

document.getElementById('logins').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    socket.emit('login', { email, password });
});

document.getElementById('signups').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelectorAll('input[type="password"]')[0].value;

    socket.emit('signup', { name, email, password });
});

document.getElementById('delusr').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm("Delete account permanently?")) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        socket.emit('deleteAccount', user.email);
    }
});


accountButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const user = localStorage.getItem('currentUser');
    if (!user) authModal.classList.remove('hidden');
    else accountDropdown.classList.toggle('hidden');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    socket.emit('logout');
});

document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    socket.emit('updateProfile', {
        oldEmail: currentUser.email,
        newName: document.getElementById('edit-name').value,
        newEmail: document.getElementById('edit-email').value,
        newPassword: document.getElementById('edit-password').value
    });
});

switchFormButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = button.getAttribute('data-target'); // 'login' or 'signup'
        document.querySelectorAll('.authin').forEach(form => form.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    });
});

// Close buttons for ALL modals
document.querySelectorAll('.close-but').forEach(btn => {
    btn.addEventListener('click', () => {
        authModal.classList.add('hidden');
        editProfileModal.classList.add('hidden');
        document.getElementById('create-chatroom').classList.add('hidden');
        document.getElementById('join-chatroom').classList.add('hidden');
    });
});

// Open Edit Profile Modal
document.getElementById('edit-profile-btn').addEventListener('click', () => {
    accountDropdown.classList.add('hidden');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('edit-name').value = currentUser.name;
        document.getElementById('edit-email').value = currentUser.email;
        editProfileModal.classList.remove('hidden');
    }
});

// Close dropdown if clicking outside
document.addEventListener('click', (e) => {
    if (!accountDropdown.classList.contains('hidden') && !e.target.closest('.account-menu-container')) {
        accountDropdown.classList.add('hidden');
    }
});

// --- UI HELPERS ---
function updateAccountButton() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        accountButton.textContent = currentUser.name.charAt(0).toUpperCase();
        accountButton.style.backgroundColor = '#4f46e5';
    } else {
        accountButton.textContent = '👤';
        accountButton.style.backgroundColor = '#e2e8f0';
    }
}

// --- AUTH ACTIONS ---
socket.on('sessionRestore', (data) => {
    if (data.user) {
        localStorage.setItem('curerentUser', JSON.stringify(data.user));
        authModal.classList.add('hidden');
        updateAccountButton();
    }
});

// 1. Move the listener OUTSIDE the submit event to prevent duplicate alerts
socket.on('signupResponse', (response) => {
    if (response.success) {
        // 2. Save the user data so the messaging functions can access it
        const userData = {
            name: response.user.name,
            email: response.user.email
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));

        document.getElementById('signups').classList.remove('active');
        
        // If you have a main wrapper for the login/signup UI, hide it:
        const authModal = document.getElementById('auth-modal'); // Change to your actual ID
        if (authModal) authModal.classList.add('hidden');

        alert(`Welcome, ${response.user.name}! You are now logged in.`);
        
         socket.emit('getRooms'); 
        
    } else {
        alert(response.message);
    }
});

socket.on('loginResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        authModal.classList.add('hidden');
        updateAccountButton();
    } else {
        alert(res.message);
    }
});

socket.on('signupResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        authModal.classList.add('hidden');
        updateAccountButton();
    } else {
        alert(res.message);
    }
});

socket.on('updateProfileResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        alert("Profile Updated!");
        editProfileModal.classList.add('hidden');
        updateAccountButton();
    }
});

socket.on('deleteResponse', () => {
    localStorage.removeItem('currentUser');
    location.reload();
});

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser')
    window.location.href ='index.html';
})
