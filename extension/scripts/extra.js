var pluginTypes = {};

function registerType(typename, func) {
    pluginTypes[typename] = func;
}

function refineCollective() {
    console.log(collective);
  
    var refinedCollective = {};
    
    for(var item in collective) {
        var curr = collective[item];    
        // Does this item have all the necessary keys
        var hasAllKeys = true;
        for(var m = 0; m < labels["mandatory-labels"].length; m++) {
            var currKey = Object.keys(labels["mandatory-labels"][m])[0];
            if(!(currKey in collective[item])) {
                //console.log("lacking label " + currKey);
                hasAllKeys = false;
                break;
            }
        }
        if(hasAllKeys) {
            for(var i = 0; i < curr["vs_price"]["element"].length; i++) {
                $(curr["vs_price"]["element"][i]).attr("vs_price_index", i);
            }

            for(var key in curr) {
                if(key.indexOf("vs_price::") == 0 && "vs_price" in curr) {
                    //alert("LOOKING AT " + key);
                    var jsonStr = key.substr(10);
                    //console.log(jsonStr);
                    var metaData = JSON.parse(jsonStr);
                    //console.log(metaData);

                    var priceElements = curr["vs_price"]["element"];
                    var ctxtElements = curr[key]["element"];
                    if(typeof curr["vs_price"]["ctxt"] == "undefined") {
                        curr["vs_price"]["ctxt"] = {};
                        //curr["vs_price"]["gap"] = {};
                    }

                    var ctxtList = [];
                    var dirs = ["left", "right", "above", "below"];
                    for(var i = 0; i < ctxtElements.length; i++) {
                        var type = Object.keys(curr[key])[1];
                        if(typeof curr[key][type][i] != "undefined") {
                            ctxtList.push([]);
                            for(var j = 0; j < priceElements.length; j++) {
                                var allDirsGood = true;
                                var totalDist = 0;
                                var dirFound = false;
                                for(var x = 0; x < dirs.length; x++) {
                                    if(dirs[x] in metaData) {
                                        dirFound = true;
                                        var dir = isDirection(dirs[x], ctxtElements[i], priceElements[j]); // boolean, distance
                                        totalDist += dir[1];
                                        if(!(dir[0] && dir[1] < metaData[dirs[x]])) {
                                            allDirsGood = false;
                                            break;
                                        }
                                    }
                                }
                                if(allDirsGood) {
                                    if(!dirFound) {
                                        totalDist = distance(ctxtElements[i], priceElements[j])[1];
                                    }
                                    //console.log(JSON.stringify(curr[key]));
                                    var li = ctxtList.length - 1;
                                    ctxtList[li].push({"name": curr[key][type][i], "price_index":j, "distance":Math.abs(totalDist), "xprice": $(priceElements[j]).text(), "label": $(ctxtElements[i]).text()});
                                }
                            }
                        }
                    }
                    for(var i = 0; i < ctxtList.length; i++) {
                        ctxtList[i].sort(function(a, b) {
                           return a.distance - b.distance; 
                        });
                    }
                    //console.log("list for " + item + " is:");
                    //console.log(JSON.parse(JSON.stringify(ctxtList)));
                    
                    if("limit" in metaData) {
                        for(var i = 0; i < ctxtList.length; i++) {
                            ctxtList[i].splice(metaData.limit);
                        }
                    }

                    // CTXTELEMENTS LENGHT == CTXTLIST LENGTH
                    var gapLabelList = [];
                    //console.log(JSON.stringify(metaData));
                    var useGap = "gap-left" in metaData || "gap-right" in metaData || "gap-above" in metaData || "gap-below" in metaData;
                    if(useGap) {
                        //console.log("yes, we're going to use a gap");
                        for(var i = 0; i < ctxtList.length; i++) {
                            gapLabelList.push([]);
                            if(ctxtList[i].length > 0) {       
                                var usedPrices = [ctxtList[i][0].price_index];
                                var newPriceAdded = true;
                                while(newPriceAdded) {
                                    newPriceAdded = false;
                                    for(var p = 0; p < priceElements.length; p++) {
                                        if(usedPrices.indexOf(p) < 0) {
                                            // does this price meet all position criteria?
                                            var allDirsGood = true;
                                            var hadDir = false;
                                            var difFound = false;
                                            for(var x = 0; x < dirs.length; x++) {
                                                if(("gap-" + dirs[x]) in metaData) {
                                                    //console.log("gap-" + dirs[x] + "in metadata");
                                                    hadDir = true;
                                                    var dir = isDirection(dirs[x], priceElements[usedPrices[usedPrices.length - 1]], priceElements[p]); // boolean, distance
                                                    if(!dir[0] || dir[1] > metaData["gap-" + dirs[x]]) {
                                                        allDirsGood = false;
                                                        break;
                                                    }
                                                    break; // WE ONLY LOOK AT THE FIRST DIRECTION YOU SPECIFY.  MORE COMPLICATED LABEL SCHEMES WILL BE SAVED FOR A LATER RELEASE
                                                }
                                            }
                                            if(allDirsGood && hadDir) {
                                                newPriceAdded = true;
                                                usedPrices.push(p);
                                            }
                                        }
                                    }
                                }
                                gapLabelList[i] = usedPrices;
                            }
                        }

                        var gapLabelListMeta = [];
                        for(var g = 0; g < gapLabelList.length; g++) {
                            for(var ind in ctxtList[g]) {
                                var type = Object.keys(curr[key])[1];
                                gapLabelListMeta.push({"name": ctxtList[g][ind].name, "price_index": gapLabelList[g]});
                            }
                        }
                        curr["vs_price"]["ctxt"][metaData.name] = gapLabelListMeta;
                    }
                    else {
                        //console.log("no, no gaps for us");
                        var priceIndeces = [];
                        for(var i = 0; i < ctxtList.length; i++) {
                            for(var ind in ctxtList[i]) {
                                //alert(ind);
                                var found = false;
                                for(var x = 0 ; x < priceIndeces.length; x++) {
                                    if(priceIndeces[x].name == ctxtList[i][ind].name) {
                                        priceIndeces[x].price_index.push(ctxtList[i][ind].price_index);
                                        found = true;
                                        break;
                                    }
                                }
                                if(!found) {
                                    priceIndeces.push({"name": ctxtList[i][ind].name, "price_index": [ctxtList[i][ind].price_index]});
                                }
                            }
                        }
                        curr["vs_price"]["ctxt"][metaData.name] = priceIndeces;
                    }
                }
            }
            refinedCollective[item] = collective[item];
        }
    }
    
    return refinedCollective;
}