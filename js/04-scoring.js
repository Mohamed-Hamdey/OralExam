function scoreAnswer(transcript, keywords) {
    const normalizedText = transcript.toLowerCase();
    let totalWeight = 0;
    let earnedWeight = 0;
    let matchedKeywords = [];
    let missedKeywords = [];

    for (const keyword of keywords) {
        let weight = 1;
        let searchTerm = keyword;

        if (keyword.startsWith('**') && keyword.endsWith('**')) {
            weight = 2;
            searchTerm = keyword.slice(2, -2);
        }

        totalWeight += weight;

        if (normalizedText.includes(searchTerm.toLowerCase())) {
            earnedWeight += weight;
            matchedKeywords.push({ term: searchTerm, weight });
        } else {
            missedKeywords.push({ term: searchTerm, weight });
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
        totalScore: parseFloat(finalTotal.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        grade
    };
}