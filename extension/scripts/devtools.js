chrome.devtools.panels.create("VS Sandbox", "images/icon16.png", "vs_sandbox.html", function(panel) {
    panel.onShown.addListener(function(panelWindow) {
        chrome.runtime.sendMessage({"trigger_sandbox": true, "tab_id": chrome.devtools.inspectedWindow.tabId}, function(response) {});
    });
    panel.onHidden.addListener(function(panelWindow) {
        chrome.runtime.sendMessage({"kill_sandbox": true, "tab_id": chrome.devtools.inspectedWindow.tabId}, function(response) {});
    });
});