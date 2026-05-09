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


async function loadInitialQuestionBank() {
    let questions = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);

    if (!questions) {
        try {
            const response = await fetch('questions_bank.json');
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(data.questions));
            console.log('✅ Loaded default question bank');
        } catch (error) {
            console.error('Failed to load questions_bank.json, using fallback:', error);
            const fallbackQuestions = getFallbackQuestions();
            localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(fallbackQuestions));
        }
    }
}

function getFallbackQuestions() {
    return [
        {
            id: Date.now() + "_1",
            question: "Explain the process of cell mitosis and its main stages.",
            answer: "Mitosis is the type of cell division that produces two genetically identical daughter cells. The stages are: prophase (chromosomes condense), metaphase (chromosomes align at the cell plate), anaphase (sister chromatids separate), and telophase (new nuclei form), followed by cytokinesis.",
            keywords: ["**mitosis**", "**cell division**", "prophase", "metaphase", "anaphase", "telophase", "chromosomes", "daughter cells", "cytokinesis", "sister chromatids"]
        },
        {
            id: Date.now() + "_2",
            question: "What are Newton's three laws of motion? Explain each one.",
            answer: "Newton's first law is inertia: an object stays at rest or in motion unless acted upon by a force. The second law states F=ma, force equals mass times acceleration. The third law is action-reaction: every action has an equal and opposite reaction.",
            keywords: ["**inertia**", "**f=ma**", "**action-reaction**", "force", "mass", "acceleration", "motion", "newton"]
        },
        {
            id: Date.now() + "_3",
            question: "Describe the structure and function of DNA.",
            answer: "DNA is a double helix made of two polynucleotide strands. It contains four bases: adenine, thymine, guanine and cytosine.",
            keywords: ["**DNA**", "**double helix**", "adenine", "thymine", "guanine", "cytosine"]
        }
    ];
}