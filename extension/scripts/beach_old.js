var uniqueID = (function() {
   var id = 0; // This is the private persistent value
   return function() { return id++; };  // Return and increment
})(); // Invoke the outer function after defining it.

function findSuperStructure(elems, tag) {
    var superStructure = [];
    if(typeof tag == "undefined")
        tag = false;
    
    for(var i = 0; i < elems.length; i++) {
        var currElem = $(elems[i]);
        var prevElem = null;
        while(currElem.length > 0) {
            var subElems = [];
            for(var j = 0; j < elems.length; j++) {
                if(j != i) {
                    subElems.push(elems[j]);
                }
            }
            
            if(eachContains(currElem, subElems)) {
                superStructure.push(prevElem[0]);
                
                if(tag) {
                    var uid = uniqueID();
                    $(elems[i]).attr("price-id", uid);
                    $(elems[i]).addClass("vs_price");
                    $(prevElem[0]).attr("price-id", uid);
                    $(prevElem[0]).addClass("vs_container");
                }
                
                break;
            }
            prevElem = currElem;
            currElem = $(currElem).parent();
        }
    }
    
    return superStructure;
}

function eachContains(elem, arr) {
    for(var i = 0; i < arr.length; arr++) {
        if($.contains($(elem)[0], $(arr[i])[0])) {
            return true;
        }
    }
    return false;
}

function aggregate(labels) {
    var tagged = $(".vsid");
    var vsidArr = new Set();
    for(var i = 0; i < tagged.length; i++) {
        vsidArr.add($(tagged[i]).attr("vsid"));
    }
    vsidArr = [...vsidArr];

    var allLabels = labels.mandatory_labels.concat(labels.data_labels);
    collective = [];
    
    for(var i = 0; i < vsidArr.length; i++) {
        var matches = findElement([{"prop-vsid":"=" + vsidArr[i]}]);
        var prices = $(".vs_price", matches);
        var obj = {"vsid":vsidArr[i]};
        obj["price"] = [];
        for(var x = 0; x < prices.length; x++) {
            obj["price"].push($(prices[x]).text());
        }
            
        var foundAll = true;
        for(var l = 0; l < allLabels.length; l++) {
            var label = Object.keys(allLabels[l])[0]
            var element = $(".vs_" + label, matches);
            if(element.length > 0) {
                var infoToFetch = allLabels[l][label];
                var fetchedInfo = {};
                
                for(var x = 0; x < infoToFetch.length; x++) {
                    fetchedInfo[infoToFetch[x]] = [];
                    for(var y = 0; y < element.length; y++) {
                        if(infoToFetch[x] == "text") {
                            fetchedInfo[infoToFetch[x]].push($(element[y]).text());
                        }
                        else {
                            fetchedInfo[infoToFetch[x]].push($(element[y]).attr(infoToFetch[x]));
                        }   
                    }
                }
                obj[label] = fetchedInfo;
            }
            else if(l < labels.mandatory_labels.length) { // ie contained within mandatory labels
                foundAll = false;
                break;
            }
        }
        if(foundAll) {
            collective.push(obj);
        }
    }
    
    return collective;
}

function collectPriceData(labels) {
    var prices = $(".vs_price");
    
    var allLabels = labels.mandatory_labels.concat(labels.data_labels);
    
    collective = [];
    
    for(var i = 0; i < prices.length; i++) {
        var price_id = $(prices[i]).attr("price-id");
        var matches = findElement([{"prop-price-id":"=" + price_id}]);
        
        var obj = {};
        //obj["price"] = $(prices[i]).text();
        //obj["price_id"] = price_id;
            
        var foundAll = true;
        for(var l = 0; l < allLabels.length; l++) {
            var label = Object.keys(allLabels[l])[0]
            var element = $(".vs_" + label, matches);
            if(element.length > 0) {
                var infoToFetch = allLabels[l][label];
                var fetchedInfo = {};
                
                for(var x = 0; x < infoToFetch.length; x++) {
                    fetchedInfo[infoToFetch[x]] = [];
                    for(var y = 0; y < element.length; y++) {
                        if(infoToFetch[x] == "text") {
                            fetchedInfo[infoToFetch[x]].push($(element[y]).text());
                        }
                        else {
                            fetchedInfo[infoToFetch[x]].push($(element[y]).attr(infoToFetch[x]));
                        }   
                    }
                }
                obj[label] = fetchedInfo;
            }
            else if(l < labels.mandatory_labels.length) { // ie contained within mandatory labels
                foundAll = false;
                break;
            }
        }
        if(foundAll) {
            collective.push(obj);
        }
    }
    
    return collective;
}

function tagDescriptors(superStruct, descArr) {
    domArr = [];
    for(var i = 0; i < superStruct.length; i++) {
        var priceID = $(superStruct[i]).attr("price-id");
        var doms = {"price": $(".vs_price", "[price-id=" + priceID + "]"),
                   "container": $(".vs_container", "[price-id=" + priceID + "]")};
        for(var j = 0; j < descArr.length; j++) {
            var name = descArr[j].name;
            var desc = [];//descArr[j].desc;
            
            for(var x = 0; x < descArr[j].desc.length; x++) {
                desc.push(jQuery.extend(true, {}, descArr[j].desc[x]));
            }
            
            for(var x = 0; x < desc.length; x++) {
                var key = Object.keys(desc[x])[0];
                if(typeof desc[x][key] == "object" && "ref" in desc[x][key]) {
                    //var ref = desc[x][key].ref;
                    var ref = desc[x][key].ref;
                    var backup = desc[x][key];
                    desc[x][key] = doms[ref];
                }
            }
            
            var elem = [];
            if("matches" in descArr[j]) {
                elem = findElement(desc, doms[descArr[j].matches]);
            }
            else {
                elem = findElement(desc, [superStruct[i]], true);   
            }
            doms[name] = elem;
            $(elem).attr("price-id", priceID);
            $(elem).addClass("vs_" + name);
        }
        domArr.push(doms);
    }
}

function waitFor(desc, int, cb) {
    var interval = setInterval(function() {
        var matches = findElement(desc);
        if(matches.length > 0) {
            clearInterval(interval);
            cb(matches);
        }
    }, int);
}