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
        console.log('🎤 Recognition ended');
        if (examSession.isRecording) {
            console.log('🔄 Auto-restarting recognition...');
            try {
                recognition.start();
            } catch (e) {
                console.error('Could not restart recognition:', e);
                examSession.isRecording = false;
                updateMicrophoneButton(false);
            }
        } else {
            updateMicrophoneButton(false);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            examSession.isRecording = false;
            updateMicrophoneButton(false);
            alert('Microphone access denied. Please allow microphone permissions.');
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

        if (finalTranscript) {
            examSession.currentTranscript += ' ' + finalTranscript;
        }

        updateTranscriptDisplay(interimTranscript);
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
        }
    }
}

function stopRecording() {
    if (examSession.recognition && examSession.isRecording) {
        examSession.isRecording = false;
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

function updateTranscriptDisplay(interim) {
    const transcriptElement = document.getElementById('liveTranscript');
    
    if (transcriptElement) {
        let displayText = examSession.currentTranscript.trim();
        if (interim) {
            displayText += (displayText ? ' ' : '') + `<span style="color:#aaa;font-style:italic">${interim}</span>`;
        }
        transcriptElement.innerHTML = displayText || '<span style="color: #888;">Speak your answer here...</span>';
    }
}

function toggleRecording() {
    if (examSession.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}
