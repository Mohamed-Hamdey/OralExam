function handleStudentLogin() {
    const errEl = document.getElementById('errorMsg');
    if (errEl) errEl.style.display = 'none';

    const name = document.getElementById('studentName')?.value.trim();
    const course = document.getElementById('courseName')?.value.trim();

    if (!name || !course) {
        if (errEl) {
            errEl.textContent = 'Please fill in your name and course.';
            errEl.style.display = 'block';
        }
        return;
    }

    const allQuestions = loadQuestions();
    if (allQuestions.length === 0) {
        if (errEl) {
            errEl.textContent = 'No questions available. Contact your instructor.';
            errEl.style.display = 'block';
        }
        return;
    }

    const selectedQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    examSession = {
        studentInfo: { name, course },
        selectedQuestions: [selectedQuestion],
        currentIndex: 0,
        answers: [],
        swapUsed: false,
        swapPenaltyApplied: false,
        timeRemaining: 180,
        timerInterval: null,
        isRecording: false,
        currentTranscript: '',
        recognition: null
    };

    renderExamScreen();
}
 
// ── This wires the adminLoginScreen (the separate doctor screen)
//    Keep this too if you have a standalone adminLoginScreen in HTML.

function handleDoctorLogin() {
    console.log('🩺 handleDoctorLogin called');
    
    const errEl = document.getElementById('adminError');
    const nameInput = document.getElementById('adminName');
    const passInput = document.getElementById('adminPassword');
    
    if (!errEl || !nameInput || !passInput) {
        console.error('Admin login elements not found!');
        return;
    }
    
    errEl.style.display = 'none';
    
    const name = nameInput.value.trim();
    const password = passInput.value;
    
    console.log('Doctor login attempt:', { name, hasPassword: !!password });

    if (!name) {
        errEl.textContent = 'Please enter your name.';
        errEl.style.display = 'block';
        return;
    }
    
    if (password !== 'doctor2026') {
        errEl.textContent = 'Incorrect password. Use: doctor2026';
        errEl.style.display = 'block';
        return;
    }
    
    // Login successful
    doctorSession.isAuthenticated = true;
    doctorSession.name = name;
    doctorSession.course = '';
    
    // Clear form
    nameInput.value = '';
    passInput.value = '';
    
    console.log('Doctor authenticated, calling renderAdminDashboard');
    renderAdminDashboard();
}

function submitCurrentAnswer() {
    stopTimer();
    stopRecording();

    const currentQuestion = examSession.selectedQuestions[examSession.currentIndex];
    const scoreResult = scoreAnswer(examSession.currentTranscript, currentQuestion.keywords);

    // Store the answer
    examSession.answers.push({
        transcript: examSession.currentTranscript.trim() || '[No answer provided]',
        score: scoreResult.score,
        matchedKeywords: scoreResult.matchedKeywords,
        missedKeywords: scoreResult.missedKeywords
    });

    // Go directly to final summary
    renderFinalSummaryScreen();
}

function swapQuestion() {
    if (examSession.swapUsed) {
        showToast('You already used your swap!', 'warn');
        return;
    }

    const allQuestions = loadQuestions();
    const currentId = examSession.selectedQuestions[0].id;
    const available = allQuestions.filter(q => q.id !== currentId);

    if (available.length === 0) {
        showToast('No alternative questions available to swap.', 'warn');
        return;
    }

    const confirmed = confirm('⚠️ Swapping will deduct 1 point from your final score. Continue?');
    if (!confirmed) return;

    stopTimer();
    stopRecording();

    const newQuestion = available[Math.floor(Math.random() * available.length)];
    examSession.selectedQuestions[0] = newQuestion;
    examSession.swapUsed = true;

    renderExamScreen();
}

function resetExamSession() {
    if (examSession.recognition) {
        try {
            examSession.isRecording = false;
            examSession.recognition.stop();
        } catch(e) {
            console.log('Recognition stop error:', e);
        }
    }
    if (examSession.timerInterval) {
        clearInterval(examSession.timerInterval);
    }
    
    // Reset to fresh state
    examSession = {
        studentInfo: null,
        selectedQuestions: [],
        currentIndex: 0,
        answers: [],
        swapUsed: false,
        swapPenaltyApplied: false,
        timeRemaining: 180,
        timerInterval: null,
        isRecording: false,
        currentTranscript: '',
        recognition: null
    };
}