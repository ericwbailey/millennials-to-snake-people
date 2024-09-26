let disabledInTabs = new Set();
let disabledSites = new Set();
let activeTab = -1;

function updateIcon() {
    if (disabledInTabs.has(activeTab)) {
        chrome.browserAction.setIcon({
            path: {
                "16": "icon16-disabled.png",
                "32": "icon32-disabled.png",
                "48": "icon48-disabled.png",
                "128": "icon128-disabled.png"
            },
            tabId: activeTab
        });
    } else {
        chrome.browserAction.setIcon({
            path: {
                "16": "icon16-enabled.png",
                "32": "icon32-enabled.png",
                "48": "icon48-enabled.png",
                "128": "icon128-enabled.png"
            },
            tabId: activeTab
        });
    }
}

function saveDisabled() {
    chrome.storage.sync.set({"disabledSites": Array.from(disabledSites)})
}

let tabUrls = {}

chrome.tabs.onUpdated.addListener(function(tabID, changeInfo) {
    if (!changeInfo.url) {
        updateIcon();
        return;
    }
    const url = new URL(changeInfo.url);

    if (disabledSites.has(url.hostname)) {
        disabledInTabs.add(tabID);
    } else {
        disabledInTabs.delete(tabID);
    }

    updateIcon();
});

chrome.tabs.onActivated.addListener(function(activatedTab) {
    activeTab = activatedTab.tabId;
    chrome.tabs.get(activatedTab.tabId, function(tab) {
        if (!tab) {
            return;
        }

        if (tab.url) {
            const url = new URL(tab.url);
            tabUrls[tab.tabId] = url.hostname;
            if (disabledSites.has(url.hostname)) {
                disabledInTabs.add(tab.id);
            } else {
                disabledInTabs.delete(tab.id);
            }
        }

        updateIcon();
    });
});

chrome.browserAction.onClicked.addListener(function(tab) {
    const url = new URL(tab.url);
    if (disabledSites.has(url.hostname)) {
        disabledSites.delete(url.hostname);
        disabledInTabs.delete(tab.id);
    } else {
        disabledSites.add(url.hostname);
        disabledInTabs.add(tab.id);
    }

    updateIcon();
    saveDisabled();
});

chrome.storage.sync.get("disabledSites", function(stored) {
    if ("disabledSites" in stored && Object.keys(stored["disabledSites"]).length > 0) {
        disabledSites = new Set(stored["disabledSites"]);
        updateIcon();
        chrome.tabs.query({currentWindow: true, active:true}, function(tabs) {
            if (tabs.length != 1) {
                console.log("invalid length " + tabs.length);
            }
            activeTab = tabs[0].id;
            updateIcon();
        });
    }
});
