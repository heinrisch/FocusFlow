import { type BlockedSite } from './storage';

export async function getBlockedRules(sites: BlockedSite[], isSessionActive: boolean): Promise<chrome.declarativeNetRequest.Rule[]> {
    const blockedPagePath = 'src/blocked/index.html';

    // Filter sites that should be blocked
    const sitesToBlock = sites.filter(site => {
        if (site.type === 'permanent') return true;
        if (site.type === 'focus' && isSessionActive) return true;
        return false;
    });

    return sitesToBlock.map((site, index) => {
        const ruleId = 1000 + index;
        return {
            id: ruleId,
            priority: 1,
            action: {
                type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                redirect: {
                    url: chrome.runtime.getURL(`${blockedPagePath}?domain=${encodeURIComponent(site.url)}&type=${site.type}`),
                },
            },
            condition: {
                urlFilter: `||${site.url}`,
                resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
            },
        };
    });
}

export async function updateDynamicRules(sites: BlockedSite[], isSessionActive: boolean): Promise<number[]> {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map((r) => r.id);

    const newRules = await getBlockedRules(sites, isSessionActive);
    const newRuleIds = newRules.map((r) => r.id);

    console.log(`Updating rules: removing ${currentRuleIds.length} rules, adding ${newRules.length} rules.`);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: currentRuleIds,
        addRules: newRules,
    });

    return newRuleIds;
}

export async function clearDynamicRules(): Promise<void> {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map((r) => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: currentRuleIds,
    });
}
