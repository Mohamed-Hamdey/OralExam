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
    }

    if (progressBar) {
        const percentage = (examSession.timeRemaining / 180) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

function handleTimeOut() {
    stopRecording();
    const notice = document.createElement('div');
    notice.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ff4444;color:white;padding:12px 24px;border-radius:10px;font-weight:600;z-index:9999;font-size:15px';
    notice.textContent = '⏰ Time is up! Submitting your answer...';
    document.body.appendChild(notice);
    setTimeout(() => {
        notice.remove();
        submitCurrentAnswer();
    }, 1500);
}
