let usageData = {};
let activeTabId = null;
let activeTabDomain = null;
let trackingInterval = null;

// Function to initialize or reset usageData
function initializeUsageData() {
    const today = new Date().setHours(0, 0, 0, 0); // Today's date at midnight
    chrome.storage.local.get(['lastResetTime', 'usageData'], result => {
        const lastResetTime = result.lastResetTime || 0;
        if (lastResetTime < today) {
            usageData = {};
            chrome.storage.local.set({ usageData: {}, lastResetTime: today });
            console.log('Usage data reset for the day.');
        } else {
            usageData = result.usageData || {};
        }
    });
}

// Initialize usageData when the extension is installed or updated
chrome.runtime.onInstalled.addListener(initializeUsageData);

// Update active tab and start tracking
function updateActiveTab(tabId) {
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        if (tab && tab.url) {
            const url = new URL(tab.url);
            const newDomain = url.hostname;

            if (newDomain !== activeTabDomain) {
                activeTabId = tabId;
                activeTabDomain = newDomain;
                startTracking();
            }
        }
    });
}

// Start tracking for the active tab
function startTracking() {
    stopTracking();

    if (!activeTabDomain) return;

    if (!usageData[activeTabDomain]) {
        usageData[activeTabDomain] = 0;
    }

    trackingInterval = setInterval(() => {
        usageData[activeTabDomain]++;
        chrome.storage.local.set({ usageData: usageData });
        console.log(`Updated usage for ${activeTabDomain}: ${usageData[activeTabDomain]} seconds`);
    }, 1000); // Update every second
}

// Stop tracking
function stopTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(activeInfo => {
    updateActiveTab(activeInfo.tabId);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tabId === activeTabId) {
        updateActiveTab(tabId);
    }
});

// Listen for windows focus change
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        stopTracking();
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                updateActiveTab(tabs[0].id);
            }
        });
    }
});

// Initialize data on startup
chrome.runtime.onStartup.addListener(initializeUsageData);

// Implement website blocking
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    const url = new URL(details.url);
    const domain = url.hostname.toLowerCase();

    chrome.storage.local.get({ blockedWebsites: {} }, (result) => {
        const blockedWebsites = result.blockedWebsites;
        if (blockedWebsites.hasOwnProperty(domain)) {
            chrome.tabs.update(details.tabId, { url: "https://arshdkhan.github.io/" });
        }
    });
});