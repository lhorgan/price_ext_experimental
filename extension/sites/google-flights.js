var vsScraperVersion = "001";

if(typeof window.vs_scraper == "undefined") {
    window.vs_scraper = true;
    vs_init();
}

function vs_init() {
    var flightNumButton = [{"contents-100":"[+lt]longer"}, {"contents-100":"[+lt]expensive"}];
    
    waitFor(flightNumButton, 1000, function(flightsButton) {
        vs_init_ui();
    });
}

function vs_continue() {
    var flightNumButton = findElement([{"contents-100":"[+lt]longer"}, {"contents-100":"[+lt]expensive"}]);
    if($(flightNumButton).text().toLowerCase().indexOf("show") >= 0) {
        //alert("We need to expand the flights");
        var lessFlights = [{"contents-100":"[+lt]hide"}, {"contents-100":"[+lt]longer"}, {"contents-100":"[+lt]expensive"}];
        $(flightNumButton).trigger("click");
        waitFor(lessFlights, 1000, function(lessFlightsButton) {
            execScrape();
        });
    }
    else {
        execScrape();
    }
}

function execScrape() {
    var jsonBlock = 
        [{"desc":[{"chain":[{"contents-20":"+$"},{"sibling-":{"chain":[{"contents-20":"+trip"}]}}]},{"name":"temp_prices"}]},{"desc":[{"super":{"ref":"temp_prices"}},{"name":"vs_container","vsid":"generate","tag":true}]},{"desc":[{"chain":[{"contents-20":"+$"},{"tag-":"=div"}]},{"name":"vs_price","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","tag":true,"grab":"text","mandatory":true,"cascade":true}]},{"desc":[{"chain":[{"contents-20":"+trip"}]},{"name":"vs_trip_type","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","grab":"text","mandatory":true,"cascade":true,"tag":true}]},{"desc":[{"chain":[{"contents-20":"+stop"}]},{"name":"vs_stop_type","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","grab":"text","mandatory":true,"cascade":true,"tag":true}]},{"desc":[{"chain":[{"nav-":"parent,prev,child"}]},{"ctxt":{"ref":"vs_stop_type"},"cascade":true,"name":"vs_duration","vsid":"generate","tag":true,"grab":"text","mandatory":true}]},{"desc":[{"union":[{"union":[{"chain":[{"contents-30":"[+l]am – "}, {"visibility-":"visible"}]},{"chain":[{"contents-30":"[+l]pm – "}, {"visibility-":"visible"}]}]},{"chain":[{"contents-30":"+similar flights"},{"nav-":"parent"}]}]},{"name":"vs_timestamp","ctxt":{"ref":"vs_container"},"cascade":true,"vsid":"generate","tag":true,"grab":"text","mandatory":true,"deep":true}]},{"desc":[{"chain":[{"nav-":"next"}]},{"name":"vs_airline","ctxt":{"ref":"vs_timestamp"},"cascade":true,"vsid":"generate","tag":true,"grab":"text","mandatory":true}]},{"desc":[{"chain":[{"nav-":"prev"}]},{"name":"vs_airline_logo","ctxt":{"ref":"vs_timestamp"},"vsid":"generate","tag":true,"grab":"src","mandatory":false,"cascade":true}]},{"desc":[{"chain":[{"nav-":"next"}]},{"name":"vs_airports","ctxt":{"ref":"vs_duration"},"vsid":"generate","grab":"text","mandatory":false,"cascade":true,"tag":true}]},{"desc":[{"chain":[{"nav-":"next"}]},{"name":"vs_layover","ctxt":{"ref":"vs_stop_type"},"vsid":"generate","grab":"text","mandatory":false,"tag":true,"cascade":true}]}];
    
    processJSON(jsonBlock);
    
    vs_scraper_done(labels, ["eo"]);
}