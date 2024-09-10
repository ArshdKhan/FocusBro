let usageData = {};
let activeTabId = null;
let activeTabDomain = null;
let activeTabInterval = null;
const trackingInterval = 60000; // 1 minute

// Function to initialize or reset usageData
function initializeUsageData() {
    const today = new Date().setHours(0, 0, 0, 0); // Today's date at midnight
    chrome.storage.local.get(['lastResetTime'], result => {
        const lastResetTime = result.lastResetTime || 0;
        if (lastResetTime < today) {
            usageData = {};
            chrome.storage.local.set({ usageData: {}, lastResetTime: today });
            console.log('Usage data reset for the day.');
        } else {
            chrome.storage.local.get(['usageData'], result => {
                usageData = result.usageData || {};
            });
        }
    });
}

// Initialize or reset usageData on extension startup
initializeUsageData();

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
        // Only update usage data if the active tab is still the same
        if (activeTabDomain) {
            usageData[activeTabDomain] += 1;
            console.log(`Alarm triggered. Updated usage data for ${activeTabDomain}: ${usageData[activeTabDomain]} minutes`);
            chrome.storage.local.set({ usageData: usageData });
        }
    }
});

// Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
    initializeUsageData();
});

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        return new Promise((resolve) => {
            chrome.storage.local.get({ blockedWebsites: {} }, function(result) {
                const blockedWebsites = result.blockedWebsites;
                const url = new URL(details.url);
                const domain = url.hostname.toLowerCase();

                if (blockedWebsites.hasOwnProperty(domain)) {
                    resolve({ redirectUrl: "https://arshdkhan.github.io/" });
                } else {
                    resolve({ cancel: false });
                }
            });
        });
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);