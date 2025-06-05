'use strict';

const STORAGE_KEYS = {
    HIGH_SCORE: 'highScore',
    BEST_TIME: 'bestTime'
};

function getHighScore() {
    const score = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return score ? parseInt(score) : 0;
}

function saveBestTime(time) {
    const currentBestTime = getBestTime();
    if (currentBestTime === 0 || time < currentBestTime) {
        localStorage.setItem(STORAGE_KEYS.BEST_TIME, time.toString());
        return true;
    }
    return false;
}

function getBestTime() {
    const time = localStorage.getItem(STORAGE_KEYS.BEST_TIME);
    return time ? parseFloat(time) : 0;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function clearAllStorage() {
    localStorage.clear();
    alert('All localStorage values cleared!');
    // Optionally reload the page to see the effect immediately
    location.reload();
}

function saveHighScore(score) {
    const currentHighScore = getHighScore();
    if (score > currentHighScore) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
        return true;
    }
    return false;
}

// Make all storage functions globally available
window.saveHighScore = saveHighScore;
window.getHighScore = getHighScore;
window.saveBestTime = saveBestTime;
window.getBestTime = getBestTime;
window.formatTime = formatTime;
window.clearAllStorage = clearAllStorage;