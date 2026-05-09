// =============================
// UTILITY FUNCTIONS
// =============================

function showToast(message, type = 'info') {
    const colors = { info: '#6c63ff', warn: '#ff9800', error: '#ff4444', success: '#4caf50' };
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${colors[type]};color:white;padding:12px 24px;border-radius:10px;font-weight:600;z-index:9999;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
// =============================
// SCREEN MANAGEMENT
// =============================
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) activeScreen.classList.remove('hidden');
}