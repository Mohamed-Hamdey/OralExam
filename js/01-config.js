// =============================
// CONFIGURATION & GLOBAL STATE
// =============================

const STORAGE_KEYS = {
    QUESTION_BANK: 'voiceexam_questions',
    RESULTS: 'voiceexam_results',
    CURRENT_EXAM: 'voiceexam_current_session'
};

let appState = {
    currentScreen: 'login',
    isDoctorMode: false
};

let examSession = {
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

let doctorSession = {
    isAuthenticated: false,
    name: '',
    course: ''
};