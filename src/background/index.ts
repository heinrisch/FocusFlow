import { storage, type Settings } from '../lib/storage';
import { updateDynamicRules, clearDynamicRules } from '../lib/blocking';

const FOCUS_ALARM_NAME = 'focus-session-alarm';

chrome.runtime.onInstalled.addListener(async () => {
    // Initialize default settings if not present
    const settings = await storage.getSettings();
    await storage.setSettings(settings);
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
    await clearDynamicRules();
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

    console.log('Focus session ended.');
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
        if (session.active) {
            const newSettings = changes.settings.newValue as Settings;
            await updateDynamicRules(newSettings.blockedDomains);
        }
    }
});

async function startSession(durationMinutes: number) {
    const settings = await storage.getSettings();
    const endsAtEpochMs = Date.now() + durationMinutes * 60 * 1000;

    const ruleIds = await updateDynamicRules(settings.blockedDomains);

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
