function attachLoginEvents() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const studentForm = document.getElementById('studentForm');
    const startBtn = document.getElementById('startBtn');

    // Reset to student mode on every call
    studentForm.classList.remove('hidden');
    startBtn.textContent = 'Start Exam →';
    appState.isDoctorMode = false;
    modeBtns.forEach(b => b.classList.remove('active'));
    const studentBtn = document.querySelector('[data-mode="student"]');
    if (studentBtn) studentBtn.classList.add('active');

    modeBtns.forEach(btn => {
        btn.onclick = () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            
            if (mode === 'student') {
                // Student mode - show loginScreen
                appState.isDoctorMode = false;
                studentForm.classList.remove('hidden');
                startBtn.textContent = 'Start Exam →';
                // Change button action
                const newStartBtn = startBtn.cloneNode(true);
                startBtn.parentNode.replaceChild(newStartBtn, startBtn);
                newStartBtn.onclick = handleStudentLogin;
                showScreen('loginScreen');
            } else {
                // Doctor mode - go to adminLoginScreen
                appState.isDoctorMode = true;
                studentForm.classList.add('hidden');
                startBtn.textContent = 'Access Panel →';
                // Change button action to show admin login
                const newStartBtn = startBtn.cloneNode(true);
                startBtn.parentNode.replaceChild(newStartBtn, startBtn);
                newStartBtn.onclick = () => {
                    showScreen('adminLoginScreen');
                    attachAdminLoginEvents();
                };
                showScreen('adminLoginScreen');
                attachAdminLoginEvents();
            }
        };
    });

    // Default: student login
    startBtn.onclick = handleStudentLogin;
}


function attachExamEvents() {
    const micBtn = document.getElementById('micButton');
    const submitBtn = document.getElementById('submitBtn');
    const swapBtn = document.getElementById('swapBtn');
    
    if (micBtn) micBtn.onclick = toggleRecording;
    if (submitBtn) submitBtn.onclick = () => submitCurrentAnswer();
    if (swapBtn) swapBtn.onclick = swapQuestion;
}

function attachAdminEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById('questionsTab').classList.toggle('hidden', tab !== 'questions');
            document.getElementById('resultsTab').classList.toggle('hidden', tab !== 'results');
        };
    });
 
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            doctorSession.isAuthenticated = false;
            appState.isDoctorMode = false;
            showScreen('loginScreen');
            attachLoginEvents();
        };
    }
 
    // ── DOCTOR FEATURE 1: Upload JSON question file ──
    const importBtn = document.getElementById('importJsonBtn');
    if (importBtn) importBtn.onclick = () => importQuestionsFile();
 
    // ── DOCTOR FEATURE 2: Download grades CSV ──
    const exportGradesBtn = document.getElementById('exportAllCsvBtn');
    if (exportGradesBtn) exportGradesBtn.onclick = () => exportGradesFile();
 
    // Detailed export (bonus, keep it working)
    const exportDetailedBtn = document.getElementById('exportDetailedBtn');
    if (exportDetailedBtn) exportDetailedBtn.onclick = () => exportDetailedGradesFile();
 
    // Export questions JSON (bonus)
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) exportJsonBtn.onclick = () => exportQuestionsToJson();
 
    // Add question modal
    const addBtn = document.getElementById('addQuestionBtn');
    if (addBtn) addBtn.onclick = () => showAddQuestionModal();
 
    // Edit/Delete buttons (generated dynamically so attach after render)
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => editQuestion(btn.dataset.id);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => deleteQuestion(btn.dataset.id);
    });
}


function attachLoginEvents() {
    console.log('🔗 attachLoginEvents called');
    
    const modeBtns = document.querySelectorAll('.mode-btn');
    const studentForm = document.getElementById('studentForm');
    const startBtn = document.getElementById('startBtn');

    // Reset to student mode on every call
    if (studentForm) studentForm.classList.remove('hidden');
    if (startBtn) startBtn.textContent = 'Start Exam →';
    appState.isDoctorMode = false;
    modeBtns.forEach(b => b.classList.remove('active'));
    const studentBtn = document.querySelector('[data-mode="student"]');
    if (studentBtn) studentBtn.classList.add('active');

    modeBtns.forEach(btn => {
        btn.onclick = () => {
            console.log('🔘 Mode button clicked:', btn.dataset.mode);
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            
            if (mode === 'student') {
                // Student mode - show loginScreen
                appState.isDoctorMode = false;
                if (studentForm) studentForm.classList.remove('hidden');
                if (startBtn) startBtn.textContent = 'Start Exam →';
                showScreen('loginScreen');
            } else {
                // Doctor mode - show adminLoginScreen
                appState.isDoctorMode = true;
                if (studentForm) studentForm.classList.add('hidden');
                showScreen('adminLoginScreen');
                // Attach events to the admin login screen buttons
                attachAdminLoginEvents();
            }
        };
    });

    // Student login button
    if (startBtn) {
        startBtn.onclick = () => {
            console.log('🎓 Student login clicked');
            handleStudentLogin();
        };
    }
}

function attachAdminLoginEvents() {
    console.log('🔗 attachAdminLoginEvents called');
    
    const loginBtn = document.getElementById('adminLoginBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (loginBtn) {
        // Remove old listeners to prevent duplicates
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        newLoginBtn.onclick = () => {
            console.log('👨‍⚕️ Doctor login button clicked');
            handleDoctorLogin();
        };
    }
    
    if (backBtn) {
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        newBackBtn.onclick = () => {
            console.log('🔙 Back to student login');
            appState.isDoctorMode = false;
            showScreen('loginScreen');
            attachLoginEvents();
        };
    }
}