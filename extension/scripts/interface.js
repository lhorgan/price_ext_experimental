var execParse = false;
var vsSearchStarted = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.hasOwnProperty("iframe_plugin")) {
        var data = request.iframe_plugin;
        if(data.hasOwnProperty("scrape_start")) {
            execParse = true;
            loadScrapeUI();
        }
        else if(data.hasOwnProperty("modal_closed")) {
            if(execParse) {
                execParse = false;
                startParse();
            }
            else {
                $("#vs_overlay_frame").remove();
            }
        }
        else if(data.hasOwnProperty("survey_modal_closed")) {
            $("#vs_modal_survey").remove();
        }
    }
});

function vs_init_ui() {
    if(!vsSearchStarted) {
        var iframeSrc = chrome.extension.getURL('html/known_site.html');
        var iframe = $("<iframe style='border:0 none; z-index: 10000000000; position:fixed; width: 100%; height: 100%;' src='" + iframeSrc + "' id='vs_overlay_frame'></iframe>");
        iframe.prependTo('body');
        iframe.load(function() {
            messageIframe({"launch_main_modal": true});
        });
    }
}

function messageIframe(data) {
    chrome.runtime.sendMessage({"plugin_iframe": data}, function(response) {});
}

function startParse() {
    if(!vsSearchStarted) {
        $("#scrape_status").text("scraping");
        centerOverlayBody();
        var vsidElems = document.getElementsByClassName("vsid");
        if(vsidElems == null || vsidElems.length == 0) {
            vsSearchStarted = true;
            vs_continue(); 
        }
        else {
            $("#scrape_status").text("Hmm... looks like you scraped this page already...");
            centerOverlayBody();
            setTimeout(disableInterface, 2000);
        }
    }
    else {
        $("#scrape_status").text("Sorry.  Looks like a session is already underway...");
        centerOverlayBody();
        setTimeout(disableInterface, 2000);
    }
}

function vs_init_ui_no_modal() {
    if(surveyTimeout != null) {
        //console.log("CLEARING INTERVAL");
        clearTimeout(surveyTimeout);
    }
    loadScrapeUI();
    startParse();
}

function loadScrapeUI() {
    var spinnerSrc = chrome.extension.getURL("images/icon128.png");
    var vs_overlay = $('<div id="vs_overlay"> <div id="vs_overlay_screen"></div> <div id="vs_overlay_body"> <div id="vs_spinner"><img src=' + spinnerSrc + ' /></div><span id="scrape_status">scraping</span></div></div>');
    //var vs_overlay = $("");
    
    vs_overlay.prependTo('body');
    //$("body").addClass("vs_overlay");
    //$("#vs_overlay").css("display", "none");
    setTimeout(centerOverlayBody, 200); // this is hacky (todo: figure out why it isn't centered correctly)
    centerOverlayBody();
    
    window.onresize = function() {
        centerOverlayBody(); 
    }; 
    
    /*vs_precapture(function() {
        capturePage(function() {
            $("body").addClass("vs_overlay");
            $("#vs_overlay").css("display", "inline");
        }); 
    });*/
}

function centerOverlayBody() {
    centerX = (window.innerWidth / 2) + $(window).scrollLeft();
    centerY = (window.innerHeight / 2) + $(window).scrollTop();
    overlayBodyWidth = $("#vs_overlay_body").width();
    overlayBodyHeight = $("#vs_overlay_body").height();

    $("#vs_overlay_body").offset({"left": centerX - (overlayBodyWidth / 2), "top": centerY - (overlayBodyHeight / 2)});
}

function disableInterface() {
    $("#vs_overlay").fadeOut(500);
    $("#vs_overlay").remove();
    $("#vs_overlay_frame").remove();
    $("body").removeClass("vs_overlay");
}

function surveyPopup() {
    var iframeSrc = chrome.extension.getURL('html/known_site.html');
    var iframe = $("<iframe style='border:0 none; z-index: 10000000000; position:fixed; width: 100%; height: 100%;' src='" + iframeSrc + "' id='vs_modal_survey'></iframe>");
    iframe.prependTo('body');
    iframe.load(function() {
        messageIframe({"launch_survey_modal": true});
    });
}