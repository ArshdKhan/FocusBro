let usageData = {};
let activeTabId = null;
let activeTabInterval = null;

chrome.tabs.onActivated.addListener(activeInfo => {
    clearInterval(activeTabInterval);
    activeTabId = activeInfo.tabId;

    chrome.tabs.get(activeTabId, (tab) => {
        if (tab && tab.url) {
            const url = new URL(tab.url);
            const domain = url.hostname;

            if (!usageData[domain]) {
                usageData[domain] = 0;
            }

            activeTabInterval = setInterval(() => {
                usageData[domain] += 1;
                chrome.storage.local.set({ usageData: usageData });
            }, 60000); // Increment usage every minute
        }
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.status === 'complete' && tab.active) {
        const url = new URL(tab.url);
        const domain = url.hostname;

        clearInterval(activeTabInterval);

        if (!usageData[domain]) {
            usageData[domain] = 0;
        }

        activeTabInterval = setInterval(() => {
            usageData[domain] += 1;
            chrome.storage.local.set({ usageData: usageData });
        }, 60000); // Increment usage every minute
    }
});

chrome.tabs.onRemoved.addListener(tabId => {
    if (tabId === activeTabId) {
        clearInterval(activeTabInterval);
        activeTabId = null;
    }
});
