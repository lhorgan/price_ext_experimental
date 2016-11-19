function findElement(/*elem*/desc, matchArr, deep) {
    var matches = [];
    var searchDeepest = false;
    if(typeof matchArr != "undefined") {
        if(typeof deep != "undefined" && deep == true) {
            matches = $(matchArr).find("*");
            searchDeepest = true;
        }
        else {
            matches = matchArr;
        }
    }
    
    var searchForBase = false;
    
    for(var i = 0; i < desc.length; i++) {
        var elem = desc[i];
        var e = Object.keys(elem)[0];
        var dashInd = e.indexOf("-")
        var prefix = e.substr(0, dashInd);
        
        if(prefix == "len") {            
            len = elem[e];
            if(matches.length == 0) {
                // searchForBase = true; // still only search for base words
                matches = $("*").filter(function() {
                    return $(this).text().length < len;
                });
            }
            else {
                matches = $(matches).filter(function() {
                    return $(this).text().length < len; 
                });
            }
        }
        if(prefix == "id") {
            // searchForBase = false;
            var s_id = elem[e].substr(1);
            var op = elem[e][0];
            
            var match = null;
            if(op == "=") {
                match = $("#" + s_id);
            }
            else if (op == "+") {
                match = $("*[id*='" + s_id + "']");
            }
            if(matches.length == 0) {
                matches = match;
            }
            else {
                matches = _.intersection(matches, match);
            }
        }
        else if(prefix == "class") {
            var s_class = elem[e].substr(1);
            var op = elem[e][0];
            
            var match = null;
            if(op == "=") {
                match = $("." + s_class);
            }
            else if (op == "+") {
                match = $("*[class*='" + s_class + "']");
            }
            //console.log(match);
            
            if(matches.length == 0) {
                matches = match;
            }
            else {
                var combined = _.intersection(matches, match);
                matches = _.intersection(matches, match);
            }
        }
        else if(prefix == "prop") {
            // searchForBase = false;
            var prop = e.substr(dashInd + 1);
            var propVal = elem[e].substr(1);
            var op = elem[e][0];

            var match = $("[" + prop + "]");
            var filteredMatch = [];
            for(var i = 0; i < match.length; i++) {
                var curr = $(match[i]);
                if(curr.attr(prop) == propVal) {
                    filteredMatch.push(curr[0]);
                }
                else if(curr.attr(prop).indexOf(propVal) >= 0 && op == "+") {
                    filteredMatch.push(curr[0]);
                }
            }
            if(matches.length == 0) {
                matches = filteredMatch;
            }
            else {
                matches = _.intersection(matches, filteredMatch);
            }
        }
        else if(prefix == "contents") {
            var txt = elem[e].substr(1);
            var len = parseInt(e.substr(dashInd + 1));
            if(isNaN(len) || len < 0) {
                len = null;
            }
            
            var op = elem[e][0];
            var opGroup = "";
            if(elem[e][0] == "[") {
                op = elem[e][1];
                var opGroup = elem[e].substring(2, elem[e].indexOf("]"));
                txt = applyOpGroup(elem[e].substr(elem[e].indexOf("]") + 1), opGroup);
            }
            
            if(matches.length == 0/*|| searchForBase*/) {
                matches = findText(txt, op, opGroup, len);
            }
            else if(searchDeepest == true) {
                matches = findText(txt, op, opGroup, len, matches);
            }
            else {
                var match = [];
                for(var x = 0; x < matches.length; x++) {
                    var currLen = $(matches[x]).text().length;
                    if(len == null || (len != null && currLen < len)) {
                        //console.log("still alive");
                        var text = applyOpGroup($(matches[x]).text(), opGroup);
                        if(text == txt) {
                            match.push(matches[x]);
                        }
                        if(text.indexOf(txt) >= 0 && op == "+") { 
                            //console.log("neato");
                            match.push(matches[x]);
                        }
                        else if(op == "^") {
                            var reg = new RegExp(txt);
                            if(reg.test(text)) {
                                match.push(matches[x]);
                            }
                        }
                    }
                }
                //matches = match;
                matches = _.intersection(matches, match);
            }
        }
        else if(prefix == "tag") {
            // searchForBase = false;
            tagType = elem[e].substr(1);
            match = $(tagType);
            if(matches.length == 0) {
                matches = match;
            }
            else {
                matches = _.intersection(matches, match);
            }
        }
        else if(prefix == "parent") { // I want things whose parent is x
            // searchForBase = false;
            parentElem = $(elem[e]);
            childrenOfParent = parentElem.children();
            if(matches.length == 0) {
                matches = childrenOfParent;
            }
            else {
                matches = _.intersection(matches, childrenOfParent);
            }
        }
        else if(prefix == "child") { // I want things whose child is blah
            // searchForBase = false;
            childElem = $(elem[e]);
            parentsOfChild = childElem.parents().not("html, head, script, style");
            if(matches.length == 0) {
                matches = parentsOfChild;
            }
            else {
                matches = _.intersection(matches, parentsOfChild);
            }
        }
        else if(prefix == "sibling") { // I want things who are directly next to x
            // searchForBase = false;
            sibElem = $(elem[e]);
            siblings = sibElem.siblings();
            if(matches.length == 0) {
                matches = siblings;
            }
            else {
                matches = _.intersection(matches, siblings);
            }
            
        }
        else if(prefix == "nav") {
            //console.log("nav");
            if(matches.length > 0) {
                //console.log("hooray");
                //var seq = e.substr(dashInd + 1).split(",");
                var seq = elem[e].split(",");
                for(var i = 0; i < seq.length; i++) {
                    if(seq[i] == "parent") {
                        matches = $(matches).parent();
                    }
                    else if(seq[i] == "prev") {
                        matches = $(matches).prev();
                    }
                    else if(seq[i] == "next") {
                        matches = $(matches).next();
                    }
                    else if(seq[i] == "child") {
                        var children = [];
                        for(var x = 0; x < matches.length; x++) {
                            var currChildren = $(matches[x]).children();
                            if(currChildren.length > 0) {
                                currChildren = currChildren[0];
                            }
                            children.push(currChildren);
                        }
                        matches = children;
                    }
                }
            }
        }
        else if(prefix == "left" || prefix == "right" || prefix == "above" || prefix == "below") {
            // searchForBase = false;
            var ref = elem[e];
            var tempMatches = $(matches).not("html, head, script, style");
            if(matches.length == 0) {
                tempMatches = $("*");
            }
            
            tempMatches = tempMatches.filter(function () { 
                res = isDirection(prefix, this, ref);
                return res;
            });
            
            if(matches.length == 0) {
                matches = tempMatches;
            }
            else {
                matches = _.intersection(matches, tempMatches);
            }
        }
        else if(prefix == "distance") {
            // searchForBase = false;
            var refs = elem[e];
            if(matches.length == 0) {
                matches = $("*");
            }
            var bounds = jQuery.parseJSON(e.substr(dashInd + 1));
            var minDist = bounds[0];
            var maxDist = bounds[1];
            var minAngle = bounds[2];
            var maxAngle = bounds[3];
            
            var subMatches = [];
            for(var i = 0; i < refs.length; i++) {
                var ref = refs[i];
                //console.log($(ref).text());
                var matchRef = $(matches).filter(function() {
                    var res = distance(ref, this);
                    var dist = res[0];
                    var angle = res[1];
                    
                    if(this.ref != ref) {
                        if(dist >= minDist && dist <= maxDist &&
                           angle >= minAngle && angle <= maxAngle) {
                            return true;
                        }
                    }
                    return false;
                });
                subMatches = _.union(subMatches, _.flatten(matchRef));        
            }
            
            return _.intersection(subMatches, matches);
        }
        
        searchDeepest = false; // this should never be true after the first iteration
        // we've gotten rid of everything; break
        if(matches.length == 0) {
            //console.log("leaving loop");
            break;
        }
    }
    gMatch = matches;
    return matches;
}

function applyOpGroup(txt, opGroup) {
    opGroup = opGroup.toLowerCase();
    if(opGroup.indexOf("l") >= 0) {
        txt = txt.toLowerCase();
    }
    if(opGroup.indexOf("t") >= 0) {
        txt = txt.trim();
    }
    
    return txt;
}

function distance(elemA, elemB) {
    //console.log("OKAY AND WE'RE IN HERE");
    var posElemA = $(elemA).offset();
    var posElemB = $(elemB).offset();
    //console.log(posElemA.top + ", " + posElemA.top);
    
    posElemA["bottom"] = posElemA.top + $(elemA).height();
    posElemA["right"] = posElemA.left + $(elemA).width();
    posElemA["x"] = (posElemA.left + posElemA.right) / 2;
    posElemA["y"] = (posElemA.top + posElemA.bottom) / 2;
    
    posElemB["bottom"] = posElemB.top + $(elemB).height();
    posElemB["right"] = posElemB.left + $(elemB).width();
    posElemB["x"] = (posElemB.left + posElemB.right) / 2;
    posElemB["y"] = (posElemB.top + posElemB.bottom) / 2;
    
    var distX = posElemA.x - posElemB.x;
    var distY = posElemA.y - posElemB.y;
    
    var dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    var angle = Math.atan(distY, distX) * (180 / Math.PI)
    
    return [dist, angle];
}

// is elemA DIR elemB
function isDirection(dir, elemA, elemB) {
    var posElemA = $(elemA).offset();
    var posElemB = $(elemB).offset();
    posElemA["bottom"] = posElemA.top + $(elemA).height();
    posElemA["right"] = posElemA.left + $(elemA).width();
    posElemB["bottom"] = posElemB.top + $(elemB).height();
    posElemB["right"] = posElemB.left + $(elemB).width();
     
    var left = false;
    var right = false;
    var above = false;
    var below = false;
    
    var directions = {"left": false, "right": false, "above": false, "below": false};
    
    if(posElemA.right <= posElemB.left) {
        directions["left"] = true;
    }
    if(posElemA.left >= posElemB.right) {
        directions["right"] = true;
    }
    if(posElemA.bottom <= posElemB.top) {
        directions["above"] = true;
    }
    if(posElemA.top >= posElemB.bottom) {
        directions["below"] = true;
    }
    
    return directions[dir];
}

$.fn.ignore = function(sel) {
    return this.clone().find(sel||">*").remove().end();
};

function findText(txt, op, opGroup, len, container) {
    //parents = $("*:contains('" + txt + "')").not("script");
    txt = applyOpGroup(txt, opGroup);
    
    var matches = null;
    if(typeof container == "undefined") {
        matches = $("*").not("script");
    }
    else {
        matches = container;
    }
    
    var parents = [];
    for(var i = 0; i < matches.length; i++) {
        if(len == null || (len != null && $(matches[i]).text().length < len)) {
            var text = applyOpGroup($(matches[i]).text(), opGroup);
            if(op == "^") {
                //alert("CHECKING FOR REGEX");
                var reg = new RegExp(txt);
                if(reg.test(text)) {
                    //console.log("GOT ONE");
                    parents.push(matches[i]);
                }
            }
            else {
                if(text.indexOf(txt) >= 0) {
                    parents.push(matches[i]);
                }
            }
        }
    }
    parents = $(parents);
    
    var match = []
    parents.each(function() { 
        if(isBaseParent(txt, this, op, opGroup)) {
            if(op == "+" || op == "^") {
                match.push(this);
            }
            else if(applyOpGroup($(this).text(), opGroup) == txt && op == "=") {
                match.push(this);
            }
        }
    });

    return match;
}

function isBaseParent(txt, ctx, op, opGroup) {
    var node = $(ctx).clone();
    var contents = applyOpGroup(node.ignore("*").text(), opGroup);
    if(op == "^") {
        var reg = new RegExp(txt);
        if(reg.test(applyOpGroup(contents, opGroup))) {
            return true;
        }
    }
    else if(contents.indexOf(txt) >= 0) {
        return true;
    }
    return false;
}

var uniqueID = (function() {
   var id = 0; // This is the private persistent value
   return function() { return id++; };  // Return and increment
})(); // Invoke the outer function after defining it.

function findSuperStructure(elems) {
    var superStructure = [];
    
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
                
                var uid = uniqueID();  
                $(elems[i]).attr("price-id", uid);
                $(elems[i]).addClass("vs_price");
                $(prevElem[0]).attr("price-id", uid);
                $(prevElem[0]).addClass("vs_container");
                
                break;
            }
            prevElem = currElem;
            currElem = $(currElem).parent();
        }
    }
    
    return superStructure;
}

function tagDescriptors(superStruct, descArr) {
    domArr = [];
    for(var i = 0; i < superStruct.length; i++) {
        var priceID = $(superStruct[i]).attr("price-id");
        
        var doms = {"price": $(".vs_price", "[price-id=" + priceID + "]"),
                   "container": $(".vs_container", "[price-id=" + priceID + "]")}; // always have access to price and container
        for(var j = 0; j < descArr.length; j++) {
            var name = descArr[j].name;
            var desc = [];//descArr[j].desc;
            //var descCopy = Object.assign(desc);//[];
            //var descCopy = jQuery.extend(true, {}, descArr[j].desc);
            
            for(var x = 0; x < descArr[j].desc.length; x++) {
                desc.push(jQuery.extend(true, {}, descArr[j].desc[x]));
            }
            
            for(var x = 0; x < desc.length; x++) {
                var key = Object.keys(desc[x])[0];
                if(typeof desc[x][key] == "object" && "ref" in desc[x][key]) {
                    var ref = desc[x][key].ref;
                    var ref = desc[x][key].ref;
                    var backup = desc[x][key];
                    desc[x][key] = doms[ref];
                }
            }
            
            var elem = [];
            if("matches" in descArr[j]) {
                //alert("SWEET");
                elem = findElement(desc, doms[descArr[j].matches]);
                //alert(elem.length + ": " + descArr[j].matches);
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

function eachContains(elem, arr) {
    for(var i = 0; i < arr.length; arr++) {
        if($.contains($(elem)[0], $(arr[i])[0])) {
            return true;
        }
    }
    return false;
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

function collectPriceData(labels) {
    var prices = $(".vs_price");
    var allLabels = labels.mandatory_labels.concat(labels.data_labels);
    
    collective = [];
    
    for(var i = 0; i < prices.length; i++) {
        var price_id = $(prices[i]).attr("price-id");
        var matches = findElement([{"prop-price-id":"=" + price_id}]);
        
        var obj = {};
        obj["price"] = $(prices[i]).text();
        obj["price_id"] = price_id;
            
        var foundAll = true;
        for(var l = 0; l < allLabels.length; l++) {
            var label = "vs_" + allLabels[l]; 
            var info = $("." + label, matches);
            if(info.length == 1) {
                if(info.prop("tagName") == "IMG") {
                    obj[allLabels[l]] = info.attr("src");
                }
                else {
                    obj[allLabels[l]] = info.text();
                }
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