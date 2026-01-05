export interface Settings {
    blockedDomains: string[];
    uiTheme: 'light' | 'dark' | 'system';
    durationPresets: number[];
}

export interface SessionState {
    active: boolean;
    endsAtEpochMs: number;
    activeRuleIds: number[];
}

const DEFAULT_SETTINGS: Settings = {
    blockedDomains: [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'youtube.com',
        'reddit.com',
        'tiktok.com',
        'snapchat.com',
        'pinterest.com',
        'tumblr.com',
        'twitch.tv',
        'netflix.com',
        'hulu.com',
        'disneyplus.com',
        'amazon.com',
        'ebay.com',
        'etsy.com',
        'linkedin.com',
        'discord.com',
        '9gag.com',
        'buzzfeed.com',
    ],
    uiTheme: 'system',
    durationPresets: [25, 45, 60, 90],
};

const DEFAULT_SESSION: SessionState = {
    active: false,
    endsAtEpochMs: 0,
    activeRuleIds: [],
};

export const storage = {
    async getSettings(): Promise<Settings> {
        const data = await chrome.storage.sync.get('settings');
        const settings = data.settings as Settings | undefined;
        return { ...DEFAULT_SETTINGS, ...(settings || {}) };
    },

    async setSettings(settings: Partial<Settings>): Promise<void> {
        const current = await this.getSettings();
        await chrome.storage.sync.set({ settings: { ...current, ...settings } });
    },

    async getSession(): Promise<SessionState> {
        const data = await chrome.storage.local.get('session');
        const session = data.session as SessionState | undefined;
        return { ...DEFAULT_SESSION, ...(session || {}) };
    },

    async setSession(session: Partial<SessionState>): Promise<void> {
        const current = await this.getSession();
        await chrome.storage.local.set({ session: { ...current, ...session } });
    },

    async clearSession(): Promise<void> {
        await chrome.storage.local.set({ session: DEFAULT_SESSION });
    },

    onChanged(callback: (changes: chrome.storage.StorageChange, areaName: string) => void) {
        chrome.storage.onChanged.addListener(callback);
        return () => chrome.storage.onChanged.removeListener(callback);
    },
};
