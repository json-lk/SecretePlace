
fetch('users.json')
.then(response => response.json())
.then(data => {
  const existing = JSON.parse(localStorage.getItem('users') || '[]');
  const merged = [...data, ...existing];
  localStorage.setItem('users', JSON.stringify(merged));
})
.catch(err => console.error('Error loading users:', err));

const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authModal = document.getElementById('auth');
const closeBut = document.querySelector('.close-but');
const switchForms = document.querySelectorAll('.switch-process');
const loginForm = document.getElementById('logins');
const signupForm = document.getElementById('signups');

signupBtn.addEventListener('click', (e) => {
  e.preventDefault();
  authModal.classList.remove('hidden');
  loginForm.classList.remove('active');
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
    window.location.href = 'This page.html';
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
  window.location.href = 'This page.html';
});
