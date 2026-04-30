const URL = "https://non-e.onrender.com"; 
const socket = io(URL, {
    withCredentials: true,
    transports: ["websocket", "polling"]
});

// --- SELECTORS ---
const authModal = document.getElementById('auth');
const accountButton = document.querySelector('.account-button');
const accountDropdown = document.getElementById('account-dropdown');
const editProfileModal = document.getElementById('edit-profile-modal');
const toggleButton = document.getElementById('theme-toggle');

// --- THEME LOGIC ---
let isDarkMode = false;
toggleButton.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '🌞' : '🌙';
});

// --- AUTH SUBMISSIONS ---
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

// --- NEW: CREATE ROOM LOGIC ---
// Ensure you have a form with ID 'create-room-form'
const createRoomForm = document.getElementById('create-room-form');
if (createRoomForm) {
    createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomName = document.getElementById('room-name-input').value;
        const roomPass = document.getElementById('room-password-input').value;
        
        socket.emit('createRoom', { name: roomName, password: roomPass });
    });
}

// --- ACCOUNT ACTIONS ---
accountButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const user = localStorage.getItem('currentUser');
    if (!user) {
        authModal.classList.remove('hidden');
    } else {
        accountDropdown.classList.toggle('hidden');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    socket.emit('logout');
});

document.getElementById('delusr').addEventListener('click', (e) => {
    e.preventDefault();
    const pass = prompt("Please enter your password to confirm deletion:");
    if (pass) {
        socket.emit('deleteAccount', { password: pass });
    }
});

// --- SOCKET LISTENERS (The MongoDB Sync) ---

// Fix: typo in 'curerentUser' fixed to 'currentUser'
socket.on('sessionRestore', (data) => {
    if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        authModal.classList.add('hidden');
        updateAccountButton();
    }
});

socket.on('loginResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        authModal.classList.add('hidden');
        updateAccountButton();
        alert("Logged in successfully!");
    } else {
        alert(res.message);
    }
});

socket.on('signupResponse', (res) => {
    if (res.success) {
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        authModal.classList.add('hidden');
        updateAccountButton();
        alert(`Welcome, ${res.user.name}!`);
    } else {
        alert(res.message);
    }
});

socket.on('room-created-success', (newRoom) => {
    alert(`Room "${newRoom.name}" created!`);
    document.getElementById('create-chatroom').classList.add('hidden');
    // The server handles sending the updated list via initRooms usually
});

socket.on('errorMsg', (msg) => {
    alert("Error: " + msg);
});

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// --- UI HELPERS ---
function updateAccountButton() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        const currentUser = JSON.parse(userJson);
        accountButton.textContent = currentUser.name.charAt(0).toUpperCase();
        accountButton.style.backgroundColor = '#4f46e5';
    } else {
        accountButton.textContent = '👤';
        accountButton.style.backgroundColor = '#e2e8f0';
    }
}

// Initialize UI
updateAccountButton();