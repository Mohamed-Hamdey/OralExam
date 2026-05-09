function showAddQuestionModal() {
    document.getElementById('modalTitle').textContent = 'Add New Question';
    document.getElementById('newQuestionText').value = '';
    document.getElementById('newModelAnswer').value = '';
    document.getElementById('newKeywords').value = '';
    document.getElementById('modal').classList.remove('hidden');
    
    document.getElementById('saveQuestionBtn').onclick = () => {
        const questionText = document.getElementById('newQuestionText').value.trim();
        const modelAnswer = document.getElementById('newModelAnswer').value.trim();
        const keywordsInput = document.getElementById('newKeywords').value.trim();

        if (!questionText || !modelAnswer || !keywordsInput) {
            showToast('Please fill all fields', 'warn');
            return;
        }

        const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
        const newQuestion = {
            id: Date.now().toString(),
            question: questionText,
            answer: modelAnswer,
            keywords: keywords
        };

        const questions = loadQuestions();
        questions.push(newQuestion);
        saveQuestions(questions);

        document.getElementById('modal').classList.add('hidden');
        renderAdminDashboard();
        showToast('Question added successfully!', 'success');
    };
    
    document.getElementById('cancelModalBtn').onclick = () => {
        document.getElementById('modal').classList.add('hidden');
    };
}

function editQuestion(questionId) {
    const questions = loadQuestions();
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Question';
    document.getElementById('newQuestionText').value = question.question;
    document.getElementById('newModelAnswer').value = question.answer;
    document.getElementById('newKeywords').value = question.keywords.join(', ');
    document.getElementById('modal').classList.remove('hidden');
    
    document.getElementById('saveQuestionBtn').onclick = () => {
        const updatedQuestion = {
            id: questionId,
            question: document.getElementById('newQuestionText').value.trim(),
            answer: document.getElementById('newModelAnswer').value.trim(),
            keywords: document.getElementById('newKeywords').value.split(',').map(k => k.trim()).filter(Boolean)
        };
        
        const index = questions.findIndex(q => q.id === questionId);
        questions[index] = updatedQuestion;
        saveQuestions(questions);
        
        document.getElementById('modal').classList.add('hidden');
        renderAdminDashboard();
        showToast('Question updated!', 'success');
    };
}

function deleteQuestion(questionId) {
    if (confirm('Delete this question? This cannot be undone.')) {
        const questions = loadQuestions();
        saveQuestions(questions.filter(q => q.id !== questionId));
        renderAdminDashboard();
        showToast('Question deleted.', 'info');
    }
}
