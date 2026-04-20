const toggleButton = document.getElementById('theme-toggle');

let isDarkMode = false;

function toggleMode() {
    isDarkMode = !isDarkMode;
    
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    toggleButton.innerHTML = isDarkMode ? '🌞' : '🌙'; 
    
    toggleButton.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
}

toggleButton.addEventListener('click', toggleMode);