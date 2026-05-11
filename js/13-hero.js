// =============================
// HERO PAGE & LANDING PAGE LOGIC
// =============================

// Update stats on hero page
function updateHeroStats() {
    console.log('Updating hero stats...');
    
    const results = loadResults();
    const questions = loadQuestions();
    
    const totalStudents = new Set(results.map(r => r.name)).size;
    const totalExams = results.length;
    const totalQuestions = questions.length;
    
    const statStudents = document.getElementById('statStudents');
    const statExams = document.getElementById('statExams');
    const statQuestions = document.getElementById('statQuestions');
    
    if (statStudents) statStudents.textContent = totalStudents;
    if (statExams) statExams.textContent = totalExams;
    if (statQuestions) statQuestions.textContent = totalQuestions;
    
    console.log('Stats updated:', { totalStudents, totalExams, totalQuestions });
}

// Navigate to Features section
function showFeaturesScreen() {
    console.log('Showing features screen');
    showScreen('featuresScreen');
    ensureThemeToggle();
}

// Navigate to Student Login
function showStudentLogin() {
    console.log('Showing student login');
    showScreen('loginScreen');
    attachLoginEvents();
    ensureThemeToggle();
}

// Navigate to Doctor Login
function showDoctorLogin() {
    console.log('Showing doctor login');
    showScreen('adminLoginScreen');
    attachAdminLoginEvents();
    ensureThemeToggle();
}

// Go back to Hero
function goBackToHero() {
    console.log('Going back to hero');
    showScreen('heroScreen');
    updateHeroStats();
    attachHeroEvents();
    ensureThemeToggle();
}

// Attach Hero Events
function attachHeroEvents() {
    console.log('Attaching hero events...');
    
    // Ensure theme toggle exists
    ensureThemeToggle();
    
    // Get Started button
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.onclick = () => {
            console.log('Get Started clicked');
            document.getElementById('heroScreen').scrollIntoView({ behavior: 'smooth' });
        };
    }
    
    // Student button
    const heroStudentBtn = document.getElementById('heroStudentBtn');
    if (heroStudentBtn) {
        heroStudentBtn.onclick = () => {
            console.log('Student button clicked');
            showStudentLogin();
        };
    }
    
    // Doctor button
    const heroDoctorBtn = document.getElementById('heroDoctorBtn');
    if (heroDoctorBtn) {
        heroDoctorBtn.onclick = () => {
            console.log('Doctor button clicked');
            showDoctorLogin();
        };
    }
    
    // Features link
    const featuresLink = document.querySelector('[data-nav="features"]');
    if (featuresLink) {
        featuresLink.onclick = (e) => {
            e.preventDefault();
            console.log('Features link clicked');
            showFeaturesScreen();
        };
    }
    
    // How It Works link
    const howItWorksLink = document.querySelector('[data-nav="how-it-works"]');
    if (howItWorksLink) {
        howItWorksLink.onclick = (e) => {
            e.preventDefault();
            console.log('How it works link clicked');
            showFeaturesScreen();
        };
    }
    
    // Back buttons
    const backButtons = document.querySelectorAll('.back-to-hero');
    backButtons.forEach(btn => {
        btn.onclick = goBackToHero;
    });
    
    console.log('Hero events attached successfully');
}

// Initialize Hero Page
function initHeroPage() {
    console.log('Initializing hero page...');
    updateHeroStats();
    attachHeroEvents();
    ensureThemeToggle();
}

// Navigate to How It Works
function showHowItWorksScreen() {
    console.log('Showing how it works screen');
    showScreen('howItWorksScreen');
    ensureThemeToggle();
}

// Navigate to Contact/Thank You page
function showContactScreen() {
    console.log('Showing contact screen');
    showScreen('contactScreen');
    ensureThemeToggle();
}

// Get Started functionality - scroll to features
function handleGetStarted() {
    console.log('Get Started clicked - scrolling to features');
    showFeaturesScreen();
}

// Update attachHeroEvents function
function attachHeroEvents() {
    console.log('Attaching hero events...');
    
    ensureThemeToggle();
    
    // Get Started button - now shows features page
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.onclick = () => {
            console.log('Get Started clicked');
            showFeaturesScreen();
        };
    }
    
    // Student button
    const heroStudentBtn = document.getElementById('heroStudentBtn');
    if (heroStudentBtn) {
        heroStudentBtn.onclick = () => {
            console.log('Student button clicked');
            showStudentLogin();
        };
    }
    
    // Doctor button
    const heroDoctorBtn = document.getElementById('heroDoctorBtn');
    if (heroDoctorBtn) {
        heroDoctorBtn.onclick = () => {
            console.log('Doctor button clicked');
            showDoctorLogin();
        };
    }
    
    // Features link
    const featuresLink = document.querySelector('[data-nav="features"]');
    if (featuresLink) {
        featuresLink.onclick = (e) => {
            e.preventDefault();
            console.log('Features link clicked');
            showFeaturesScreen();
        };
    }
    
    // How It Works link
    const howItWorksLink = document.querySelector('[data-nav="how-it-works"]');
    if (howItWorksLink) {
        howItWorksLink.onclick = (e) => {
            e.preventDefault();
            console.log('How it works link clicked');
            showHowItWorksScreen();
        };
    }
    
    // Contact link
    const contactLink = document.querySelector('[data-nav="contact"]');
    if (contactLink) {
        contactLink.onclick = (e) => {
            e.preventDefault();
            console.log('Contact link clicked');
            showContactScreen();
        };
    }
    
    // Back buttons
    const backButtons = document.querySelectorAll('.back-to-hero');
    backButtons.forEach(btn => {
        btn.onclick = goBackToHero;
    });
    
    console.log('Hero events attached successfully');
}

// Make functions global
window.initHeroPage = initHeroPage;
window.attachHeroEvents = attachHeroEvents;
window.showStudentLogin = showStudentLogin;
window.showDoctorLogin = showDoctorLogin;
window.goBackToHero = goBackToHero;