vs_smart.initUI();

var selMetaData = {"elements":[]};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got a message");
    if(request.hasOwnProperty("sandbox")) {
        var message = request.sandbox;
        
        if(message.step == "typeNames") {
            //alert("processing mesage name: " + message.anchorName);
            selMetaData["typeNames"] = message.typeNames;
            chrome.runtime.sendMessage({"devtools":true, "data":{"status":"continue"}}, function() {});
        }
        else if(message.step == "typeSelection") {
            var currSel = vs_smart.getSelected().slice();
            vs_smart.clearSelected();
            var typeNames = selMetaData.typeNames;
            var elements = selMetaData.elements;
            
            for(var i = 0; i < typeNames.length; i++) {
                if(typeof elements[typeNames[i]] == "undefined") {
                    if(i == 0) {
                        // this is the anchor group
                        var initSuper = findSuperStructure(currSel);
                        while(initSuper.length > 15) {
                            var toRemove = Math.floor(Math.random() * initSuper.length);
                            $(initSuper[toRemove]).css("display", "none");
                            initSuper.splice(toRemove, 1);
                            currSel.splice(toRemove, 1);
                        }
                    }
                    
                    elements[typeNames[i]] = currSel;
                    break;
                }
            }
            
            chrome.runtime.sendMessage({"devtools":true, "data":{"status":"continue"}}, function() {});
        }
        else if(message.step == "analyze") {
            var vs_overlay = $('<div id="vs_overlay"><div id="vs_overlay_screen"></div> <div id="vs_overlay_body"><span id="scrape_status">Processing... please be patient :)</span></div></div>');
            vs_overlay.prependTo('body');
            $("body").addClass("vs_overlay");
            centerOverlayBody();
            
            setTimeout(function() {
                console.log("alright, i'm gonna start my analysis....");
                var elemGroups = [];
                var elements = selMetaData.elements;
                for(var element in elements) {
                    elemGroups.push({"type": "vs_" + element, "list": normalize(elements[element])});
                }
                console.log("I survived that");
                console.log(elemGroups);
                buildJSON(elemGroups);
            });
        }
        else if(message.step == "processJSON") {            
            sets = {};
            collectiveArr = [];
            collective = {};
            labels = {"mandatory-labels":[], "data-labels": []};
            processJSON(message.data);
            console.log(collectiveArr);
            chrome.runtime.sendMessage({"devtools":true, "data":{"status":"jsonProcessed", "data": collectiveArr}}, function() {});
        }
    }
});

function sendSelector(selector) {
    chrome.runtime.sendMessage({"devtools":true, "data":{"status":"selector", "data":selector}}, function() {});
}

function devlog(msg) {
    chrome.runtime.sendMessage({"devtools":true, "data":{"status":"message", "data":msg}}, function() {});
}