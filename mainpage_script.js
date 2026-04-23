const toggleButton = document.getElementById('theme-toggle');

let isDarkMode = false;

function toggleMode() {
    isDarkMode = !isDarkMode;
    
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    toggleButton.innerHTML = isDarkMode ? '🌞' : '🌙'; 
    
    toggleButton.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
}

toggleButton.addEventListener('click', toggleMode);


const authModal = document.getElementById('auth');
const accountButton = document.querySelector('.account-button');
const modalClose = document.querySelector('.close-but');
const switchFormButtons = document.querySelectorAll('.switch-process');
const loginForm = document.getElementById('logins');
const signupForm = document.getElementById('signups');
const deleteUserBtn = document.getElementById('delusr');

const accountDropdown = document.getElementById('account-dropdown');
const editProfileBtn = document.getElementById('edit-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileForm = document.getElementById('edit-profile-form');
const editProfileClose = editProfileModal.querySelector('.close-but');
const editNameInput = document.getElementById('edit-name');
const editEmailInput = document.getElementById('edit-email');
const editPasswordInput = document.getElementById('edit-password');


accountButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        authModal.classList.remove('hidden');
    } else {
        accountDropdown.classList.toggle('hidden');
    }
});


modalClose.addEventListener('click', () => {
    authModal.classList.add('hidden');
});


authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.classList.add('hidden');
    }
});


switchFormButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = button.getAttribute('data-target');
        
        
        document.querySelectorAll('.authin').forEach(form => {
            form.classList.remove('active');
        });
        
        
        document.getElementById(targetId).classList.add('active');
    });
});


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;
    
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    

    const user = users.find(u => u.email === email);
    
    if (user && user.password === password) {
        
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email
        }));
        
        alert('Login successful! Welcome, ' + user.name);
        authModal.classList.add('hidden');
        loginForm.reset();
        updateAccountButton();
    } else {
        alert('Invalid email or password. Please try again.');
    }
});


signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = signupForm.querySelector('input[type="text"]').value;
    const email = signupForm.querySelectorAll('input[type="email"]')[0].value;
    const password = signupForm.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = signupForm.querySelectorAll('input[type="password"]')[1].value;
    
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    

    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }


    const users = JSON.parse(localStorage.getItem('users') || '[]');
    

    if (users.find(u => u.email === email)) {
        alert('This email is already registered!');
        return;
    }
    
    
    users.push({
        name: name,
        email: email,
        password: password
    });
    
    
    localStorage.setItem('users', JSON.stringify(users));
    
    
    localStorage.setItem('currentUser', JSON.stringify({
        name: name,
        email: email
    }));
    
    alert('Account created successfully! Welcome, ' + name);
    authModal.classList.add('hidden');
    signupForm.reset();
    updateAccountButton();
});


function updateAccountButton() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const button = document.querySelector('.account-button');
    
    if (currentUser) {
        button.textContent = currentUser.name.charAt(0).toUpperCase();
        button.title = 'Logged in as: ' + currentUser.email;
        button.style.backgroundColor = '#4f46e5';
        button.style.color = '#ffffff';
    } else {
        button.textContent = '👤';
        button.title = 'Click to log in or sign up';
        button.style.backgroundColor = '#e2e8f0';
        button.style.color = '#ffffff';
    }
}


document.addEventListener('click', (e) => {
    if (!accountDropdown.classList.contains('hidden') && 
        !e.target.closest('.account-menu-container')) {
        accountDropdown.classList.add('hidden');
    }
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------------//
editProfileBtn.addEventListener('click', () => {
    accountDropdown.classList.add('hidden');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        editNameInput.value = currentUser.name;
        editEmailInput.value = currentUser.email;
        editPasswordInput.value = '';
        editProfileModal.classList.remove('hidden');
    }
});


editProfileClose.addEventListener('click', () => {
    editProfileModal.classList.add('hidden');
});

editProfileModal.addEventListener('click', (e) => {
    if (e.target === editProfileModal) {
        editProfileModal.classList.add('hidden');
    }
});


editProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newName = editNameInput.value.trim();
    const newEmail = editEmailInput.value.trim();
    const newPassword = editPasswordInput.value.trim();
    
    if (!newName) {
        alert('Name cannot be empty!');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users') || '[]');


    const userIndex = users.findIndex(u => u.email === currentUser.email);
    
    if (userIndex === -1) {
        alert('User not found!');
        return;
    }
    
    
    if (newEmail !== currentUser.email && users.find(u => u.email === newEmail)) {
        alert('This email is already registered!');
        return;
    }
    

    users[userIndex].name = newName;
    users[userIndex].email = newEmail;
    
    if (newPassword && newPassword.length >= 6) {
        users[userIndex].password = newPassword;
    } else if (newPassword && newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    
    localStorage.setItem('users', JSON.stringify(users));


    localStorage.setItem('currentUser', JSON.stringify({
        name: newName,
        email: newEmail
    }));
    
    alert('Profile updated successfully!');
    editProfileModal.classList.add('hidden');
    updateAccountButton();
});


logoutBtn.addEventListener('click', () => {
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
        localStorage.removeItem('currentUser');
        accountDropdown.classList.add('hidden');
        updateAccountButton();
        alert('You have been logged out.');
    }
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------------//

const chatroomExitBtn = document.getElementById('exit');
const chatroomSettingsBtn = document.getElementById('settings');
const chatroom = document.querySelector('.chatroom');


chatroomExitBtn.addEventListener('click', () => {
    if (chatroom.style.display === 'none') {
        chatroom.style.display = 'flex';
        chatroom.style.flexDirection = 'column';
    } else {
        chatroom.style.display = 'none';
    }
});


chatroomSettingsBtn.addEventListener('click', () => {
    alert('Chatroom settings coming soon!');
});


document.addEventListener('DOMContentLoaded', updateAccountButton);

//----------------------------------------------------------------------------------------------------------------------------------------------------------------//

deleteUserBtn.addEventListener('click', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');

        if (confirmDelete) {
            
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === currentUser.email);

            if (userIndex !== -1) {
                users.splice(userIndex, 1); 
                localStorage.setItem('users', JSON.stringify(users)); 
                localStorage.removeItem('currentUser'); 
                updateAccountButton(); 
                alert('Your account has been deleted successfully.');
            } else {
                alert('User not found!');
            }
        }
    } else {
        alert('You must be logged in to delete your account.');
    }
});
