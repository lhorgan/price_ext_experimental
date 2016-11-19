function Price(str) {
    this.str = str;
}

Price.prototype.resolvePrice = function() {
    var reg = new RegExp("[^0123456789.]");
    //console.log("TYPE IS : " + typeof this.str);
    //console.log(this.str);
    var rawArr = this.str.replace(",", "").split(reg);
    var priceArr = [];
    
    for(var i = 0; i < rawArr.length; i++) {
        if(!isNaN(parseInt(rawArr[i]))) {
            priceArr.push(parseInt(rawArr[i]));
        }
    }
    
    return priceArr;
}

Price.prototype.dollarValue = function() {
    var avg = 0;
    var prices = this.resolvePrice();
    
    for(var i = 0; i < prices.length; i++) {
        avg += prices[i];
    }
    
    return avg / prices.length;
}

Price.prototype.compare = function(other) {
    return this.dollarValue() - other.dollarValue();
}

function getContainer(vsid) {
    return $(".vs_container").filter(function() { return (typeof $(this).attr("vsid") != "undefined" && $(this).attr("vsid") == vsid) })
}
    
/* Generate a random string of LENGTH characters
*/
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

//function pullContext(entry, index) {
//    var ctxt = null;
//    for(var c in entry["ctxt"]) {
//        for(var d in entry["ctxt"][c]) {
//            if(d == index) {
//                ctxt = entry["ctxt"][c][d];
//                break;
//            }
//        }
//    }
//    
//    return ctxt;
//}

function pullContext(entry, index) {
    var ctxt = null;
    var labels = [];
    for(var c in entry["ctxt"]) {
        for(var i = 0; i < entry["ctxt"][c].length; i++) {
            //console.log(JSON.stringify(entry["ctxt"][c]));
            for(var j = 0; j < entry["ctxt"][c][i].price_index.length; j++) {
                if(entry["ctxt"][c][i].price_index[j] == index) {
                    labels.push(entry["ctxt"][c][i].name);   
                }
            }
        }
    }
    labels.sort();
    //console.log(JSON.stringify(labels));
    return JSON.stringify(labels);
}

function merge(ours, theirs, labels) {
    var diffNum = 0;
    
    if(ours.length == 0 || theirs.length == 0) {
        $("#scrape_status").text("no results found... quitting");
        setTimeout(disableInterface, 2000);
        return;
    }
    
    for(var i = 0; i < ours.length; i++) {
        //console.log("checking for " + i);
        var bestMatch = findBestMatch(ours, theirs, i, labels["mandatory-labels"]);
        if(bestMatch >= 0) {
            theirs[bestMatch]["used"] = true;
            //console.log("BEST MATCH FOR OUR " + /*JSON.stringify(ours[i])*/i + " IS THEIR " + /*JSON.stringify(theirs[bestMatch])*/i);
            //alert(JSON.stringify(ours[i].vs_price) + "\n" + JSON.stringify(theirs[bestMatch].vs_price));
            
            var ourElems = $(".vs_price", "[vsid=" + ours[i].vsid + "]");
  
            var ourPrices = ours[i]["vs_price"]["text"];
            var theirPrices = theirs[bestMatch]["vs_price"]["text"];
            
            var priceMatches = [];
            for(var x = 0; x < ourPrices.length; x++) {
                // does this price have a label?
                var ourCtxt = pullContext(ours[i]["vs_price"], x);
                var penaltyArr = [];
                for(var y = 0; y < theirPrices.length; y++) {
                    var penalty = Math.abs(x - y);
                    var ourPrice = new Price(ourPrices[x]);
                    var theirPrice = new Price(theirPrices[y]);
                    penalty += Math.abs(ourPrice.dollarValue() - theirPrice.dollarValue());
                    
                    var theirCtxt = pullContext(theirs[bestMatch]["vs_price"], y);                    
                    if(theirCtxt == ourCtxt) {
                        if(ourCtxt != null) {
                            penalty /= 2;
                        }
                        
                        penaltyArr.push({"theirIndex": y, "penalty": penalty});
                        penaltyArr.sort(function(a, b) {
                            return a.penalty - b.penalty; 
                        });
                    }
                    //console.log(ourPrices[x] + ", " + theirPrices[y] + ":: " + penalty);
                }
                priceMatches.push({"ourIndex": x, "penaltyArr": penaltyArr});
            }
            priceMatches.sort(function(a, b) {
                if(a.penaltyArr.length == 0 || b.penaltyArr.length == 0) {
                    return b.length - a.length;
                }
                return a.penaltyArr[0].penalty - b.penaltyArr[0].penalty; 
            });
            
            var theirPricesUsed = []; // initialize properly
            for(var x = 0; x < priceMatches.length; x++) {
                //console.log("SELECTION FOR " + x);
                var priceDom = findElement([{"class-":"=vs_price"}, {"prop-vsid":"=" + ours[i].vsid}, {"prop-vs_price_index":"=" + priceMatches[x].ourIndex}]);
                //var ourPrice = 
                //var theirPrice = theirPrices[priceMatches[x].penaltyArr[0].theirIndex];
                
                var orderDiff = theirs[bestMatch].index - ours[i].index;
                var orderDiffStr = "" + orderDiff;
                if(orderDiff > 0) {
                    orderDiffStr = "+" + orderDiffStr;
                }
                
                var orderTitle = "";
                var plurality = Math.abs(orderDiff) == 1 ? "" : "s";
                if(orderDiff > 0) {
                    orderTitle = "You saw this result " + Math.abs(orderDiff) + " position" + plurality + " HIGHER.";
                }
                else if(orderDiff < 0) {
                    orderTitle = "You saw this result " + Math.abs(orderDiff) + " position" + plurality + " LOWER.";
                }
                else {
                    orderTitle = "You saw this result at the SAME position as the server";
                }
                
                if(priceMatches[x].penaltyArr.length > 0) {
                    var ourPrice = new Price(ourPrices[priceMatches[x].ourIndex]);
                    var theirPrice = new Price(theirPrices[priceMatches[x].penaltyArr[0].theirIndex]);
                    theirPricesUsed.push(priceMatches[x].penaltyArr[0].theirIndex);
                    
                    var priceClass = "serverSame";

                    //console.log(ourPrice.dollarValue() + "::" + theirPrice.dollarValue());
                    if(ourPrice.dollarValue() > theirPrice.dollarValue()) {
                        diffNum++;
                        priceClass = "serverLess";
                    }
                    else if(ourPrice.dollarValue() < theirPrice.dollarValue()) {
                        diffNum++;
                        priceClass = "serverMore";
                    }
                    
                    /*var priceClone = $(priceDom).clone();
                    priceClone.insertAfter(priceDom);
                    priceClone.text(theirPrices[priceMatches[x].penaltyArr[0].theirIndex]);*/
                    
                    $(priceDom).append("<br /><div class='server'><sup title='" + orderTitle + "'>" + orderDiffStr + "</sup><div class='serverPrice " + priceClass + "'>" + theirPrices[priceMatches[x].penaltyArr[0].theirIndex] + "</div></div>");
                }
                else {
                    var wrapper = $("<div class='clientOnly'></div>");
                    $(priceDom).wrap(wrapper);
                }
            }
            
            var anchorElem = $(".vs_anchor", "[vsid=" + ours[i].vsid + "]");
            var anchorElemTop = $(resolveTopParent(anchorElem[0]));
            var serverPriceHolder = $("<div class='serverPriceHolder'></div>");
            var shouldAppend = false;
            for(var x = 0; x < theirPrices.length; x++) {
                if(theirPricesUsed.indexOf(x) < 0) {
                    //console.log("ONLY OCCURRED ON SERVER: " + JSON.stringify(theirPrices[x]));
                    //console.log(pullContext(theirs[bestMatch]["vs_price"], x));
                    var ctxt = pullContext(theirs[bestMatch]["vs_price"], x);
                    if(ctxt != null) {
                        serverPriceHolder.append(JSON.parse(ctxt)[0] + ": " + theirPrices[x] + "<br />");
                        shouldAppend = true;
                    }
                    
                    //$("<div>" + theirPrices[x] + "</div>");
                }
            }
            if(shouldAppend) {
                serverPriceHolder.insertAfter(anchorElemTop);
                serverPriceHolder.wrap("<p></p>");
            }
            //console.log("PRICE MATCHES FOR " + i);
            //console.log(priceMatches);      
        }
        else {
            //console.log("WE COULD NOT FIND A MATCH FOR OUR " + JSON.stringify(ours[i]));
            //console.log("WE COULD NOT FIND A MATCH FOR OUR " + i);
            var ourElems = $(".vs_price", "[vsid=" + ours[i].vsid + "]");
            for(var x = 0; x < ourElems.length; x++) {
                var wrapper = $("<div class='clientOnly'></div>");
                $(ourElems[x]).wrap(wrapper);
            }
        }
    }

    //console.log("we live another day");
    
    var toClone = [];
    for(var i = 0; i < theirs.length; i++) {
        if(typeof theirs[i]["used"] == "undefined") {
            //console.log("THIS IS ONLY ON THE SERVER " + JSON.stringify(theirs[i]));
            toClone.push(theirs[i]);
        }
    }
    
    //console.log("many other days");
    
    addClonedElements(ours, toClone, labels);
    $(".serverMore").attr("title", "Your price is lower than the server's.");
    $(".serverLess").attr("title", "Your price is higher than the server's.");
    $(".serverSame").attr("title", "Your price is the same as the server's.");
    $(".clientOnly").attr("title", "Only you saw this price.  The server did not.");
    $(".serverPriceHolder").attr("title", "Price variants in this box were visible only to the server.");
    
    disableInterface();
    
    return diffNum;
}

function resolveTopParent(elem) {
    var curr = $(elem);
    var origText = sTrim($(elem).text().toLowerCase());
    
    while(curr.parent().length > 0 && sTrim(curr.parent().text().toLowerCase()) == origText) {
        curr = curr.parent();
    }
    
    return curr[0];
}

function sTrim(str) {
    return str.replace(/\s\s+/g, ' ').trim();
}

function findBestMatch(ours, theirs, index, labels) {
    //console.log("The best match search for " + index + " has begun in earnest.");
    var mKeys = []; // mandatory keys
    for(var i = 0; i < labels.length; i++) {
        var key = Object.keys(labels[i])[0];
        if(key != "price" && key != "vs_price") {
            mKeys.push(Object.keys(labels[i])[0]);
        }
    }
    //console.log(keys);
    //console.log("Not only that, but the search for " + index + " is actually succeeding.");
    var ourKeys = _.intersection(mKeys, Object.keys(ours[index]));
    ourKeys = ourKeys.sort();
    
    var matches = [];
    for(var i = 0; i < theirs.length; i++) {
        // do they have the same set of mandatory keys?
        var theirKeys = _.intersection(Object.keys(theirs[i]), keys);
        theirKeys = theirKeys.sort();
        var keysGood = true;
        if(theirKeys.length == ourKeys.length) {
            for(var x = 0; x < ourKeys.length; x++) {
                if(theirKeys[x] != ourKeys[x]) {
                    keysGood = false;
                    break;
                }
            }
        }
        var keys = mKeys;
        
        var allKeysMatch = keysGood;
        if(typeof theirs[i]["used"] == "undefined" && allKeysMatch) 
        {
            //console.log("ALL KEYS MATCH FOR " + index + "... so far");
            for(var j = 0; j < keys.length; j++) {
                var theirData = theirs[i][keys[j]];
                var ourData = ours[index][keys[j]]; 
                
                if(typeof ourData == "undefined") {
                    allKeysMatch = false;
                    break;
                }
                
                // USEFUL LINE
                //console.log(JSON.stringify(theirData) + "\n" + JSON.stringify(ourData) + "\n");
                for(var type in theirData) {
                    if(typeof ourData[type] == "undefined") {
                        allKeysMatch = false;
                        break;
                    }
                    
                    if(theirData[type].length == ourData[type].length) {
                        //console.log(JSON.stringify(theirData[type]) + "\n" + JSON.stringify(ourData[type]) + "\n");
                        var matchNum = 0;
                        //var usedIndeces = new Set();
                        var usedIndeces = {};
                        for(var x = 0; x < ourData[type].length; x++) {
                            for(var y = 0; y < theirData[type].length; y++) {
                                if((ourData[type][x] == theirData[type][y] && !(y in usedIndeces)) ||
                                    sameStart(ourData[type][x], theirData[type][y])) {
                                    matchNum++;
                                    //usedIndeces.add(y);
                                    usedIndeces[y] = true;
                                }
                            }
                        }
                        if(matchNum != ourData[type].length) {
                            allKeysMatch = false;
                            break;
                        }
                    }
                    else {
                        allkeysMatch = false;
                        break;
                    }
                }
                if(allKeysMatch == false) {
                    break;
                }
            }
        }
        else {
            allKeysMatch = false;
        }
        
        if(allKeysMatch) {
            matches.push(i);
        }
    }
    //console.log(matches);

    var minPenalty = 50000000000;
    var minIndex = -1;

    // let's find the best match
    for(var i = 0; i < matches.length; i++) { 
        var penalty = 0;
        penalty += Math.abs(index - matches[i]);
        
        // we don't want to look at the context labels yet, so we exclude them to avoid breaking things
        var ourPrices = copyExclude(ours[index].vs_price, ["ctxt"]);
        var theirPrices = copyExclude(theirs[matches[i]].vs_price, ["ctxt"]);
        
        //alert(JSON.stringify(theirPrices));
        for(var type in ourPrices) {
            penalty += Math.abs(ourPrices[type].length - theirPrices[type].length);
            var shorterArr = ourPrices[type];
            var longerArr = theirPrices[type];
            if(theirPrices[type].length < ourPrices[type].length) {
                shorterArr = theirPrices[type];
                longerArr = ourPrices[type];
            }
            for(var j = 0; j < shorterArr.length; j++) {
                penalty += Math.abs(shorterArr[j].length - longerArr[j].length);
            }
            //alert(type + ", " + penalty);
        }
        
        for(var type in theirPrices) {
            for(var x = 0; x < theirPrices[type].length; x++) {
                var theirPrice = new Price(theirPrices[type][x]);
                var minDiff = 50000000000;

                for(var y = 0; y < ourPrices[type].length; y++) {
                    var ourPrice = new Price(ourPrices[type][y]);
                    var diff = Math.abs(theirPrice.dollarValue() - ourPrice.dollarValue());
                    if(diff < minDiff) {
                        minDiff = diff;
                    }
                }
                penalty += minDiff;
            }

            if(penalty < minPenalty) {
                minPenalty = penalty;
                minIndex = matches[i];
            }
        }
    }
    //console.log("SELECTED: " + minIndex);
    //alert(minIndex);
    return minIndex;
}

function sameStart(longStr, shortStr) {
    if(longStr.length < shortStr.length) {
        var temp = longStr;
        longStr = shortStr;
        shortStr = temp;
    }
    
    var matchingChars = 0;
    for(var i = 0; i < shortStr.length; i++) {
        if(shortStr[i] == longStr[i]) {
            matchingChars++;
        }
        else {
            break;
        }
    }
    
    if(matchingChars > 30 || matchingChars > 0.7 * longStr) {
        return true;
    }
}

function copyExclude(obj, exc) {
    var newObj = {};
    for(var type in obj) {
        if(exc.indexOf(type) < 0) {
            newObj[type] = obj[type];
        }
    }
    
    return newObj;
}

function addClonedElements(ours, toClone, labels) {
    var allLabels = labels["mandatory-labels"].concat(labels["data-labels"]);
    //var labelSet = new Set();
    var labelSet = {};
    var labelLookup = {};
    
    //console.log("alive on 369");
    for(var i = 0; i < allLabels.length; i++) {
        //labelSet.add(Object.keys(allLabels[i])[0]);
        labelSet[Object.keys(allLabels[i])[0]] = true;
        labelLookup[Object.keys(allLabels[i])[0]] = allLabels[i][Object.keys(allLabels[i])[0]];
    }
    
    var lastContainer = $(getContainer(ours[ours.length - 1]["vsid"]));
    
    //console.log("alive on 377");
    //console.log(toClone.length);
    for(var i = 0; i < toClone.length; i++) {
        var cloneID = toClone[i]["vsid"];
        
        var donor = cloneElement(toClone[i], ours, labelSet);
        //console.log(donor);
        
        var clone = $(getContainer(donor["vsid"])).clone();
        clone.attr("vsid", cloneID);
        //clone.find(".vsid").attr("vsid", cloneID);

        clone.css("opacity", "0.5");
        
        //console.log("alive 391");
        var toHide = clone.find("*").filter(function() {
            if(typeof $(this).attr("vsid") != "undefined") {
                return false;
            }
            var checkArr = $(this).find("*");
            for(var i = 0; i < checkArr.length; i++) {
                if(typeof $(checkArr[i]).attr("vsid") != "undefined") {
                    return false;
                }
            }
            return true;
        });
        toHide.css("display", "none");
        clone.insertAfter(lastContainer);
        ////console.log(clone);
        
        var vs_elems = findElement([{"class-":"+vs_"}], clone, true);
        $(vs_elems).attr("vsid", cloneID);
        
        var keys = Object.keys(toClone[i]);
        //console.log("keys are " + JSON.stringify(keys));
        for(var x = 0; x < keys.length; x++) {
            if(keys[x] in labelSet) {
                //console.log(keys[x]);
                var keyToUse = keys[x];
                var op = "=";
                if(keys[x].indexOf("vs_price::") == 0) {
                    //console.log("PHEW PHEW HERE GOES");
                    op = "+";
                    //console.log("THE NAME IS: ");
                    keyToUse = JSON.parse(keys[x].substr(10)).name;
                    //console.log(keyToUse)
                }
                var matches = findElement([{"class-":(op + keyToUse)}], vs_elems);
                //console.log("THE MATCHES ARE");
                //console.log(matches);
                
                var infoArr = copyExclude(toClone[i][keys[x]], ["ctxt"]);
                //console.log(infoArr);
                //alert(JSON.stringify(infoArr));
                for(var m = 0; m < matches.length; m++) {
                    var par = $(matches[m]).parent();
                    if(par.length > 0 && par.hasClass("clientOnly")) {
                        $(matches[m]).unwrap();
                    }
                    for(var type in infoArr) {
                        if(m < infoArr[type].length) 
                        {
                            if(type == "text") {
                                $(matches[m]).text(infoArr[type][m]);
                            }
                            else {
                                $(matches[m]).attr(type, infoArr[type][m]);
                            }
                        }
                        else {
                            if(type == "text") {
                                $(matches[m]).text("");
                            }
                            else {
                                $(matches[m]).removeAttr(type);
                            }
                        }
                        /*else 
                        {
                            //console.log("hiding");
                            //console.log(matches[m]);
                            //alert("Notice: Some server prices not displayed");
                            $(matches[m]).hide();
                        }*/
                    }
                }
            }
        }
    }
    //console.log("alive on 437");
}

function cloneElement(elem, donors, keySet) {
    var bestDonorIndex = -1;
    var minPenalty = 50000000;
    
    var elemKeys = _.intersection(Object.keys(elem), /*[...keySet]*/Object.keys(keySet));
    
    var matches = [];
    //console.log("alive on 450");
    for(var i = 0; i < donors.length; i++) {
        //console.log("alive on 452");
        var penalty = 0;
        
        var donorKeys = _.intersection(Object.keys(donors[i]), /*[...keySet]*/Object.keys(keySet));
        //alert(JSON.stringify(donorKeys));
        //console.log("alive on 457");
        //console.log(elemKeys);
        for(var k = 0; k < elemKeys.length; k++) {
            var indexInDonor = donorKeys.indexOf(elemKeys[k]);
            if(indexInDonor >= 0) {
                for(type in elem[elemKeys[k]]) {
                    if(type != "ctxt") {
                        // do the numbers of each element match? TODO: DEBUG THIS!!!!
                        penalty += Math.abs(elem[elemKeys[k]][type].length - donors[i][donorKeys[indexInDonor]][type].length);
                    }
                }
            }
            else { // this key is totally absent
                penalty += 2;
            }
        }
        //console.log("alive on 470");
        
        if(penalty < minPenalty) {
            bestDonorIndex = i;
            minPenalty = penalty;
        }
    }
    
    //console.log("The best donor lives at index " + bestDonorIndex);
    return donors[bestDonorIndex];
}

var surveyTimeout = null;
if(typeof chrome.runtime.onMessage != "undefined") { // ie not debug mode
    chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        vsSearchStarted = false;
        if(typeof window.merge_called == "undefined" && request.hasOwnProperty("merge")) {
            if(request.status == "success") {
                $("#scrape_status").text("merging results");
                window.merge_called = true;
                diffNum = merge(request.ours, request.theirs, request.labels);
                var takeSnap = false;
                setTimeout(function() {
                    if(diffNum >= 2) {
                        takeSnap = confirm("Notable price personalization was detected on this page.  Can we take a screenshot?");
                        if(takeSnap) {
                            snap(request.instance_id, function() {
                                surveyTimeout = setTimeout(surveyPopup, 60000); 
                            });   
                        }
                    }
                    if(!takeSnap) {
                        surveyTimeout = setTimeout(surveyPopup, 60000); // wait one minute before showing the popup   
                    }
                }, 500); // give interface a chance to hide itself
            }
            else if(request.status == "fail") {
                $("#scrape_status").text(request.msg);
                setTimeout(disableInterface, 2000);
            }
        }
    });
}