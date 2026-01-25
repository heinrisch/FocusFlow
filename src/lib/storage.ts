export interface BlockedSite {
    url: string;
    type: 'focus' | 'permanent';
}

export interface Settings {
    blockedDomains: BlockedSite[];
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
        { url: 'facebook.com', type: 'focus' },
        { url: 'twitter.com', type: 'focus' },
        { url: 'instagram.com', type: 'focus' },
        { url: 'youtube.com', type: 'focus' },
        { url: 'reddit.com', type: 'focus' },
        { url: 'tiktok.com', type: 'focus' },
        { url: 'snapchat.com', type: 'focus' },
        { url: 'pinterest.com', type: 'focus' },
        { url: 'tumblr.com', type: 'focus' },
        { url: 'twitch.tv', type: 'focus' },
        { url: 'netflix.com', type: 'focus' },
        { url: 'hulu.com', type: 'focus' },
        { url: 'disneyplus.com', type: 'focus' },
        { url: 'amazon.com', type: 'focus' },
        { url: 'ebay.com', type: 'focus' },
        { url: 'etsy.com', type: 'focus' },
        { url: 'linkedin.com', type: 'focus' },
        { url: 'discord.com', type: 'focus' },
        { url: '9gag.com', type: 'focus' },
        { url: 'buzzfeed.com', type: 'focus' },
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

    onChanged(callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void) {
        chrome.storage.onChanged.addListener(callback);
        return () => chrome.storage.onChanged.removeListener(callback);
    },
};
