// =============================
// 🔹 VOICEEXAM - COMPLETE APPLICATION
// =============================

// =============================
// STORAGE KEYS
// =============================
const STORAGE_KEYS = {
    QUESTION_BANK: 'voiceexam_questions',
    RESULTS: 'voiceexam_results',
    CURRENT_EXAM: 'voiceexam_current_session'
};

// =============================
// GLOBAL STATE
// =============================
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

// =============================
// INITIALIZATION
// =============================
async function initApp() {
    await loadInitialQuestionBank();
    loadResults();
    renderLoginScreen();
}

async function loadInitialQuestionBank() {
    // Check if questions exist in localStorage
    let questions = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
    
    if (!questions) {
        try {
            // Try loading from external JSON file
            const response = await fetch('questions_bank.json');
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(data.questions));
            console.log('✅ Loaded default question bank');
        } catch (error) {
            console.error('Failed to load questions_bank.json, using fallback:', error);
            // Fallback questions
            const fallbackQuestions = getFallbackQuestions();
            localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(fallbackQuestions));
        }
    }
}

function getFallbackQuestions() {
    return [
        {
            id: Date.now() + "_1",
            question: "Explain the process of cell mitosis.",
            answer: "Mitosis is the process of cell division.",
            keywords: ["mitosis", "**cell division**", "prophase", "metaphase", "anaphase", "telophase"]
        },
        {
            id: Date.now() + "_2",
            question: "What are Newton's three laws of motion?",
            answer: "Inertia, F=ma, and Action-Reaction.",
            keywords: ["**inertia**", "**f=ma**", "**action-reaction**"]
        }
    ];
}

function loadQuestions() {
    const questions = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
    return questions ? JSON.parse(questions) : [];
}

function saveQuestions(questions) {
    localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(questions));
}

function loadResults() {
    const results = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return results ? JSON.parse(results) : [];
}

function saveResult(result) {
    const results = loadResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
}

// =============================
// SCORING ENGINE
// =============================
function scoreAnswer(transcript, keywords) {
    const normalizedText = transcript.toLowerCase();
    let totalWeight = 0;
    let earnedWeight = 0;
    let matchedKeywords = [];
    let missedKeywords = [];
    
    for (const keyword of keywords) {
        let weight = 1;
        let searchTerm = keyword;
        
        // Check for double-weight keywords (**keyword**)
        if (keyword.startsWith('**') && keyword.endsWith('**')) {
            weight = 2;
            searchTerm = keyword.slice(2, -2);
        }
        
        totalWeight += weight;
        
        if (normalizedText.includes(searchTerm.toLowerCase())) {
            earnedWeight += weight;
            matchedKeywords.push(searchTerm);
        } else {
            missedKeywords.push(searchTerm);
        }
    }
    
    const rawScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 10 : 0;
    const finalScore = Math.min(10, Math.max(0, rawScore));
    
    return {
        score: parseFloat(finalScore.toFixed(2)),
        earnedWeight,
        totalWeight,
        matchedKeywords,
        missedKeywords
    };
}

function calculateFinalGrade(totalScore, maxScore, swapUsed) {
    let finalTotal = totalScore;
    if (swapUsed) {
        finalTotal = Math.max(0, finalTotal - 1);
    }
    
    const percentage = (finalTotal / maxScore) * 100;
    let grade = '';
    
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    else grade = 'F';
    
    return {
        totalScore: finalTotal,
        percentage: parseFloat(percentage.toFixed(2)),
        grade
    };
}

// =============================
// SPEECH RECOGNITION (FIXED)
// =============================
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
        return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
        console.log('🎤 Recording started');
        examSession.isRecording = true;
        updateMicrophoneButton(true);
    };
    
    recognition.onend = () => {
        console.log('🎤 Recording stopped');
        examSession.isRecording = false;
        updateMicrophoneButton(false);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        examSession.isRecording = false;
        updateMicrophoneButton(false);
        
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone permissions and try again.');
        } else if (event.error === 'no-speech') {
            console.log('No speech detected');
        }
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Append final transcript to the session transcript
        if (finalTranscript) {
            examSession.currentTranscript += ' ' + finalTranscript;
        }
        
        // Update UI with both interim and final
        updateTranscriptDisplay(interimTranscript, finalTranscript);
    };
    
    return recognition;
}

function startRecording() {
    if (!examSession.recognition) {
        examSession.recognition = initSpeechRecognition();
    }
    
    if (examSession.recognition && !examSession.isRecording) {
        try {
            examSession.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            // Restart recognition if needed
            examSession.recognition = initSpeechRecognition();
            if (examSession.recognition) {
                examSession.recognition.start();
            }
        }
    }
}

function stopRecording() {
    if (examSession.recognition && examSession.isRecording) {
        examSession.recognition.stop();
    }
}

function updateMicrophoneButton(isRecording) {
    const micBtn = document.getElementById('micButton');
    if (micBtn) {
        if (isRecording) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '🎙️ Recording... Stop';
        } else {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '🎙️ Start Recording';
        }
    }
}

function updateTranscriptDisplay(interim, final) {
    const transcriptElement = document.getElementById('liveTranscript');
    const fullTranscriptElement = document.getElementById('fullTranscript');
    
    if (transcriptElement) {
        let displayText = examSession.currentTranscript.trim();
        if (interim) {
            displayText += (displayText ? ' ' : '') + interim;
        }
        transcriptElement.innerHTML = displayText || '<span style="color: #888;">Speak your answer here...</span>';
    }
    
    if (fullTranscriptElement) {
        fullTranscriptElement.value = examSession.currentTranscript.trim();
    }
}

// =============================
// TIMER FUNCTIONS
// =============================
function startTimer() {
    if (examSession.timerInterval) {
        clearInterval(examSession.timerInterval);
    }
    
    examSession.timerInterval = setInterval(() => {
        if (examSession.timeRemaining <= 0) {
            stopTimer();
            handleTimeOut();
        } else {
            examSession.timeRemaining--;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    if (examSession.timerInterval) {
        clearInterval(examSession.timerInterval);
        examSession.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    const progressBar = document.getElementById('timerProgress');
    
    if (timerElement) {
        const minutes = Math.floor(examSession.timeRemaining / 60);
        const seconds = examSession.timeRemaining % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is low
        if (examSession.timeRemaining <= 30) {
            timerElement.style.color = '#ff4444';
        } else if (examSession.timeRemaining <= 60) {
            timerElement.style.color = '#ffaa44';
        } else {
            timerElement.style.color = '#4caf50';
        }
    }
    
    if (progressBar) {
        const percentage = (examSession.timeRemaining / 180) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

function handleTimeOut() {
    stopRecording();
    alert('⏰ Time is up! Submitting your answer...');
    submitCurrentAnswer();
}

// =============================
// RENDER FUNCTIONS
// =============================

// Login Screen
function renderLoginScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div class="glass-card">
                <div class="logo">
                    <div class="logo-icon">🎤</div>
                    <h1>VoiceExam</h1>
                    <p>AI-Powered Oral Examination Platform</p>
                </div>
                
                <div class="mode-selector">
                    <button class="mode-btn active" data-mode="student">📝 Student</button>
                    <button class="mode-btn" data-mode="doctor">👨‍⚕️ Doctor</button>
                </div>
                
                <div id="studentForm" class="form-group">
                    <input type="text" id="studentName" placeholder="Full Name" class="input-field">
                    <input type="text" id="studentId" placeholder="Student ID" class="input-field">
                    <input type="text" id="courseName" placeholder="Course Name" class="input-field">
                </div>
                
                <div id="doctorForm" class="form-group hidden">
                    <input type="text" id="doctorName" placeholder="Doctor Name" class="input-field">
                    <input type="text" id="doctorCourse" placeholder="Course ID" class="input-field">
                    <input type="password" id="doctorPassword" placeholder="Admin Password" class="input-field">
                </div>
                
                <button id="startBtn" class="btn-primary">Start Exam →</button>
            </div>
        </div>
    `;
    
    // Mode toggle functionality
    const modeBtns = document.querySelectorAll('.mode-btn');
    const studentForm = document.getElementById('studentForm');
    const doctorForm = document.getElementById('doctorForm');
    const startBtn = document.getElementById('startBtn');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const mode = btn.dataset.mode;
            appState.isDoctorMode = mode === 'doctor';
            
            if (mode === 'student') {
                studentForm.classList.remove('hidden');
                doctorForm.classList.add('hidden');
                startBtn.textContent = 'Start Exam →';
            } else {
                studentForm.classList.add('hidden');
                doctorForm.classList.remove('hidden');
                startBtn.textContent = 'Access Panel →';
            }
        });
    });
    
    startBtn.addEventListener('click', handleLogin);
}

// Exam Screen
function renderExamScreen() {
    const currentQuestion = examSession.selectedQuestions[examSession.currentIndex];
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="container">
            <div class="exam-header">
                <div class="student-info">
                    <strong>${examSession.studentInfo.name}</strong> | 
                    ${examSession.studentInfo.id} | 
                    ${examSession.studentInfo.course}
                </div>
            </div>
            
            <div class="glass-card exam-card">
                <div class="timer-section">
                    <div class="timer-display">
                        <span class="timer-icon">⏱️</span>
                        <span id="timer">3:00</span>
                    </div>
                    <div class="timer-bar">
                        <div id="timerProgress" class="timer-progress"></div>
                    </div>
                </div>
                
                <div class="question-section">
                    <h2>${currentQuestion.question}</h2>
                </div>
                
                <div class="transcript-section">
                    <div class="transcript-label">Your Answer:</div>
                    <div id="liveTranscript" class="live-transcript">
                        <span style="color: #888;">Click the microphone and start speaking...</span>
                    </div>
                    <textarea id="fullTranscript" class="transcript-textarea" placeholder="Your transcript will appear here..." readonly></textarea>
                </div>
                
                <div class="action-buttons">
                    <button id="micButton" class="btn-mic">🎙️ Start Recording</button>
                    <button id="submitBtn" class="btn-submit">✓ Submit Answer</button>
                    <button id="swapBtn" class="btn-swap" ${examSession.swapUsed ? 'disabled' : ''}>
                        🔄 Swap Question ${!examSession.swapUsed ? '(1 remaining)' : '(Used)'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Attach event listeners
    document.getElementById('micButton').addEventListener('click', toggleRecording);
    document.getElementById('submitBtn').addEventListener('click', () => submitCurrentAnswer());
    document.getElementById('swapBtn').addEventListener('click', swapQuestion);
    
    // Start timer
    examSession.timeRemaining = 180;
    updateTimerDisplay();
    startTimer();
}

// Score Screen (per question)
function renderScoreScreen(scoreData) {
    const app = document.getElementById('app');
    const isLastQuestion = examSession.currentIndex === examSession.selectedQuestions.length - 1;
    
    app.innerHTML = `
        <div class="container">
            <div class="glass-card score-card">
                <div class="score-header">
                    <div class="score-circle">
                        <span class="score-value">${scoreData.score}</span>
                        <span class="score-max">/10</span>
                    </div>
                    <h2>Question ${examSession.currentIndex + 1} Result</h2>
                </div>
                
                <div class="keywords-section">
                    <div class="keywords-matched">
                        <h3>✅ Matched Keywords</h3>
                        <div class="keyword-tags">
                            ${scoreData.matchedKeywords.length > 0 
                                ? scoreData.matchedKeywords.map(k => `<span class="tag matched">${k}</span>`).join('')
                                : '<p class="no-keywords">No keywords matched</p>'
                            }
                        </div>
                    </div>
                    
                    <div class="keywords-missed">
                        <h3>❌ Missed Keywords</h3>
                        <div class="keyword-tags">
                            ${scoreData.missedKeywords.map(k => `<span class="tag missed">${k}</span>`).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="answer-review">
                    <h3>📝 Your Answer</h3>
                    <div class="answer-box">${examSession.currentTranscript || 'No answer provided'}</div>
                    
                    <details>
                        <summary>📖 View Model Answer</summary>
                        <div class="model-answer">
                            ${examSession.selectedQuestions[examSession.currentIndex].answer}
                        </div>
                    </details>
                </div>
                
                <button id="nextBtn" class="btn-primary">
                    📊 View Final Results
                </button>
            </div>
        </div>
    `;
    
        document.getElementById('nextBtn').addEventListener('click', () => {
            renderFinalSummaryScreen();
        });
}

// Final Summary Screen
function renderFinalSummaryScreen() {
    // Calculate total score (single question)
    let totalEarned = examSession.answers[0]?.score || 0;
    const maxScore = 10; // Fixed at 10 for single question
    const finalGrade = calculateFinalGrade(totalEarned, maxScore, examSession.swapUsed);
    
    app.innerHTML = `
        <div class="container">
            <div class="glass-card summary-card">
                <div class="summary-header">
                    <div class="final-grade-circle">
                        <span class="grade-letter">${finalGrade.grade}</span>
                        <span class="grade-percent">${finalGrade.percentage}%</span>
                    </div>
                    <h1>Exam Complete!</h1>
                </div>
                
                <div class="score-summary">
                    <div class="score-row">
                        <span>Total Score:</span>
                        <strong>${finalGrade.totalScore} / ${maxScore}</strong>
                    </div>
                    <div class="score-row">
                        <span>Percentage:</span>
                        <strong>${finalGrade.percentage}%</strong>
                    </div>
                    <div class="score-row">
                        <span>Letter Grade:</span>
                        <strong class="grade-${finalGrade.grade.replace('+', '')}">${finalGrade.grade}</strong>
                    </div>
                    ${examSession.swapUsed ? '<div class="score-row penalty"><span>Swap Penalty:</span><strong>-1 point</strong></div>' : ''}
                </div>
                
                <div class="questions-breakdown">
                    <h3>Question Breakdown</h3>
                    <div class="breakdown-table">
                        ${examSession.answers.map((answer, idx) => `
                            <div class="breakdown-row">
                                <div class="q-num">Q${idx + 1}</div>
                                <div class="q-score">${answer.score}/10</div>
                                <div class="q-status ${answer.score >= 7 ? 'good' : answer.score >= 5 ? 'average' : 'poor'}">
                                    ${answer.score >= 7 ? '✅ Good' : answer.score >= 5 ? '⚠️ Average' : '❌ Needs Improvement'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="summary-actions">
                    <button id="exportBtn" class="btn-secondary">📥 Export Results (CSV)</button>
                    <button id="newExamBtn" class="btn-primary">🔄 New Exam</button>
                    ${!appState.isDoctorMode ? '<button id="adminBtn" class="btn-secondary">👨‍⚕️ Admin Panel</button>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Save result to localStorage
    const result = {
        id: Date.now(),
        name: examSession.studentInfo.name,
        sid: examSession.studentInfo.id,
        course: examSession.studentInfo.course,
        date: new Date().toLocaleString(),
        totalScore: finalGrade.totalScore,
        maxScore: maxScore,
        percentage: finalGrade.percentage,
        grade: finalGrade.grade,
        swapUsed: examSession.swapUsed,
        questions: examSession.answers.map((answer, idx) => ({
            questionText: examSession.selectedQuestions[idx].question,
            studentAnswer: answer.transcript,
            score: answer.score,
            keywordsMatched: answer.matchedKeywords,
            keywordsMissed: answer.missedKeywords
        }))
    };
    
    saveResult(result);
    
    document.getElementById('exportBtn').addEventListener('click', () => exportSingleResult(result));
    document.getElementById('newExamBtn').addEventListener('click', () => {
        resetExamSession();
        renderLoginScreen();
    });
    
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            appState.isDoctorMode = true;
            renderAdminLoginScreen();
        });
    }
}

// Admin Panel
function renderAdminLoginScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div class="glass-card">
                <div class="logo">
                    <div class="logo-icon">👨‍⚕️</div>
                    <h1>Doctor Panel</h1>
                    <p>Administrator Access</p>
                </div>
                
                <div class="form-group">
                    <input type="text" id="adminName" placeholder="Doctor Name" class="input-field">
                    <input type="password" id="adminPassword" placeholder="Admin Password" class="input-field">
                </div>
                
                <button id="adminLoginBtn" class="btn-primary">Access Panel →</button>
                <button id="backBtn" class="btn-secondary">← Back to Student Login</button>
            </div>
        </div>
    `;
    
    document.getElementById('adminLoginBtn').addEventListener('click', () => {
        const name = document.getElementById('adminName').value.trim();
        const password = document.getElementById('adminPassword').value;
        
        if (!name) {
            alert('Please enter your name');
            return;
        }
        
        if (password !== 'doctor2026') {
            alert('Invalid password');
            return;
        }
        
        doctorSession.isAuthenticated = true;
        doctorSession.name = name;
        renderAdminDashboard();
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
        appState.isDoctorMode = false;
        renderLoginScreen();
    });
}

function renderAdminDashboard() {
    const questions = loadQuestions();
    const results = loadResults();
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <div class="glass-card admin-dashboard">
                <div class="admin-header">
                    <h1>👨‍⚕️ Doctor Dashboard</h1>
                    <p>Welcome, ${doctorSession.name}</p>
                    <button id="logoutBtn" class="btn-small">Logout</button>
                </div>
                
                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="questions">📋 Question Bank</button>
                    <button class="tab-btn" data-tab="results">📊 Student Results</button>
                </div>
                
                <div id="questionsTab" class="tab-content active">
                    <div class="question-actions">
                        <button id="addQuestionBtn" class="btn-secondary">+ Add Question</button>
                        <button id="importJsonBtn" class="btn-secondary">📁 Import JSON</button>
                        <button id="exportJsonBtn" class="btn-secondary">📤 Export JSON</button>
                    </div>
                    
                    <div class="questions-list">
                        ${questions.map((q, idx) => `
                            <div class="question-item">
                                <div class="question-text">
                                    <strong>Q${idx + 1}:</strong> ${q.question}
                                </div>
                                <div class="question-actions">
                                    <button class="btn-icon edit-btn" data-id="${q.id}">✏️</button>
                                    <button class="btn-icon delete-btn" data-id="${q.id}">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div id="resultsTab" class="tab-content hidden">
                    <div class="results-actions">
                        <button id="exportAllCsvBtn" class="btn-primary">📥 Export All Results (CSV)</button>
                        <input type="text" id="filterCourse" placeholder="Filter by course..." class="input-field small">
                    </div>
                    
                    <div class="results-table-container">
                        <table class="results-table">
                            <thead>
                                <tr><th>Date</th><th>Student</th><th>ID</th><th>Course</th><th>Score</th><th>Grade</th><th>Swap</th></tr>
                            </thead>
                            <tbody id="resultsTableBody">
                                ${results.map(r => `
                                    <tr>
                                        <td>${r.date}</td>
                                        <td>${r.name}</td>
                                        <td>${r.sid}</td>
                                        <td>${r.course}</td>
                                        <td>${r.totalScore}/${r.maxScore}</td>
                                        <td class="grade-${r.grade.replace('+', '')}">${r.grade}</td>
                                        <td>${r.swapUsed ? 'Yes' : 'No'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const questionsTab = document.getElementById('questionsTab');
    const resultsTab = document.getElementById('resultsTab');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            if (tab === 'questions') {
                questionsTab.classList.remove('hidden');
                resultsTab.classList.add('hidden');
            } else {
                questionsTab.classList.add('hidden');
                resultsTab.classList.remove('hidden');
            }
        });
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        doctorSession.isAuthenticated = false;
        appState.isDoctorMode = false;
        renderLoginScreen();
    });
    
    document.getElementById('addQuestionBtn').addEventListener('click', showAddQuestionModal);
    document.getElementById('importJsonBtn').addEventListener('click', () => importQuestions());
    document.getElementById('exportJsonBtn').addEventListener('click', exportQuestionsToJson);
    document.getElementById('exportAllCsvBtn').addEventListener('click', exportAllResults);
    
    // Edit/Delete functionality
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editQuestion(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteQuestion(btn.dataset.id));
    });
    
    const filterInput = document.getElementById('filterCourse');
    if (filterInput) {
        filterInput.addEventListener('input', filterResults);
    }
}

// =============================
// EXAM FLOW FUNCTIONS
// =============================
function handleLogin() {
    if (!appState.isDoctorMode) {
        const name = document.getElementById('studentName')?.value.trim();
        const id = document.getElementById('studentId')?.value.trim();
        const course = document.getElementById('courseName')?.value.trim();
        
        if (!name || !id || !course) {
            alert('Please fill in all fields');
            return;
        }
        
        const allQuestions = loadQuestions();
        if (allQuestions.length === 0) {
            alert('No questions available. Please contact your instructor.');
            return;
        }
        
        // Select ONE random question
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        const selectedQuestion = allQuestions[randomIndex];
        
        examSession = {
            studentInfo: { name, id, course },
            selectedQuestions: [selectedQuestion], // Only one question
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
    else {
        const name = document.getElementById('doctorName')?.value.trim();
        const course = document.getElementById('doctorCourse')?.value.trim();
        const password = document.getElementById('doctorPassword')?.value;
        
        if (!name || !course) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== 'doctor2026') {
            alert('Invalid password');
            return;
        }
        
        doctorSession.isAuthenticated = true;
        doctorSession.name = name;
        doctorSession.course = course;
        renderAdminDashboard();
    }
}

function toggleRecording() {
    if (examSession.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function submitCurrentAnswer() {
    stopTimer();
    stopRecording();
    
    const currentQuestion = examSession.selectedQuestions[examSession.currentIndex];
    const scoreResult = scoreAnswer(examSession.currentTranscript, currentQuestion.keywords);
    
    // Store answer
    examSession.answers.push({
        transcript: examSession.currentTranscript || '[No answer provided]',
        score: scoreResult.score,
        matchedKeywords: scoreResult.matchedKeywords,
        missedKeywords: scoreResult.missedKeywords
    });
    
    renderScoreScreen(scoreResult);
}

function swapQuestion() {
    if (examSession.swapUsed) {
        alert('You have already used your one question swap!');
        return;
    }
    
    const allQuestions = loadQuestions();
    const currentQuestionId = examSession.selectedQuestions[0].id;
    const availableQuestions = allQuestions.filter(q => q.id !== currentQuestionId);
    
    if (availableQuestions.length === 0) {
        alert('No alternative questions available to swap!');
        return;
    }
    
    const confirmSwap = confirm('⚠️ Warning: Using swap will deduct 1 point from your final total score. Do you want to continue?');
    if (!confirmSwap) return;
    
    // Replace with a different random question
    const newQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    examSession.selectedQuestions[0] = newQuestion;
    examSession.swapUsed = true;
    
    // Reset transcript for new question
    examSession.currentTranscript = '';
    
    alert('Question swapped successfully! -1 point will be applied to final score.');
    renderExamScreen();
}

function resetExamSession() {
    if (examSession.recognition) {
        examSession.recognition.stop();
    }
    if (examSession.timerInterval) {
        clearInterval(examSession.timerInterval);
    }
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

// =============================
// ADMIN FUNCTIONS
// =============================
function showAddQuestionModal() {
    const modalHtml = `
        <div id="modal" class="modal">
            <div class="modal-content">
                <h3>Add New Question</h3>
                <input type="text" id="newQuestionText" placeholder="Question text" class="input-field">
                <textarea id="newModelAnswer" placeholder="Model answer" class="input-field" rows="3"></textarea>
                <input type="text" id="newKeywords" placeholder="Keywords (comma-separated, use **keyword** for double weight)" class="input-field">
                <div class="modal-actions">
                    <button id="saveQuestionBtn" class="btn-primary">Save</button>
                    <button id="cancelModalBtn" class="btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('saveQuestionBtn').addEventListener('click', () => {
        const questionText = document.getElementById('newQuestionText').value.trim();
        const modelAnswer = document.getElementById('newModelAnswer').value.trim();
        const keywordsInput = document.getElementById('newKeywords').value.trim();
        
        if (!questionText || !modelAnswer || !keywordsInput) {
            alert('Please fill all fields');
            return;
        }
        
        const keywords = keywordsInput.split(',').map(k => k.trim());
        const newQuestion = {
            id: Date.now().toString(),
            question: questionText,
            answer: modelAnswer,
            keywords: keywords
        };
        
        const questions = loadQuestions();
        questions.push(newQuestion);
        saveQuestions(questions);
        
        document.getElementById('modal').remove();
        renderAdminDashboard();
        alert('Question added successfully!');
    });
    
    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        document.getElementById('modal').remove();
    });
}

function editQuestion(questionId) {
    const questions = loadQuestions();
    const question = questions.find(q => q.id === questionId);
    
    if (!question) return;
    
    const modalHtml = `
        <div id="modal" class="modal">
            <div class="modal-content">
                <h3>Edit Question</h3>
                <input type="text" id="editQuestionText" value="${escapeHtml(question.question)}" class="input-field">
                <textarea id="editModelAnswer" class="input-field" rows="3">${escapeHtml(question.answer)}</textarea>
                <input type="text" id="editKeywords" value="${question.keywords.join(', ')}" class="input-field">
                <div class="modal-actions">
                    <button id="updateQuestionBtn" class="btn-primary">Update</button>
                    <button id="cancelModalBtn" class="btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('updateQuestionBtn').addEventListener('click', () => {
        const updatedQuestion = {
            id: questionId,
            question: document.getElementById('editQuestionText').value.trim(),
            answer: document.getElementById('editModelAnswer').value.trim(),
            keywords: document.getElementById('editKeywords').value.split(',').map(k => k.trim())
        };
        
        const index = questions.findIndex(q => q.id === questionId);
        questions[index] = updatedQuestion;
        saveQuestions(questions);
        
        document.getElementById('modal').remove();
        renderAdminDashboard();
        alert('Question updated successfully!');
    });
    
    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        document.getElementById('modal').remove();
    });
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
        const questions = loadQuestions();
        const filtered = questions.filter(q => q.id !== questionId);
        saveQuestions(filtered);
        renderAdminDashboard();
        alert('Question deleted successfully!');
    }
}

function importQuestions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.questions && Array.isArray(data.questions)) {
                    saveQuestions(data.questions);
                } else if (Array.isArray(data)) {
                    saveQuestions(data);
                } else {
                    throw new Error('Invalid format');
                }
                alert('Questions imported successfully!');
                renderAdminDashboard();
            } catch (error) {
                alert('Invalid JSON file. Please ensure it matches the correct format.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportQuestionsToJson() {
    const questions = loadQuestions();
    const data = { questions: questions, exportDate: new Date().toISOString() };
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'voiceexam_questions_backup.json');
}

function exportSingleResult(result) {
    const csv = convertResultToCsv([result]);
    downloadFile(csv, `voiceexam_result_${result.name}_${result.id}.csv`);
}

function exportAllResults() {
    const results = loadResults();
    const csv = convertResultsToCsv(results);
    downloadFile(csv, 'voiceexam_all_results.csv');
}

function convertResultToCsv(results) {
    let csv = 'Name,Student ID,Course,Date,Total Score,Max Score,Percentage,Grade,Swap Used\n';
    results.forEach(r => {
        csv += `"${r.name}",${r.sid},"${r.course}",${r.date},${r.totalScore},${r.maxScore},${r.percentage}%,${r.grade},${r.swapUsed ? 'Yes' : 'No'}\n`;
    });
    return csv;
}

function convertResultsToCsv(results) {
    let csv = 'Session ID,Name,Student ID,Course,Date,Total Score,Max Score,Percentage,Grade,Swap Used\n';
    results.forEach(r => {
        csv += `${r.id},"${r.name}",${r.sid},"${r.course}",${r.date},${r.totalScore},${r.maxScore},${r.percentage}%,${r.grade},${r.swapUsed ? 'Yes' : 'No'}\n`;
    });
    return csv;
}

function filterResults() {
    const filterValue = document.getElementById('filterCourse')?.value.toLowerCase() || '';
    const results = loadResults();
    const filtered = results.filter(r => r.course.toLowerCase().includes(filterValue));
    
    const tbody = document.getElementById('resultsTableBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(r => `
            <tr>
                <td>${r.date}</td>
                <td>${r.name}</td>
                <td>${r.sid}</td>
                <td>${r.course}</td>
                <td>${r.totalScore}/${r.maxScore}</td>
                <td class="grade-${r.grade.replace('+', '')}">${r.grade}</td>
                <td>${r.swapUsed ? 'Yes' : 'No'}</td>
            </tr>
        `).join('');
    }
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================
// START APPLICATION
// =============================
document.addEventListener('DOMContentLoaded', initApp);