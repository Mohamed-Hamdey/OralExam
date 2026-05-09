function importQuestionsFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                let questionsArray = null;
                
                if (data.questions && Array.isArray(data.questions)) {
                    questionsArray = data.questions;
                } else if (Array.isArray(data)) {
                    questionsArray = data;
                } else {
                    throw new Error('Invalid format');
                }
                
                const processedQuestions = questionsArray.map(q => ({
                    ...q,
                    id: q.id || Date.now().toString() + Math.random().toString(36)
                }));
                
                saveQuestions(processedQuestions);
                showToast(`✅ Imported ${processedQuestions.length} questions!`, 'success');
                renderAdminDashboard();
            } catch (error) {
                showToast('❌ Invalid JSON file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportQuestionsToJson() {
    const questions = loadQuestions();
    if (questions.length === 0) {
        showToast('No questions to export', 'warn');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toLocaleString(),
        totalQuestions: questions.length,
        questions: questions
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const filename = `voiceexam_questions_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    downloadFile(jsonStr, filename, 'application/json');
    showToast(`📥 Exported ${questions.length} questions`, 'success');
}

function exportGradesFile() {
    const results = loadResults();
    if (results.length === 0) {
        showToast('No results to export', 'warn');
        return;
    }
    
    let csv = 'Date,Student Name,Course,Score,Max Score,Percentage,Grade,Swap Used\n';
    results.forEach(r => {
        csv += `"${r.date}","${r.name}","${r.course}",${r.totalScore},${r.maxScore},${r.percentage}%,${r.grade},${r.swapUsed ? 'Yes' : 'No'}\n`;
    });
    
    const filename = `voiceexam_grades_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
    downloadFile(csv, filename);
    showToast(`📥 Exported ${results.length} results`, 'success');
}

function exportDetailedGradesFile() {
    const results = loadResults();
    if (results.length === 0) {
        showToast('No results to export', 'warn');
        return;
    }
    
    let csv = 'Date,Student,Course,Question,Student Answer,Score,Matched Keywords,Missed Keywords\n';
    
    for (const r of results) {
        if (r.questions && Array.isArray(r.questions)) {
            for (const q of r.questions) {
                const matched = (q.keywordsMatched || []).map(k => k.term || k).join(', ');
                const missed = (q.keywordsMissed || []).map(k => k.term || k).join(', ');
                csv += `"${r.date}","${r.name}","${r.course}","${(q.questionText || '').substring(0, 100)}","${(q.studentAnswer || '').substring(0, 200)}",${q.score},"${matched}","${missed}"\n`;
            }
        }
    }
    
    const filename = `voiceexam_detailed_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
    downloadFile(csv, filename);
    showToast('📥 Exported detailed results', 'success');
}

function exportSingleResult(result) {
    const csv = `Date,Student,Course,Score,Max Score,Percentage,Grade,Swap Used\n"${result.date}","${result.name}","${result.course}",${result.totalScore},${result.maxScore},${result.percentage}%,${result.grade},${result.swapUsed ? 'Yes' : 'No'}`;
    const filename = `voiceexam_${result.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    downloadFile(csv, filename);
    showToast(`📥 Exported result for ${result.name}`, 'success');
}
