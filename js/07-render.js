function renderExamScreen() {
    const currentQuestion = examSession.selectedQuestions[examSession.currentIndex];
    
    document.getElementById('studentNameDisplay').textContent = examSession.studentInfo.name;
    document.getElementById('courseNameDisplay').textContent = examSession.studentInfo.course;
    document.getElementById('questionText').textContent = currentQuestion.question;
    
    const swapBtn = document.getElementById('swapBtn');
    if (examSession.swapUsed) {
        swapBtn.disabled = true;
        swapBtn.textContent = '🔄 Swap Used';
    } else {
        swapBtn.disabled = false;
        swapBtn.textContent = '🔄 Change Question (−1 pt penalty)';
    }
    
    examSession.timeRemaining = 180;
    examSession.currentTranscript = '';
    examSession.recognition = null;
    
    const liveTranscript = document.getElementById('liveTranscript');
    if (liveTranscript) {
        liveTranscript.innerHTML = '<span style="color: #888;">Click the microphone and start speaking...</span>';
    }
    
    updateTimerDisplay();
    startTimer();
    
    showScreen('examScreen');
    attachExamEvents();
}


function renderFinalSummaryScreen() {
    console.log('renderFinalSummaryScreen called');
    
    // Make sure we have answers
    if (!examSession.answers || examSession.answers.length === 0) {
        console.error('No answers found!');
        return;
    }
    
    const totalEarned = examSession.answers[0]?.score || 0;
    const maxScore = 10;
    const finalGrade = calculateFinalGrade(totalEarned, maxScore, examSession.swapUsed);
 
    // Populate grade circle
    const gradeLetterEl = document.getElementById('gradeLetter');
    const gradePercentEl = document.getElementById('gradePercent');
    const summaryStudentInfoEl = document.getElementById('summaryStudentInfo');
    const scoreSummaryEl = document.getElementById('scoreSummary');
    
    if (gradeLetterEl) gradeLetterEl.textContent = finalGrade.grade;
    if (gradePercentEl) gradePercentEl.textContent = `${finalGrade.percentage}%`;
    if (summaryStudentInfoEl) {
        summaryStudentInfoEl.textContent = `${examSession.studentInfo.name} · ${examSession.studentInfo.course}`;
    }
    
    if (scoreSummaryEl) {
        scoreSummaryEl.innerHTML = `
            <div class="score-row">
                <span>Your Score:</span>
                <strong>${totalEarned} / ${maxScore}</strong>
            </div>
            ${examSession.swapUsed ? `
            <div class="score-row penalty">
                <span>⚠️ Swap Penalty:</span>
                <strong>−1 point</strong>
            </div>` : ''}
            <div class="score-row">
                <span>Final Score:</span>
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
        `;
    }
 
    // Save result to localStorage
    const result = {
        id: Date.now(),
        name: examSession.studentInfo.name,
        course: examSession.studentInfo.course,
        date: new Date().toLocaleString(),
        totalScore: finalGrade.totalScore,
        maxScore: maxScore,
        percentage: finalGrade.percentage,
        grade: finalGrade.grade,
        swapUsed: examSession.swapUsed,
        questions: examSession.answers.map((answer, idx) => ({
            questionText: examSession.selectedQuestions[idx]?.question || 'N/A',
            studentAnswer: answer.transcript,
            score: answer.score,
            keywordsMatched: answer.matchedKeywords || [],
            keywordsMissed: answer.missedKeywords || []
        }))
    };
    
    saveResult(result);
    showScreen('summaryScreen');
    
    // Remove export button since only doctor sees results
    const newExamBtn = document.getElementById('newExamBtn');
    if (newExamBtn) {
        newExamBtn.onclick = () => {
            resetExamSession();
            showScreen('loginScreen');
            attachLoginEvents();
        };
    }
}
function renderAdminDashboard() {
    console.log('📊 renderAdminDashboard called, doctorSession:', doctorSession);
    
    const questions = loadQuestions();
    const results = loadResults();
    
    const welcomeEl = document.getElementById('adminWelcome');
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome, ${doctorSession.name}`;
    }
    
    // Render question list
    const questionsList = document.getElementById('questionsList');
    if (questionsList) {
        if (questions.length === 0) {
            questionsList.innerHTML = '<p style="color:#888;padding:12px 0;">No questions in the bank yet. Upload a JSON file above.</p>';
        } else {
            questionsList.innerHTML = questions.map((q, idx) => `
                <div class="question-item">
                    <div class="question-text">
                        <strong>Q${idx + 1}:</strong> ${escapeHtml(q.question)}
                        <div style="font-size:12px;color:#888;margin-top:4px;">
                            Keywords: ${q.keywords.join(', ')}
                        </div>
                    </div>
                    <div class="question-actions">
                        <button class="btn-icon edit-btn" data-id="${q.id}">✏️ Edit</button>
                        <button class="btn-icon delete-btn" data-id="${q.id}">🗑️ Delete</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Render results table - FIXED: handle undefined grade
    const resultsTable = document.getElementById('resultsTableBody');
    if (resultsTable) {
        if (results.length === 0) {
            resultsTable.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No results yet.</td></tr>';
        } else {
            resultsTable.innerHTML = results.map(r => {
                // Safely get grade, default to 'N/A' if undefined
                const grade = r.grade || 'N/A';
                const safeGrade = grade.replace('+', '') || 'N/A';
                
                return `
                    <tr>
                        <td>${r.date || 'N/A'}</td>
                        <td>${escapeHtml(r.name || 'Unknown')}</td>
                        <td>${escapeHtml(r.course || 'N/A')}</td>
                        <td>${r.totalScore || 0}/${r.maxScore || 10}</td>
                        <td class="grade-${safeGrade}">${grade}</td>
                        <td>${r.swapUsed ? '⚠️ Yes' : 'No'}</td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    showScreen('adminDashboardScreen');
    attachAdminEvents();
}