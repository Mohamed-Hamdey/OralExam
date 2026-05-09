
async function initApp() {
    await loadInitialQuestionBank();
    loadResults();
    showScreen('loginScreen');
    attachLoginEvents();
}


document.addEventListener('DOMContentLoaded', initApp);