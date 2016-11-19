/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
var currTab = null;
var supportedSites = [{"site": "https://www.google.com/flights", "script":"google-flights", "name": "Google Flights"},
                      {"site": "https://www.amazon.com", "script":"amazon", "name": "Amazon"},
                      {"site": "https://www.priceline.com", "script":"priceline", "name": "Priceline"}];

function getCurrentTab() {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true
        , currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        currTab = tabs[0];
        checkSupport();
    });
}

function checkSupport() {
    chrome.runtime.sendMessage({"query_support":true, "currURL":currTab.url}, function(response) {
        console.log("here's what support is looking like.....");
        console.log(response);
        setTitle(response);
    });
}

var disableButton = $('<button type="button" class="btn btn-danger">Disable this site.</button>');
var enableButton = $('<button type="button" class="btn btn-success">Enable this site.</button>');

function setTitle(support) {
    console.log("support in setTitle: " + JSON.stringify(support));
    if(support.base_support || support.trigger_support) {
        document.getElementById("title").innerHTML = support.name + ": supported site!";
        chrome.storage.local.get(support.name, function(obj) {
            if(typeof obj[support.name] == "undefined" || (typeof obj[support.name] != "undefined" && obj[support.name] == "enabled")) {
                createSearchAgainButton(support.trigger_support);
                createDisableButton(support.name);
            } 
            else if(obj[support.name] == "disabled") {
                createEnableButton(support.name);
            }
        }); 
    }
}

function createEnableButton(name) {
    var enableButton = $('<button type="button" class="btn btn-success btn_padding">Enable this site.</button>');
    enableButton.click(function() {
        var obj = {};
        obj[name] = "enabled";
        chrome.storage.local.set(obj, function() {
            createDisableButton(name);
        });
    });
    $("#toggleDisable").html(enableButton);
}
                       
function createDisableButton(name) {
    var disableButton = $('<button type="button" class="btn btn-danger btn_padding">Disable this site.</button>');
    disableButton.click(function() {
        var obj = {};
        obj[name] = "disabled";
        chrome.storage.local.set(obj, function() {
            createEnableButton(name);
        });
    });
    $("#toggleDisable").html(disableButton);
}

function createSearchAgainButton(triggerSupport) {
    chrome.tabs.sendMessage(currTab.id, {"has_vsid":true}, function(response) {
        if(!response.found_vsid && triggerSupport) {
            var searchAgainButton = $('<button type="button" class="btn btn-success btn_padding">Compare Prices</button>');
            searchAgainButton.click(function() {
                // trigger another search somehow
                chrome.tabs.sendMessage(currTab.id, {"popup_scrape": true}, function(response) {});
                window.close(); 
            });
            $("#searchAgain").html(searchAgainButton);
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    console.log("VS popup loaded");
    $("#survey_link").click(function() {
        chrome.tabs.create({'url': "/options.html#survey" } );
    });
    $("#learn_more_link").click(function() {
        chrome.tabs.create({'url': "/options.html#learn" } );
    });
    $("#manage_link").click(function() {
        chrome.tabs.create({'url': "/options.html#manage" } );
    });
    getCurrentTab();
});