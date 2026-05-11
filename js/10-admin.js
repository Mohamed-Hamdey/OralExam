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
    
    // Calculate statistics
    const totalStudents = new Set(results.map(r => r.name)).size;
    const totalExams = results.length;
    const avgScore = (results.reduce((sum, r) => sum + r.totalScore, 0) / results.length || 0).toFixed(1);
    const topPerformers = results.filter(r => r.grade === 'A+' || r.grade === 'A').length;
    const passRate = ((results.filter(r => r.grade !== 'F').length / results.length) * 100 || 0).toFixed(1);
    
    // Grade distribution
    const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    results.forEach(r => {
        if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++;
    });
    
    // Start building HTML content (using let instead of const so we can append)
    let htmlContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>VoiceExam - Comprehensive Results Report</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
                background: white;
                padding: 40px;
            }
            .report-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
            }
            .report-header {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: white;
                padding: 40px;
                text-align: center;
                border-radius: 16px 16px 0 0;
            }
            .report-header h1 {
                font-size: 32px;
                margin-bottom: 10px;
            }
            .report-header p {
                opacity: 0.8;
                font-size: 14px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 16px;
                margin: 24px 0;
            }
            .stat-card {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
            }
            .stat-number {
                font-size: 28px;
                font-weight: 800;
                color: #3b82f6;
                margin-bottom: 8px;
            }
            .stat-label {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
            }
            .grade-section {
                padding: 24px;
                background: #f8fafc;
                border-radius: 12px;
                margin-bottom: 24px;
            }
            .grade-section h2 {
                font-size: 18px;
                margin-bottom: 16px;
                color: #1e293b;
            }
            .grade-bars {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            .grade-item {
                flex: 1;
                min-width: 70px;
                text-align: center;
            }
            .grade-bar-container {
                background: #e2e8f0;
                border-radius: 8px;
                height: 25px;
                overflow: hidden;
                margin-bottom: 6px;
            }
            .grade-bar {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                color: white;
            }
            .grade-bar.Aplus { background: #10b981; }
            .grade-bar.A { background: #3b82f6; }
            .grade-bar.B { background: #8b5cf6; }
            .grade-bar.C { background: #f59e0b; }
            .grade-bar.D { background: #f97316; }
            .grade-bar.F { background: #ef4444; }
            .grade-label {
                font-size: 12px;
                font-weight: 600;
            }
            .results-section {
                margin-bottom: 24px;
            }
            .results-section h2 {
                font-size: 18px;
                margin-bottom: 16px;
                color: #1e293b;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            th {
                background: #f1f5f9;
                padding: 10px 8px;
                text-align: left;
                font-weight: 600;
                color: #1e293b;
                border-bottom: 2px solid #e2e8f0;
            }
            td {
                padding: 8px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }
            .grade-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 10px;
            }
            .grade-badge.Aplus { background: #d1fae5; color: #065f46; }
            .grade-badge.A { background: #dbeafe; color: #1e40af; }
            .grade-badge.B { background: #ede9fe; color: #5b21b6; }
            .grade-badge.C { background: #fed7aa; color: #92400e; }
            .grade-badge.D { background: #ffedd5; color: #9a3412; }
            .grade-badge.F { background: #fee2e2; color: #991b1b; }
            .per-question-section {
                margin-top: 24px;
            }
            .per-question-section h2 {
                font-size: 18px;
                margin-bottom: 16px;
                color: #1e293b;
            }
            .question-card {
                background: #f8fafc;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                border-left: 3px solid #3b82f6;
                page-break-inside: avoid;
            }
            .question-text {
                font-weight: 600;
                margin-bottom: 10px;
                color: #1e293b;
                font-size: 13px;
            }
            .answer-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 10px;
            }
            .student-answer {
                background: white;
                padding: 10px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .student-answer strong, .matched-keywords strong {
                display: block;
                margin-bottom: 6px;
                font-size: 11px;
                color: #64748b;
            }
            .answer-text {
                font-size: 12px;
                color: #334155;
                line-height: 1.4;
            }
            .keyword-tag {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                margin: 2px;
            }
            .keyword-matched {
                background: #d1fae5;
                color: #065f46;
            }
            .keyword-missed {
                background: #fee2e2;
                color: #991b1b;
            }
            .score-badge {
                display: inline-block;
                padding: 2px 10px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 11px;
            }
            .score-good { background: #d1fae5; color: #065f46; }
            .score-average { background: #fed7aa; color: #92400e; }
            .score-poor { background: #fee2e2; color: #991b1b; }
            .footer {
                margin-top: 24px;
                padding: 16px;
                text-align: center;
                font-size: 11px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
            }
            @media print {
                body {
                    padding: 20px;
                }
                .question-card {
                    break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="report-header">
                <h1>🎤 VoiceExam Comprehensive Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${totalExams}</div>
                    <div class="stat-label">Total Exams</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalStudents}</div>
                    <div class="stat-label">Total Students</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgScore}</div>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${topPerformers}</div>
                    <div class="stat-label">Top Performers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${passRate}%</div>
                    <div class="stat-label">Pass Rate</div>
                </div>
            </div>
            
            <div class="grade-section">
                <h2>📈 Grade Distribution</h2>
                <div class="grade-bars">
                    <div class="grade-item">
                        <div class="grade-bar-container">
                            <div class="grade-bar Aplus" style="width: ${(gradeCounts['A+'] / results.length * 100) || 0}%">
                                ${gradeCounts['A+']}
                            </div>
                        </div>
                        <div class="grade-label">A+</div>
                    </div>
                    <div class="grade-item">
                        <div class="grade-bar-container">
                            <div class="grade-bar A" style="width: ${(gradeCounts['A'] / results.length * 100) || 0}%">
                                ${gradeCounts['A']}
                            </div>
                        </div>
                        <div class="grade-label">A</div>
                    </div>
                    <div class="grade-item">
                        <div class="grade-bar-container">
                            <div class="grade-bar B" style="width: ${(gradeCounts['B'] / results.length * 100) || 0}%">
                                ${gradeCounts['B']}
                            </div>
                        </div>
                        <div class="grade-label">B</div>
                    </div>
                    <div class="grade-item">
                        <div class="grade-bar-container">
                            <div class="grade-bar C" style="width: ${(gradeCounts['C'] / results.length * 100) || 0}%">
                                ${gradeCounts['C']}
                            </div>
                        </div>
                        <div class="grade-label">C</div>
                    </div>
                    <div class="grade-item">
                        <div class="grade-bar-container">
                            <div class="grade-bar D" style="width: ${(gradeCounts['D'] / results.length * 100) || 0}%">
                                ${gradeCounts['D']}
                            </div>
                        </div>
                        <div class="grade-label">D</div>
                    </div>
                    <div class="grade-item">
                        <div class="grade-bar-container">
                            <div class="grade-bar F" style="width: ${(gradeCounts['F'] / results.length * 100) || 0}%">
                                ${gradeCounts['F']}
                            </div>
                        </div>
                        <div class="grade-label">F</div>
                    </div>
                </div>
            </div>
            
            <div class="results-section">
                <h2>📋 Student Results Summary</h2>
                <table>
                    <thead>
                        <tr><th>Date</th><th>Student</th><th>Course</th><th>Score</th><th>Grade</th><th>Swap</th></tr>
                    </thead>
                    <tbody>`;
    
    // Add results rows
    results.forEach(r => {
        const gradeClass = r.grade === 'A+' ? 'Aplus' : r.grade;
        htmlContent += `<table>
            <td>${r.date}</td><td><strong>${escapeHtml(r.name)}</strong></td><td>${escapeHtml(r.course)}</td>
            <td>${r.totalScore}/${r.maxScore}</td><td><span class="grade-badge ${gradeClass}">${r.grade}</span></td>
            <td>${r.swapUsed ? 'Yes' : 'No'}</td>
        </tr>`;
    });
    
    htmlContent += `</tbody>
                </table>
            </div>
            
            <div class="per-question-section">
                <h2>📝 Detailed Per-Question Analysis</h2>`;
    
    // Add per-question details
    for (const r of results) {
        if (r.questions && Array.isArray(r.questions)) {
            for (let idx = 0; idx < r.questions.length; idx++) {
                const q = r.questions[idx];
                const scoreClass = q.score >= 7 ? 'score-good' : (q.score >= 5 ? 'score-average' : 'score-poor');
                htmlContent += `
                <div class="question-card">
                    <div class="question-text">
                        📌 <strong>${escapeHtml(r.name)}</strong> - Question ${idx + 1}
                        <span class="score-badge ${scoreClass}" style="float: right;">Score: ${q.score}/10</span>
                    </div>
                    <div class="question-text" style="font-size: 12px; margin-top: 6px;">
                        ${escapeHtml(q.questionText)}
                    </div>
                    <div class="answer-details">
                        <div class="student-answer">
                            <strong>Student's Answer:</strong>
                            <div class="answer-text">${escapeHtml(q.studentAnswer) || 'No answer provided'}</div>
                        </div>
                        <div class="matched-keywords">
                            <strong>Matched Keywords:</strong>
                            <div>
                                ${(q.keywordsMatched || []).map(k => `<span class="keyword-tag keyword-matched">${k.term || k}</span>`).join('') || 'None'}
                            </div>
                            <strong style="display: block; margin-top: 8px;">Missed Keywords:</strong>
                            <div>
                                ${(q.keywordsMissed || []).map(k => `<span class="keyword-tag keyword-missed">${k.term || k}</span>`).join('') || 'None'}
                            </div>
                        </div>
                    </div>
                </div>`;
            }
        }
    }
    
    htmlContent += `</div>
            <div class="footer">
                <p>🎤 VoiceExam - AI-Powered Oral Examination Platform</p>
                <p>Report generated automatically on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>`;
    
    // Create a Blob and open in new window for printing
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
        printWindow.addEventListener('load', function() {
            // Auto-trigger print after content loads
            setTimeout(() => {
                printWindow.print();
                URL.revokeObjectURL(url);
            }, 500);
        });
    } else {
        showToast('Please allow popups to generate the report', 'error');
    }
    
    showToast('📄 Opening professional report... Click Print to save as PDF', 'success');
}

async function exportAsPDF() {
    const results = loadResults();
    if (results.length === 0) {
        showToast('No results to export', 'warn');
        return;
    }
    
    showToast('📄 Generating PDF, please wait...', 'info');
    
    // Calculate statistics
    const totalStudents = new Set(results.map(r => r.name)).size;
    const totalExams = results.length;
    const avgScore = (results.reduce((sum, r) => sum + r.totalScore, 0) / results.length || 0).toFixed(1);
    const topPerformers = results.filter(r => r.grade === 'A+' || r.grade === 'A').length;
    const passRate = ((results.filter(r => r.grade !== 'F').length / results.length) * 100 || 0).toFixed(1);
    
    // Grade distribution
    const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    results.forEach(r => {
        if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade]++;
    });
    
    // Create a temporary div for the report with forced dark text colors
    const reportDiv = document.createElement('div');
    reportDiv.style.cssText = 'padding: 40px; font-family: "Segoe UI", Arial, sans-serif; background: white; width: 800px; margin: 0 auto; color: #1e293b;';
    reportDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
            <h1 style="font-size: 28px; margin-bottom: 10px; color: #1e293b;">🎤 VoiceExam Comprehensive Report</h1>
            <p style="color: #64748b;">Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalExams}</div>
                <div style="font-size: 12px; color: #64748b;">Total Exams</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalStudents}</div>
                <div style="font-size: 12px; color: #64748b;">Total Students</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${avgScore}</div>
                <div style="font-size: 12px; color: #64748b;">Average Score</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${topPerformers}</div>
                <div style="font-size: 12px; color: #64748b;">Top Performers</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${passRate}%</div>
                <div style="font-size: 12px; color: #64748b;">Pass Rate</div>
            </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #1e293b;">📈 Grade Distribution</h2>
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; text-align: center;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 5px;">
                        <div style="width: ${(gradeCounts['A+'] / results.length * 100) || 0}%; height: 100%; background: #10b981; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${gradeCounts['A+']}</div>
                    </div>
                    <div style="color: #1e293b;">A+</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 5px;">
                        <div style="width: ${(gradeCounts['A'] / results.length * 100) || 0}%; height: 100%; background: #3b82f6; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${gradeCounts['A']}</div>
                    </div>
                    <div style="color: #1e293b;">A</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 5px;">
                        <div style="width: ${(gradeCounts['B'] / results.length * 100) || 0}%; height: 100%; background: #8b5cf6; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${gradeCounts['B']}</div>
                    </div>
                    <div style="color: #1e293b;">B</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 5px;">
                        <div style="width: ${(gradeCounts['C'] / results.length * 100) || 0}%; height: 100%; background: #f59e0b; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${gradeCounts['C']}</div>
                    </div>
                    <div style="color: #1e293b;">C</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 5px;">
                        <div style="width: ${(gradeCounts['D'] / results.length * 100) || 0}%; height: 100%; background: #f97316; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${gradeCounts['D']}</div>
                    </div>
                    <div style="color: #1e293b;">D</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 5px;">
                        <div style="width: ${(gradeCounts['F'] / results.length * 100) || 0}%; height: 100%; background: #ef4444; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${gradeCounts['F']}</div>
                    </div>
                    <div style="color: #1e293b;">F</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #1e293b;">📋 Student Results Summary</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 10px; text-align: left; color: #1e293b;">Date</th>
                        <th style="padding: 10px; text-align: left; color: #1e293b;">Student</th>
                        <th style="padding: 10px; text-align: left; color: #1e293b;">Course</th>
                        <th style="padding: 10px; text-align: left; color: #1e293b;">Score</th>
                        <th style="padding: 10px; text-align: left; color: #1e293b;">Grade</th>
                        <th style="padding: 10px; text-align: left; color: #1e293b;">Swap</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; color: #1e293b;">${r.date}</td>
                            <td style="padding: 8px; color: #1e293b;"><strong>${escapeHtml(r.name)}</strong></td>
                            <td style="padding: 8px; color: #1e293b;">${escapeHtml(r.course)}</td>
                            <td style="padding: 8px; color: #1e293b;">${r.totalScore}/${r.maxScore}</td>
                            <td style="padding: 8px;"><span style="background: ${r.grade === 'A+' || r.grade === 'A' ? '#d1fae5' : (r.grade === 'B' ? '#ede9fe' : (r.grade === 'C' ? '#fed7aa' : '#fee2e2'))}; color: ${r.grade === 'A+' || r.grade === 'A' ? '#065f46' : (r.grade === 'B' ? '#5b21b6' : (r.grade === 'C' ? '#92400e' : '#991b1b'))}; padding: 2px 8px; border-radius: 12px; font-weight: bold;">${r.grade}</span></td>
                            <td style="padding: 8px; color: #1e293b;">${r.swapUsed ? 'Yes' : 'No'}</td>
                        </td>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div>
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #1e293b;">📝 Detailed Per-Question Analysis</h2>
            ${results.map(r => {
                if (!r.questions) return '';
                return r.questions.map((q, idx) => `
                    <div style="background: #f8fafc; border-radius: 10px; padding: 15px; margin-bottom: 15px; border-left: 3px solid #3b82f6;">
                        <div style="font-weight: bold; margin-bottom: 10px; color: #1e293b;">
                            📌 ${escapeHtml(r.name)} - Question ${idx + 1}
                            <span style="float: right; background: ${q.score >= 7 ? '#d1fae5' : (q.score >= 5 ? '#fed7aa' : '#fee2e2')}; color: ${q.score >= 7 ? '#065f46' : (q.score >= 5 ? '#92400e' : '#991b1b')}; padding: 2px 10px; border-radius: 12px;">Score: ${q.score}/10</span>
                        </div>
                        <div style="margin-bottom: 10px; color: #475569;">${escapeHtml(q.questionText)}</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                            <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <strong style="font-size: 11px; color: #64748b;">Student's Answer:</strong>
                                <div style="font-size: 12px; margin-top: 5px; color: #1e293b;">${escapeHtml(q.studentAnswer) || 'No answer provided'}</div>
                            </div>
                            <div>
                                <strong style="font-size: 11px; color: #64748b;">Matched Keywords:</strong>
                                <div style="margin-top: 5px;">${(q.keywordsMatched || []).map(k => `<span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin: 2px; display: inline-block;">${escapeHtml(k.term || k)}</span>`).join('') || '<span style="color: #64748b;">None</span>'}</div>
                                <strong style="font-size: 11px; color: #64748b; display: block; margin-top: 8px;">Missed Keywords:</strong>
                                <div style="margin-top: 5px;">${(q.keywordsMissed || []).map(k => `<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin: 2px; display: inline-block;">${escapeHtml(k.term || k)}</span>`).join('') || '<span style="color: #64748b;">None</span>'}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            <p>🎤 VoiceExam - AI-Powered Oral Examination Platform</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    // Add to body temporarily
    document.body.appendChild(reportDiv);
    
    try {
        const { jsPDF } = window.jspdf;
        
        // Capture the report as canvas with higher quality
        const canvas = await html2canvas(reportDiv, {
            scale: 3,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: false,
            letterRendering: true
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }
        
        pdf.save(`voiceexam_report_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.pdf`);
        showToast('✅ PDF Report downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('❌ Error generating PDF. Please try again.', 'error');
    } finally {
        document.body.removeChild(reportDiv);
    }
}
function exportSingleResult(result) {
    const csv = `Date,Student,Course,Score,Max Score,Percentage,Grade,Swap Used\n"${result.date}","${result.name}","${result.course}",${result.totalScore},${result.maxScore},${result.percentage}%,${result.grade},${result.swapUsed ? 'Yes' : 'No'}`;
    const filename = `voiceexam_${result.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    downloadFile(csv, filename);
    showToast(`📥 Exported result for ${result.name}`, 'success');
}
