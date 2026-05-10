// =============================
// UTILITY FUNCTIONS
// =============================

function showToast(message, type = 'info') {
    const colors = { info: '#3b82f6', warn: '#f59e0b', error: '#ef4444', success: '#10b981' };
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${colors[type]};color:white;padding:12px 24px;border-radius:12px;font-weight:600;z-index:10000;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.classList.remove('hidden');
    } else {
        console.error('Screen not found:', screenId);
    }
}

// =============================
// DARK MODE FUNCTIONS
// =============================

function createThemeToggle() {
    // Remove existing toggle if any
    const existingToggle = document.querySelector('.theme-toggle');
    if (existingToggle) {
        existingToggle.remove();
    }
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle dark/light mode');
    
    // Set initial icon
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
    
    toggleBtn.onclick = function(e) {
        e.stopPropagation();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('Toggling theme from', currentTheme, 'to', newTheme);
        
        // Apply theme to html element
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('voiceexam_theme', newTheme);
        
        // Update button icon
        this.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Force update on body background
        document.body.style.background = newTheme === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
        
        console.log('Theme changed to:', newTheme);
        console.log('Data-theme attribute:', document.documentElement.getAttribute('data-theme'));
    };
    
    document.body.appendChild(toggleBtn);
    console.log('Theme toggle created');
}

function initDarkMode() {
    console.log('Initializing dark mode...');
    
    // Check for saved preference
    const savedTheme = localStorage.getItem('voiceexam_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = 'light';
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        theme = 'dark';
    }
    
    console.log('Setting initial theme to:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Force body background
    document.body.style.background = theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    
    // Create toggle button
    createThemeToggle();
}

function ensureThemeToggle() {
    if (!document.querySelector('.theme-toggle')) {
        createThemeToggle();
    }
}

// Force theme update function for debugging
function setTheme(theme) {
    console.log('Force setting theme to:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('voiceexam_theme', theme);
    
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
    
    document.body.style.background = theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
}