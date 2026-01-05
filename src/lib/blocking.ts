export async function getBlockedRules(domains: string[]): Promise<chrome.declarativeNetRequest.Rule[]> {
    const blockedPagePath = 'src/blocked/index.html';

    return domains.map((domain, index) => {
        const ruleId = 1000 + index;
        return {
            id: ruleId,
            priority: 1,
            action: {
                type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                redirect: {
                    url: chrome.runtime.getURL(`${blockedPagePath}?domain=${encodeURIComponent(domain)}`),
                },
            },
            condition: {
                urlFilter: `||${domain}`,
                resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
            },
        };
    });
}

export async function updateDynamicRules(domains: string[]): Promise<number[]> {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map((r) => r.id);

    const newRules = await getBlockedRules(domains);
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
