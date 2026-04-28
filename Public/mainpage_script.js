import { socket } from './index-script.js';

// ... the rest of your code ...

const toggleButton = document.getElementById('theme-toggle');
const authModal = document.getElementById('auth');
const accountButton = document.querySelector('.account-button');
const accountDropdown = document.getElementById('account-dropdown');
const editProfileModal = document.getElementById('edit-profile-modal');


// Run this when the script loads
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        // Hide auth modal immediately if we have a saved user
        authModal.classList.add('hidden');
        updateAccountButton();
    }
};

// --- THEME LOGIC ---
let isDarkMode = false;
toggleButton.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '🌞' : '🌙';
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
document.getElementById('logins').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    socket.emit('login', { email, password });
});

socket.on('sessionRestore', (data) => {
    if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        authModal.classList.add('hidden');
        updateAccountButton();
        // Trigger a room refresh since we are now confirmed logged in
        socket.emit('getRooms'); 
    } else {
        // If server says no session, clear local storage
        localStorage.removeItem('currentUser');
        authModal.classList.remove('hidden');
    }
});

// 5. Submit Logic
document.getElementById('signups').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelectorAll('input[type="password"]')[0].value;

    socket.emit('signup', { name, email, password });
});


// --- PROFILE EDIT & DELETE ---
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

socket.on('updateProfileResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        alert("Profile Updated!");
        editProfileModal.classList.add('hidden');
        updateAccountButton();
    }
});

document.getElementById('delusr').addEventListener('click', (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const password = prompt("Enter your password to confirm account deletion:");
    if (password && confirm("Delete account permanently?")) {
        socket.emit('deleteAccount', { password: password });
    }
});

socket.on('deleteResponse', () => {
    localStorage.removeItem('currentUser');
    location.reload();
});

// Dropdown Toggles
accountButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const user = localStorage.getItem('currentUser');
    if (!user) authModal.classList.remove('hidden');
    else accountDropdown.classList.toggle('hidden');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    socket.emit('logout');
});

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser')
    window.location.href ='index.html';
})

updateAccountButton();


// Switch between Login and Signup forms
const switchFormButtons = document.querySelectorAll('.switch-process');
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
