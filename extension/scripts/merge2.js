function Price(str) {
    this.str = str;
}

Price.prototype.resolvePrice = function() {
    var reg = new RegExp("[^0123456789.]");
    var rawArr = this.str.split(reg);
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
* useful for matching participants across linked experiments
*/
function randomString(length)
{
	var str = "";
	for(var i = 0; i < length; i++)
	{
		var charCode = 0;
		if(Math.random() < (26 / 36))
			charCode = Math.floor(Math.random() * 26) + 97;
		else
			charCode = Math.floor(Math.random() * 10) + 48;
			
		str += String.fromCharCode(charCode);
	}
	
	return str;
}

function merge(ours, theirs, labels) {
    for(var i = 0; i < ours.length; i++) {
        var bestMatch = findBestMatch(ours, theirs, i, labels["mandatory-labels"]);
        if(bestMatch >= 0) {
            theirs[bestMatch]["used"] = true;
            console.log("BEST MATCH FOR OUR " + JSON.stringify(ours[i]) + " IS THEIR " + JSON.stringify(theirs[bestMatch]));
            //alert(JSON.stringify(ours[i].vs_price) + "\n" + JSON.stringify(theirs[bestMatch].vs_price));
            
            var ourElems = $(".vs_price", "[vsid=" + ours[i].vsid + "]");
            
            for(var type in ours[i]["vs_price"]) {
                if(theirs[bestMatch]["vs_price"][type].length > ourElems.length) {
                    alert("Some price data could not be displayed");
                }
                
                var loopUpTo = Math.min(theirs[bestMatch]["vs_price"][type].length, ourElems.length);
                for(var x = 0; x < loopUpTo; x++) {
                    if(type == "text") {
                        $(ourElems[x]).append("<br /><div class='serverPrice'>" + theirs[bestMatch]["vs_price"][type][x] + "</div>");
                    }
                    else {
                        // TODO: not sure how we want to handle non-text price elements; we probably shouldn't allow them
                    }
                }
            }
        }
        else {
            console.log("WE COULD NOT FIND A MATCH FOR OUR " + JSON.stringify(ours[i]));
        }
    }
    
    var toClone = [];
    for(var i = 0; i < theirs.length; i++) {
        if(typeof theirs[i]["used"] == "undefined") {
            console.log("THIS IS ONLY ON THE SERVER " + JSON.stringify(theirs[i]));
            toClone.push(theirs[i]);
        }
    }
    
    addClonedElements(ours, toClone, labels);
}

function findBestMatch(ours, theirs, index, labels) {
    var keys = [];
    for(var i = 0; i < labels.length; i++) {
        var key = Object.keys(labels[i])[0];
        if(key != "price" && key != "vs_price") {
            keys.push(Object.keys(labels[i])[0]);
        }
    }
    
    var matches = [];
    for(var i = 0; i < theirs.length; i++) {
        var allKeysMatch = true;
        if(typeof theirs[i]["used"] == "undefined") 
        {
            for(var j = 0; j < keys.length; j++) {
                //console.log(JSON.stringify(theirs[index]));
                var theirData = theirs[i][keys[j]];
                var ourData = ours[index][keys[j]];  
                
                for(var type in theirData) {
                    if(theirData[type].length == ourData[type].length) {
                        var matchNum = 0;
                        for(var x = 0; x < ourData[type].length; x++) {
                            for(var y = 0; y < theirData[type].length; y++) {
                                if(ourData[type][x] == theirData[type][y]) {
                                    matchNum++;
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

    var minPenalty = 50000000000;
    var minIndex = -1;

    // let's find the best match
    for(var i = 0; i < matches.length; i++) { 
        var penalty = 0;
        penalty += Math.abs(index - matches[i]);
        
        var ourPrices = ours[index].vs_price;
        var theirPrices = theirs[matches[i]].vs_price;
        
        //alert(JSON.stringify(theirPrices));
        for(var type in ourPrices) {
            penalty += Math.abs(ourPrices[type].length - theirPrices[type].length);
            //alert(type + ", " + penalty);
        }
        
        for(var type in theirPrices) {
            for(var x = 0; x < theirPrices[type].length; x++) {
                var theirPrice = new Price(theirPrices[type][x]);
                var minDiff = 50000000000;

                for(var y = 0; y < ourPrices[type].length; y++) {
                    var ourPrice = new Price(ourPrices[type][x]);
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
    
    //alert(minIndex);
    return minIndex;
}

function addClonedElements(ours, toClone, labels) {
    var allLabels = labels["mandatory-labels"].concat(labels["data-labels"]);
    var labelSet = new Set();
    var labelLookup = {};
    
    for(var i = 0; i < allLabels.length; i++) {
        labelSet.add(Object.keys(allLabels[i])[0]);
        labelLookup[Object.keys(allLabels[i])[0]] = allLabels[i][Object.keys(allLabels[i])[0]];
    }
    
    var lastContainer = $(getContainer(ours[ours.length - 1]["vsid"]));
    
    for(var i = 0; i < toClone.length; i++) {
        var cloneID = toClone[i]["vsid"];
        
        var donor = cloneElement(toClone[i], ours, labelSet);
        console.log(donor);
        
        var clone = $(getContainer(donor["vsid"])).clone();
        clone.attr("vsid", cloneID);
        //clone.find(".vsid").attr("vsid", cloneID);

        clone.css("opacity", "0.5");

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
        console.log(clone);
        
        var vs_elems = findElement([{"class-":"+vs_"}], clone, true);
        $(vs_elems).attr("vsid", cloneID);
        
        var keys = Object.keys(toClone[i]);
        for(var x = 0; x < keys.length; x++) {
            if(labelSet.has(keys[x])) {
                //alert(keys[x]);
                var matches = findElement([{"class-":"=" + keys[x]}], vs_elems);
                //alert(matches.length);
                
                var infoArr = toClone[i][keys[x]];
                //alert(JSON.stringify(infoArr));
                for(var m = 0; m < matches.length; m++) {
                    for(var type in infoArr) {
                        if(m < infoArr[type].length) {
                            if(type == "text") {
                                $(matches[m]).text(infoArr[type][m]);
                            }
                            else {
                                $(matches[m]).attr("type", infoArr[type][m]);
                            }
                        }
                        else {
                            alert("Notice: Some server prices not displayed");
                            $(matches[m]).hide();
                        }
                    }
                }
            }
        }
    }
}

function cloneElement(elem, donors, keySet) {
    var bestDonorIndex = -1;
    var minPenalty = 50000000;
    
    var elemKeys = _.intersection(Object.keys(elem), [...keySet]);
    
    var matches = [];
    for(var i = 0; i < donors.length; i++) {
        var penalty = 0;
        
        var donorKeys = _.intersection(Object.keys(donors[i]), [...keySet]);
        //alert(JSON.stringify(donorKeys));
        for(var k = 0; k < elemKeys.length; k++) {
            var indexInDonor = donorKeys.indexOf(elemKeys[k]);
            if(indexInDonor >= 0) {
                for(type in elem[elemKeys[k]]) {
                    // do the numbers of each element match?
                    penalty += Math.abs(elem[elemKeys[k]][type].length - donors[i][donorKeys[indexInDonor]][type].length);
                }
            }
            else { // this key is totally absent
                penalty += 2;
            }
        }
        
        if(penalty < minPenalty) {
            bestDonorIndex = i;
            minPenalty = penalty;
        }
    }
    
    console.log("The best donor lives at index " + bestDonorIndex);
    return donors[bestDonorIndex];
}