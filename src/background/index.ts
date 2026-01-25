import { storage, type Settings } from '../lib/storage';
import { updateDynamicRules, clearDynamicRules } from '../lib/blocking';

const FOCUS_ALARM_NAME = 'focus-session-alarm';

// Set up notification click handlers
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        // Try to open popup, fallback to options page
        chrome.action.openPopup().catch(() => {
            chrome.runtime.openOptionsPage();
        });
    }
    chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener((notificationId) => {
    // When notification is clicked, open popup or options
    chrome.action.openPopup().catch(() => {
        chrome.runtime.openOptionsPage();
    });
    chrome.notifications.clear(notificationId);
});

chrome.runtime.onInstalled.addListener(async () => {
    // Initialize default settings if not present
    const settings = await storage.getSettings();
    await storage.setSettings(settings); // Ensures defaults are set if missing

    // Apply permanent blocks immediately
    const session = await storage.getSession();
    await updateDynamicRules(settings.blockedDomains, session.active);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === FOCUS_ALARM_NAME) {
        await endSession();
    }
});

// Handle service worker startup
chrome.runtime.onStartup.addListener(async () => {
    await verifySession();
});

async function verifySession() {
    const session = await storage.getSession();
    const settings = await storage.getSettings();

    // Always update rules on startup to ensure consistency (permanent blocks)
    await updateDynamicRules(settings.blockedDomains, session.active);

    if (session.active) {
        const now = Date.now();
        if (now >= session.endsAtEpochMs) {
            await endSession();
        } else {
            // Re-create alarm if it's missing but session is active
            const alarm = await chrome.alarms.get(FOCUS_ALARM_NAME);
            if (!alarm) {
                chrome.alarms.create(FOCUS_ALARM_NAME, {
                    when: session.endsAtEpochMs,
                });
            }
        }
    }
}

async function endSession() {
    const settings = await storage.getSettings();
    // Don't clear all rules, just update to respect only permanent blocks
    await updateDynamicRules(settings.blockedDomains, false); // false = session inactive

    await storage.clearSession();
    chrome.alarms.clear(FOCUS_ALARM_NAME);

    // Update icon to normal
    chrome.action.setIcon({
        path: {
            "16": "icons/icon16.png",
            "32": "icons/icon32.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    });

    // Show celebration notification
    await showCompletionNotification();

    console.log('Focus session ended.');
}

async function showCompletionNotification() {
    const messages = [
        "🎉 Great job! Your focus session is complete!",
        "✨ Well done! You stayed focused!",
        "🌟 Amazing! You completed your focus session!",
        "💪 Excellent work! Time for a well-deserved break!",
        "🎊 Congratulations! You crushed your focus session!",
        "🏆 Outstanding! Your focus session is complete!",
        "⭐ Fantastic! You made it through your focus time!",
    ];

    // Pick a random encouraging message
    const message = messages[Math.floor(Math.random() * messages.length)];

    try {
        await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Focus Session Complete! 🎉',
            message: message,
            priority: 2,
            buttons: [
                { title: 'Start Another Session' }
            ],
        });
    } catch (error) {
        // If notifications fail, just log it (user might have disabled them)
        console.log('Could not show notification:', error);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_SESSION') {
        startSession(message.durationMinutes).then(() => sendResponse({ success: true }));
        return true; // async response
    } else if (message.type === 'STOP_SESSION') {
        endSession().then(() => sendResponse({ success: true }));
        return true; // async response
    }
});

// Listen for settings changes to update rules if session is active
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync' && changes.settings) {
        const session = await storage.getSession();
        const newSettings = changes.settings.newValue as Settings;
        // Always update rules when settings change to reflect added/removed permanent sites
        await updateDynamicRules(newSettings.blockedDomains, session.active);
    }
});

async function startSession(durationMinutes: number) {
    const settings = await storage.getSettings();
    const endsAtEpochMs = Date.now() + durationMinutes * 60 * 1000;

    // Update rules for active session (blocks everything)
    const ruleIds = await updateDynamicRules(settings.blockedDomains, true);

    await storage.setSession({
        active: true,
        endsAtEpochMs,
        activeRuleIds: ruleIds,
    });

    chrome.alarms.create(FOCUS_ALARM_NAME, {
        when: endsAtEpochMs,
    });

    // Update icon to active
    chrome.action.setIcon({
        path: {
            "16": "icons/icon16_active.png",
            "32": "icons/icon32_active.png",
            "48": "icons/icon48_active.png",
            "128": "icons/icon128_active.png"
        }
    });

    console.log(`Focus session started for ${durationMinutes} minutes.`);
}
