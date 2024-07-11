let usageData = {};
let activeTabId = null;
let activeTabDomain = null;
let activeTabInterval = null;
const trackingInterval = 60000; // 1 minute

// Initialize usageData from storage or as an empty object
chrome.storage.local.get(['usageData'], result => {
    usageData = result.usageData || {};
});

// Event listener for when a tab is activated
chrome.tabs.onActivated.addListener(activeInfo => {
    updateActiveTab(activeInfo.tabId);
});

// Event listener for when a tab is updated (e.g., URL change)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.status === 'complete') {
        updateActiveTab(tabId);
    }
});

// Function to update the active tab and start tracking
function updateActiveTab(tabId) {
    clearInterval(activeTabInterval);
    activeTabId = tabId;

    chrome.tabs.get(activeTabId, (tab) => {
        if (tab && tab.url) {
            const url = new URL(tab.url);
            activeTabDomain = url.hostname;

            if (!usageData[activeTabDomain]) {
                usageData[activeTabDomain] = 0;
            }

            // Start tracking usage for the active tab
            activeTabInterval = setInterval(() => {
                usageData[activeTabDomain] += 1;
                console.log(`Updated usage data for ${activeTabDomain}: ${usageData[activeTabDomain]} minutes`);
                chrome.storage.local.set({ usageData: usageData });
            }, trackingInterval);
        }
    });
}

// Set up an alarm to periodically wake up the service worker and check active tab usage
chrome.alarms.create('trackUsage', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'trackUsage' && activeTabId) {
        // Log usage data at regular intervals
        if (activeTabDomain) {
            usageData[activeTabDomain] += 1;
            console.log(`Alarm triggered. Updated usage data for ${activeTabDomain}: ${usageData[activeTabDomain]} minutes`);
            chrome.storage.local.set({ usageData: usageData });
        }
    }
});
