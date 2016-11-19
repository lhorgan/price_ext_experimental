function vs_scraper_done(labels, params_blacklist) {
    var ours = collectiveArr;//collectPriceData(labels);
    var url = window.location.href;
    if(typeof params_blacklist != "undefined") {
        for(var i = 0; i < params_blacklist.length; i++) {
            //alert("blacklist: " + params_blacklist[i]);
            var reg = new RegExp(params_blacklist[i] + "=[^&;]*");
            url = url.replace(reg, "");
        }
    }

    chrome.runtime.sendMessage({"vs_prices": ours, "labels": labels, "url":url, "version":vsScraperVersion}, function(response) {});
    // this callback is unreliable between Chrome versions, so I'm not using it
    
    $("#scrape_status").text("waiting for server");
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.hasOwnProperty("has_vsid")) {
            //console.log(typeof document);
            var vsidElems = document.getElementsByClassName("vsid");
            console.log(vsidElems.length);
            //var vsidNums = $(".vsid").length;
            //console.log(vsidNums);
            //console.log("sending response");
            sendResponse({"found_vsid": vsidElems == null ? false : vsidElems.length > 0});
        }
        else if(request.hasOwnProperty("popup_scrape")) {
            //alert("popup scrape started");
            //window.merge_called = undefined;
            delete window.merge_called;
            vs_init_ui_no_modal();
        }
    }
);