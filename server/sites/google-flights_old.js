if(typeof window.vs_scraper == "undefined") {
    window.vs_scraper = true;
    vs_init();
}

function vs_init() {
    alert("STARTING");
    var showMoreFlights = [{"contents-1000":"[+lt]show"}, {"contents-1000":"[+lt]longer"}, {"contents-1000":"[+lt]expensive"}];
    var hideMoreFlights = [{"contents-1000":"[+lt]hide"}, {"contents-1000":"[+lt]longer"}, {"contents-1000":"[+lt]expensive"}];

    waitFor(showMoreFlights, 1000, function(moreFlightsButton) {
        $(moreFlightsButton).trigger("click");
        waitFor(hideMoreFlights, 1000, flightsLoaded);
    });
}

function flightsLoaded(lessFlightsButton, done) {
    var round = findElement([{"contents-20":"+round"}]);
    var prices = findElement([{"contents-20":"+$"}, {"sibling-":round}]);
    var superStruct = findSuperStructure(prices);
    
    var superfluous1 = findElement([{"contents-1000":"[+lt]similar"}], superStruct);
    var superfluous2 = findElement([{"contents-1000":"[+lt]date tip"}], superStruct);
    var superfluous = _.union(superfluous1, superfluous2);
    var usefulSuperStruct = _.difference(superStruct, superfluous);
    
    /* STYLE THE SUPERFLUOUS ELEMENTS */
    $(superfluous).css("color", "red");
    $(superfluous).css("display", "none");
    
    tagDescriptors(usefulSuperStruct, [ 
                                        { "name":"duration", "desc":[{"contents-50":"+ – "}] },
                                        { "name":"stops", "desc":[{"contents-50":"+stop"}] },
                                        { "name":"airline", "desc":[{"sibling-":{"ref":"duration"}}, {"below-":{"ref":"duration"}}] },
                                        { "name":"logo", "desc":[{"sibling-":{"ref":"duration"}}, {"left-":{"ref":"duration"}}] },
                                        { "name":"elapsed", "desc":[{"nav-":"parent,prev,child"}], "matches":"stops" },
                                        { "name":"airports", "desc":[{"nav-":"next"}], "matches":"elapsed" },
                                        { "name":"type", "desc":[{"nav-":"next"}], "matches":"price" },
                                        { "name":"layovers", "desc":[{"nav-":"next"}], "matches":"stops" }
                                                                                                                                                ]);
    
    vs_scraper_done({"mandatory_labels": ["duration", "stops", "airline"], "data_labels": ["logo", "elapsed", "airports", "type", "layovers"]});
}