// =============================
// MAIN APPLICATION INITIALIZER
// =============================

async function initApp() {
    console.log('Initializing app...');
    
    // Load data first
    await loadInitialQuestionBank();
    loadResults();
    
    // Initialize dark mode FIRST (before hero)
    initDarkMode();
    
    // Initialize hero page
    initHeroPage();
    
    // Show hero screen
    showScreen('heroScreen');
    
    console.log('App initialized successfully');
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);