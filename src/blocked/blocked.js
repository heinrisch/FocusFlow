let timerInterval;
let currentSession = null;

async function init() {
    // Get domain from URL
    const url = new URL(window.location.href);
    const domain = url.searchParams.get('domain') || 'this site';
    document.getElementById('domain-name').textContent = domain;

    // Load session
    currentSession = await getSession();

    if (currentSession?.active) {
        updateRemainingTime();
        timerInterval = setInterval(updateRemainingTime, 1000);
    } else {
        showEndedState();
    }

    // Listen for session changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.session) {
            currentSession = changes.session.newValue;
            if (!currentSession?.active) {
                clearInterval(timerInterval);
                showEndedState();
            }
        }
    });

    // Add event listeners to buttons
    document.getElementById('back-btn').addEventListener('click', goBack);
    document.getElementById('options-btn').addEventListener('click', openOptions);
    document.getElementById('reload-btn').addEventListener('click', () => {
        window.location.reload();
    });
}

async function getSession() {
    try {
        const data = await chrome.storage.local.get('session');
        return data.session || { active: false, endsAtEpochMs: 0 };
    } catch (error) {
        console.error('Error getting session:', error);
        return { active: false, endsAtEpochMs: 0 };
    }
}

function updateRemainingTime() {
    if (!currentSession?.endsAtEpochMs) {
        document.getElementById('timer').textContent = '00:00';
        return;
    }

    const now = Date.now();
    const diff = currentSession.endsAtEpochMs - now;

    if (diff <= 0) {
        document.getElementById('timer').textContent = '00:00';
        clearInterval(timerInterval);
        showEndedState();
        return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById('timer').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showEndedState() {
    document.getElementById('active-section').classList.add('hidden');
    document.getElementById('ended-section').classList.remove('hidden');
}

function goBack() {
    try {
        chrome.tabs.getCurrent((tab) => {
            if (tab && tab.id) {
                chrome.tabs.remove(tab.id);
            }
        });
    } catch (error) {
        console.error('Error closing tab:', error);
        window.close();
    }
}

function openOptions() {
    try {
        chrome.runtime.openOptionsPage(() => {
            chrome.tabs.getCurrent((tab) => {
                if (tab && tab.id) {
                    chrome.tabs.remove(tab.id);
                }
            });
        });
    } catch (error) {
        console.error('Error opening options:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
