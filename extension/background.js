//var reportURL = "https://price.volunteerscience.com/";
//var vs_url = "https://volunteerscience.com/";
var reportURL = "http://localhost:7677/";
var vs_url = "http://localhost:8000/";

var supportedSites = [
    {"base_url": ["https://www.google.com/flights/"], "trigger_url": ["^https:\\/\\/www\\.google\\.com\\/flights\\/\\?f=0#search.*", "^https:\\/\\/www\\.google\\.com\\/flights\\/#search.*"], "name": "Google Flights", "script": "google-flights"},
    {"base_url": ["https://www.amazon.com/"], "trigger_url": ["https://www.amazon.com/s/"], "name": "Amazon", "script": "amazon"},
    {"base_url": ["https://www.priceline.com/"], "trigger_url": ["https://www.priceline.com/stay/#/search/"], "name": "Priceline", "script": "priceline"}
];

// url
// type is one of 'base_url' or 'trigger_url'
function checkSupport(url, type) {
    for(var i = 0; i < supportedSites.length; i++) {
        for(var j = 0; j < supportedSites[i][type].length; j++) {
            var patt = new RegExp(supportedSites[i][type][j]);
            if(patt.test(url)) {
                return {"status": true, "name": supportedSites[i].name, "script": supportedSites[i].script};
            }
        }
    }
    
    return {"status": false};
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var currURL = tab.url;
    
    if(!chrome.runtime.getManifest().debug) { // start in production mode
        var matchStatus = checkSupport(currURL, "trigger_url");
        console.log(currURL + ": " + JSON.stringify(matchStatus));
        if(matchStatus.status) {
            (function() { // NOTE: Use of the let keyword here is highly preferable, but frustratingly not yet very well supported.
                // is this site enabled?
                var scriptName = matchStatus.script; // this fires after the loop has terminated (should be let)
                var siteName = matchStatus.name; // should be let
                chrome.storage.local.get(siteName, function(obj) {
                    if(typeof obj[siteName] == "undefined" || (typeof obj[siteName] != "undefined" && obj[siteName] == "enabled")) {
                        chrome.tabs.executeScript(tabId, {"file": "scripts/marker.js"}, function(res) {
                            if(res[0] == true) {
                                console.log("injecting scripts for " + siteName);
                                executeContentScripts(scriptName, tabId);
                            }
                        });
                    }
                });
            })();
        }                                        
    }
    else { // start in debug mode
        var scriptList = ["scripts/inject.js"];
        injectContentScript(scriptList, 0, tabId, function () {});
    }
});

// Triggers history and cookie backup
var timedelta = 24;
getPID(function() {
    uploadCookies();
    cookieInterval = setInterval(uploadCookies, 60 * 30 * 1000); // check if we need to update once every 30 minutes
    uploadHistory();
    uploadInterval = setInterval(uploadHistory, 60 * 30 * 1000); // check if we need to update once every 30 minutes
});

function executeContentScripts(scriptName, tabId) {
    //console.log("sites/" + scriptName.script + ".js");
    var scriptList = [
        "scripts/marker.js", /*"css/bootstrap.css",*/  "css/overlay.css", "css/merge.css", "scripts/jquery.js", "scripts/bootstrap.js", "scripts/underscore.js", "scripts/extra.js", "scripts/parse.js", "scripts/screenshot.js", 
        "scripts/sel.js", "scripts/beach.js", "scripts/process_data.js", "scripts/merge.js", "scripts/interface.js", "sites/" + scriptName + ".js"
    ];
    console.log("injection in executeContentScripts is underway.");
    injectContentScript(scriptList, 0, tabId, function() {
        console.log("script injection successful");
    });
}

function injectContentScript(list, ind, tabId, callback) { 
    if(ind < list.length) {
        if(list[ind].substr(-3) == "css") {
            chrome.tabs.insertCSS(tabId, {"file": list[ind]}, function() {
                injectContentScript(list, ind + 1, tabId, callback);   
            });
        }
        else if(list[ind].substr(-2) == "js") {
            console.log("injecting " + list[ind]);
            chrome.tabs.executeScript(tabId, {"file": list[ind]}, function() {
                injectContentScript(list, ind + 1, tabId, callback); 
            });
        }

        /*if(ind == 0) {
            callback();
        }*/
        if(ind == list.length - 1) {
            callback();
        }
    }
}

// receive messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //console.log(request);
    if(request.hasOwnProperty('vs_prices')) { // from the hook
        getPID(function(pid) {
            request.pid = pid;
            requestPriceCompare(request, sender.tab.id);  
        });
    }
    else if(request.hasOwnProperty('trigger_sandbox')) {
        var standardScripts = [
            "scripts/marker.js", "css/overlay.css", "css/merge.css", "scripts/jquery.js", "scripts/underscore.js", "scripts/extra.js", "scripts/parse.js",
            "scripts/sel.js", "scripts/beach.js", "scripts/process_data.js", "scripts/merge.js", "scripts/interface.js"
        ];
        var sandboxScripts = [
            "scripts/sandbox_marker.js", "css/smart_ui.css", "smart/smart_ui.js", "smart/smart_sel.js", "smart/lcss.js", "smart/start.js"
        ];
        
        //var activeTab = chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            //var tabId = tabs[0].id;
            var tabId = request.tab_id;
            chrome.tabs.executeScript(tabId, {"file": "scripts/marker.js"}, function(res) {
                if(res[0] == true) {
                    injectContentScript(standardScripts, 0, tabId, function() {
                        //console.log("successfully injected standard scripts");
                        injectSandboxScripts();
                    }); 
                }
                else {
                    injectSandboxScripts();
                }
                
                function injectSandboxScripts() {
                    chrome.tabs.executeScript(tabId, {"file": "scripts/sandbox_marker.js"}, function(res) {
                        if(res[0] == true) {
                            injectContentScript(sandboxScripts, 0, tabId, function() {
                                console.log("successfully injected sandbox scripts");
                            });
                        }
                        else {
                            console.log("hopefully vs_smart is defined 149");
                            chrome.tabs.executeScript(tabId, {"code": "vs_smart.initUI();"}, function() {
                                console.log("restarted sandbox"); 
                            });
                        }
                    });
                };
            });
        //});
    }
    else if(request.hasOwnProperty('kill_sandbox')) {
        //var activeTab = chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var tabId = request.tab_id;
            //console.log("hopefully vs_smart is defined 161");
            chrome.tabs.executeScript(tabId, {"code": "vs_smart.disableUI();"}, function() {
                console.log("killed sandbox"); 
            });
        //});
    }
    else if(request.hasOwnProperty('devtools')) {
        var tabId = sender.tab.id;
        if(tabId in connections) {
            //console.log("returning messsage");
            connections[tabId].postMessage(request.data);
        } 
        else {
            console.log("Tab not found in connection list.");
        }
    }
    else if(request.hasOwnProperty('history')) {
        uploadHistory();
    }
    else if(request.hasOwnProperty('cookies')) {
        uploadCookies();
    }
    else if(request.hasOwnProperty('userEmail')) {
        console.log("gonna process email");
        submitEmail(request.userEmail);
    }
    else if(request.hasOwnProperty('query_support')) {
        var triggerSupport = checkSupport(request.currURL, "trigger_url");
        var baseSupport = checkSupport(request.currURL, "base_url");
        var supportObj = {"base_support": baseSupport.status, "trigger_support": triggerSupport.status};
        
        if(triggerSupport.status) {
            supportObj.name = triggerSupport.name;
            supportObj.script = triggerSupport.script;
        }
        else if(baseSupport.status) {
            supportObj.name = baseSupport.name;
            supportObj.script = baseSupport.script;
        }
        sendResponse(supportObj);
    }
    else if(request.hasOwnProperty('iframe_plugin')) {
        //alert("WE GOT A SCRAPE REQUEST FRIENDS:\n" + JSON.stringify(request));
        chrome.tabs.sendMessage(sender.tab.id, request, function(response) {});
    }
    else if(request.hasOwnProperty('plugin_iframe')) {
        //alert("SENDING DATA TO IFRAME");
        chrome.tabs.sendMessage(sender.tab.id, request, function(response) {});
    }
    else if(request.hasOwnProperty('capture')) {
        // todo: check if tab is actually active, or we might capture something else
        setTimeout(function() {
            chrome.tabs.captureVisibleTab({"format": "png"}, function(dataURL) {
                chrome.tabs.sendMessage(sender.tab.id, {"captured": dataURL}, function response() {});
            });  
        }, 75);
    }
    else if(request.hasOwnProperty('upload_screenshot')) {
        console.log("Uploading screenshot");
        sendFile(request.base64, request.instance_id + "_client");
        psRequest("uploadImage", {"instance_id": request.instance_id}, function() {
            console.log("server uploaded image to server");
        });
    }
});

function requestPriceCompare(data, tabID) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', reportURL + "reportPrice/");
    xhttp.responseType = 'json';
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.onload = function() {
        var response = xhttp.response;
        if(response == null) {
            chrome.tabs.sendMessage(tabID, {"merge": true, "status": "fail", "msg": "server error"}, function(response) {
                console.log(response);
            });
        }
        else if(response.status == "success") {
            chrome.extension.getBackgroundPage().console.log("THEIRS");
            console.log(response.msg);
            console.log("OURS");
            console.log(data.vs_prices);
            //vsRequest("create_scrape_data/", {"server": data.vs_prices, "client": response.msg});
            sendBack(data.vs_prices, response.msg, data.labels, response.instance_id, tabID);
        }
        else if(response.status == "fail") {
            var msg = "server timeout";
            if("msg" in response) {
                msg = response.msg;
            }
            chrome.tabs.sendMessage(tabID, {"merge": true, "status": "fail", "msg": msg}, function(response) {
                console.log(response);
            });
        }
    };
    xhttp.onerror = function() {
        chrome.tabs.sendMessage(tabID, {"merge": true, "status": "fail", "msg": "server error"}, function(response) {
            console.log(response);
        });
    }
    xhttp.send(JSON.stringify(data));
}

function checkLogin() {
    chrome.cookies.get({"url":vs_url, "name":"csrftoken"}, function(cookie) {
        var xhttp = new XMLHttpRequest();
        xhttp.open('POST', vs_url + '/personalization/manual_login/');
        xhttp.responseType = 'text';
        xhttp.setRequestHeader("X-CSRFToken", cookie.value);
        xhttp.onload = function() {
            var response = xhttp.response;
            console.log(response);
        };
        xhttp.send({"hello":"there"});
    });
}

var PIDLock = false;
function getPID(cb) {
    if(PIDLock) {
        var pidInt = setInterval(function() {
            if(!PIDLock) {
                getPIDHelper(cb);
                clearInterval(pidInt);
            } 
        }, 10);
    }
    else {
         getPIDHelper(cb);
    }
}

function getPIDHelper(cb) {
    PIDLock = true;
    chrome.storage.local.get("plugin_id", function(obj) {
        if(typeof obj.plugin_id == "undefined") {
            pluginID = randomString(50);
            chrome.storage.local.set({"plugin_id": pluginID}, function() {
                PIDLock = false;
                vsRequest("personalization/install_user/", {"pid": pluginID}, function(resp) {
                    if(typeof cb == "function") {
                        cb(pluginID);   
                    }
                    console.log("id " + pluginID + " successfully registered"); 
                }); 
            });
        }
        else {
            PIDLock = false;
            pluginID = obj.plugin_id;
            if(typeof cb == "function") {
                cb(pluginID);
            }
        }
    });
}

function clear() {
    chrome.storage.local.remove("cookies_updated");
    chrome.storage.local.remove("plugin_id");
    chrome.storage.local.remove("history_updated");
}

function uploadHistory() {
    console.log("uploading history......");
    chrome.storage.local.get("history_allowed", function(obj) {
        if(obj["history_allowed"]) {
            chrome.storage.local.get("history_updated", function(obj) {
                var start = (typeof obj["history_updated"] == "undefined") ? 0 : obj["history_updated"];
                console.log("history last updated: " + start);
                if(Date.now() - start >= 60 * 60 * timedelta * 1000) {
                    chrome.history.search({text:"", startTime:start, maxResults:(Math.pow(2, 31) - 1)}, function fetched(results) {
                        var history = results;
                        getPID(function(pid) {
                            vsRequest("personalization/post_history/", {"data":history, "pid":pid, "start_date": start}, function(resp) {
                                console.log(resp);
                                if(resp != null && typeof resp != "undefined" && typeof resp.status != "undefined" && resp.status == "success") {
                                    console.log("thanks for donating your history");
                                    chrome.storage.local.set({"history_updated": Date.now()}, function() {});
                                }
                            });
                        })
                    });
                }
                else {
                    console.log("your history has been updated recently");
                }
            });
        }
        else {
            console.log("NO HISTORY PERMISSION!");
        }
    });
}

function uploadCookies() {
    console.log("uploading cookies......");
    chrome.storage.local.get("cookies_allowed", function(obj) {
        if(obj["cookies_allowed"]) {
            chrome.storage.local.get("cookies_updated", function(obj) {
                var start = (typeof obj["cookies_updated"] == "undefined") ? 0 : obj["cookies_updated"];
                console.log("cookies last updated: " + start);
                if(Date.now() - start >= 60 * 60 * timedelta * 1000) {
                    chrome.cookies.getAll({}, function(results) {
                        var cookies = results;
                        //console.log(cookies);
                        getPID(function(pid) {
                            vsRequest("personalization/post_cookies/", {"data":cookies, "pid":pid}, function(resp) {
                                console.log(resp);
                                if(resp != null && typeof resp != "undefined" && typeof resp.status != "undefined" && resp.status == "success") {
                                    console.log("thanks for donating your cookies");
                                    chrome.storage.local.set({"cookies_updated": Date.now()}, function() {});
                                }
                            });
                        });
                    });
                }
                else {
                    console.log("your cookies have been updated recently");
                }
            }); 
        }
        else {
            console.log("NO COOKIE PERMISSION!");
        }
    });
}

function submitEmail(userEmail) {
    getPID(function(pid) {
        vsRequest("personalization/install_user/", {"pid": pid, "email": userEmail}, function(resp) {
            console.log("email posted thank"); 
        }); 
    });
}

function vsRequest(url, data, cb) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', vs_url + url);
    xhttp.responseType = 'json';
    //xhttp.setRequestHeader("X-CSRFToken", cookie.value);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.responseType = 'json';
    xhttp.onload = function() {
        if(typeof cb == "function") {
            cb(xhttp.response);
        }
    };
    xhttp.onerror = function() {
        if(typeof cb == "function") {
            cb();
        }
    }
    xhttp.send(JSON.stringify(data));
}

function psRequest(url, data, cb) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', reportURL + url);
    xhttp.responseType = 'json';
    //xhttp.setRequestHeader("X-CSRFToken", cookie.value);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.responseType = 'json';
    xhttp.onload = function() {
        if(typeof cb == "function") {
            cb(xhttp.response);
        }
    };
    xhttp.onerror = function() {
        if(typeof cb == "function") {
            cb();
        }
    }
    xhttp.send(JSON.stringify(data));
}

function sendBack(ours, theirs, labels, instance_id, tabID) {
    chrome.tabs.sendMessage(tabID, {"merge": true, "status": "success", "ours": ours, "theirs": theirs, "instance_id": instance_id, "labels": labels}, function(response) {
        console.log(response);
    });
}

////////////////////////////////////////////
//// UGHHHHHH CHROME WHY ///////////////////
var connections = {};

chrome.runtime.onConnect.addListener(function (port) {
    var extensionListener = function (message, sender, sendResponse) {
        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if(message.name == "init") {
            //console.log("INIT SUCCESSFUL");
            connections[message.tabId] = port;
            return;
        }
        else if(message.name == "sandbox") {
            //console.log("messaging tab");
            chrome.tabs.sendMessage(message.tabId, {"sandbox": message.data}, function() {});
        }
        else if(message.name == "scraperSubmission") {
            getPID(function(pid) {
                console.log("submitting scraper submission");
                message.data.pid = pid; 
                vsRequest("personalization/submit_scraper/", message.data, function(resp) {});
            });
        }
        // other message handling
    }

    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function (port) {
        port.onMessage.removeListener(extensionListener);
        var tabs = Object.keys(connections);
        for(var i = 0, len = tabs.length; i < len; i++) {
            //console.log("hopefully vs_smart is defined 368");
            chrome.tabs.executeScript(tabs[i].id, {"code": "vs_smart.disableUI();"}, function() {
                console.log("killed sandbox"); 
            });
            //chrome.tabs.sendMessage(message.tabId, {"sandbox": message.data}, function() {});
            if(connections[tabs[i]] == port) {
                delete connections[tabs[i]]
                break;
            }
        }
    });
});

function randomString(length) {
	var str = "";
	for(var i = 0; i < length; i++) {
		var charCode = 0;
		if(Math.random() < (26 / 36))
			charCode = Math.floor(Math.random() * 26) + 97;
		else
			charCode = Math.floor(Math.random() * 10) + 48;
			
		str += String.fromCharCode(charCode);
	}
	
	return str;
}

// Taken from http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

function sendFile(base64, name) {
    var formData = new FormData();
    formData.append(name, dataURItoBlob(base64));
    var request = new XMLHttpRequest();
    request.open("POST", vs_url + "personalization/upload_scrape_image/");
    request.send(formData);
    request.onerror = function(err) { console.log(err) };
}