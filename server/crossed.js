var Horseman = require('node-horseman');
var page = new Horseman();

page
    .open('https://www.google.com/flights/#search;f=BOS;t=JFK,EWR,LGA;d=2016-06-26;r=2016-06-30')
    .injectJs("scripts/underscore.js")
    .injectJs("scripts/sel.js")
    .injectJs("sites/google-flights.js")
    .evaluate(function(done) {
        var showMoreFlights = [{"contents-1000":"[+lt]show"}, {"contents-1000":"[+lt]longer"}, {"contents-1000":"[+lt]expensive"}];
        var hideMoreFlights = [{"contents-1000":"[+lt]hide"}, {"contents-1000":"[+lt]longer"}, {"contents-1000":"[+lt]expensive"}];
        //done();
        waitFor(showMoreFlights, 1000, function(moreFlightsButton) {
            //console.log("waiting");
            $(moreFlightsButton).trigger("click");
            waitFor(hideMoreFlights, 1000, function(lessFlightsButton) {
                var res = flightsLoaded(lessFlightsButton);
                done(null, JSON.stringify(res)); 
            });
        });
    })
    .then(function(msg) {
        console.log(msg);
        page
            .screenshot("test6.png")
            .close();
    });