function findElement(desc, matchArr, deep) {
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
            var op = elem[e][0]; 
            var len = elem[e].substr(1);
            //alert(op);
            if(matches.length == 0) {
                // searchForBase = true; // still only search for base words
                matches = $("*").filter(function() {
                    if(op == "=") {
                        return $(this).text().length < len;
                    }
                    else if(op == ">") {
                        return $(this).text().length > len;
                    }
                    else if(op == "<") {
                        return $(this).text().length < len;
                    }
                    return false;
                });
            }
            else {
                matches = $(matches).filter(function() {
                    if(op == "=") {
                        return $(this).text().length < len;
                    }
                    else if(op == ">") {
                        //console.log("hmmmm >>");
                        return $(this).text().length > len;
                    }
                    else if(op == "<") {
                        return $(this).text().length < len;
                    }
                    return false;
                });
            }
        }
        else if(prefix == "visibility") {
            var visibility = elem[e];
            var match = [];
            
            if(matches.length == 0) {
                matches = $("*:" + visibility);
            }
            else {
                for(var x = 0; x < matches.length; x++) {
                    if($(matches[x]).is(":" + visibility)) {
                        match.push(matches[x]);
                    }
                }
                matches = _.intersection(matches, match);
            }
        }
        else if(prefix == "deepest") {
            if(elem[e] == true) {
                var newMatches = [];
                for(var x = 0; x < matches.length; x++) {
                    var child = $(matches[x]).find("*");
                    var hasChildInMatches = false;
                    for(var y = 0; y < child.length; y++) {
                        if(matches.indexOf(child[y]) >= 0) {
                            hasChildInMatches = true;
                            break;
                        }
                    }
                    if(!hasChildInMatches) {
                        newMatches.push(matches[x]);
                    }
                }
                matches = newMatches;
            }
        }
        if(prefix == "id") {
            // searchForBase = false;
            var s_id = elem[e].substr(1);
            var op = elem[e][0];
            
            var match = null;
            if(elem[e][0] == "[") {
                op = elem[e][1];
                var opGroup = elem[e].substring(2, elem[e].indexOf("]"));
                s_id = applyOpGroup(elem[e].substr(elem[e].indexOf("]") + 1), opGroup);
                match = $("*").filter(function() {
                    var currID = $(this).attr("id");
                    if(typeof currID != "undefined") {
                        if(op == "+") { 
                            return applyOpGroup(currID, opGroup).indexOf(s_id) >= 0;
                        }
                        else if(op == "=") {
                            return applyOpGroup(currID, opGroup) == s_id;
                        }
                    }
                    return false;
                });
            }
            else if(op == "=") {
                match = $("#" + s_id);
            }
            else if (op == "+") {
                match = $("*[id*='" + s_id + "']");
            }
            if(matches.length == 0) {
                matches = normalize(match);
            }
            else {
                matches = _.intersection(matches, normalize(match));
            }
        }
        else if(prefix == "class") {
            var s_class = elem[e].substr(1);
            var op = elem[e][0];
        
            var opGroup = "";
            
            var match = null;
            if(elem[e][0] == "[") {
                op = elem[e][1];
                var opGroup = elem[e].substring(2, elem[e].indexOf("]"));
                s_class = applyOpGroup(elem[e].substr(elem[e].indexOf("]") + 1), opGroup);
                match = $("*").filter(function() {
                    var currClass = $(this).attr("class");
                    if(typeof currClass != "undefined") {
                        if(op == "+") { 
                            return applyOpGroup(currClass, opGroup).indexOf(s_class) >= 0;
                        }
                        else if(op == "=") {
                            return applyOpGroup(currClass, opGroup) == s_class;
                        }
                    }
                    return false;
                });
            }
            else if(op == "=") {
                match = $("." + s_class);
            }
            else if (op == "+") {
                match = $("*[class*='" + s_class + "']");
            }
            //console.log(match);
            
            if(matches.length == 0) {
                matches = normalize(match);
            }
            else {
                //var combined = _.intersection(matches, match);
                matches = _.intersection(matches, normalize(match));
            }
        }
        else if(prefix == "prop") {
            // searchForBase = false;
            var prop = e.substr(dashInd + 1);
            var propVal = elem[e].substr(1);
            var op = elem[e][0];
            
            var match = [];
            var filteredMatch = [];
            
            if(elem[e][0] == "[") {
                op = elem[e][1];
                var opGroup = elem[e].substring(2, elem[e].indexOf("]"));
                propVal = applyOpGroup(elem[e].substr(elem[e].indexOf("]") + 1), opGroup);
                filteredMatch = $("*").filter(function() {
                    var currProp = $(this).attr(prop);
                    if(typeof currProp != "undefined") {
                        if(op == "+") { 
                            return applyOpGroup(currProp, opGroup).indexOf(propVal) >= 0;
                        }
                        else if(op == "=") {
                            return applyOpGroup(currProp, opGroup) == propVal;
                        }
                    }
                    return false;
                });
            }
            else
            {
                filteredMatch = $("[" + prop + "]").filter(function() {
                    if(op == "=" && $(this).attr(prop) == propVal) {
                        return true;
                    }
                    else if(op == "+" && $(this).attr(prop).indexOf(propVal) >= 0) {
                        return true;
                    }
                    return false;
                });
            }
            
            if(matches.length == 0) {
                matches = normalize(filteredMatch);
            }
            else {
                matches = _.intersection(matches, normalize(filteredMatch));
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
                //console.log("HEHEHEHE");
                //console.log(matches);
                var match = [];
                for(var x = 0; x < matches.length; x++) {
                    var currLen = $(matches[x]).text().trim().length;
                    if(len == null || (len != null && currLen < len)) {
                        //console.log("OKAY....");
                        var text = applyOpGroup($(matches[x]).text(), opGroup);
                        //console.log(matches[x]);
                        //console.log($(matches[x]).text() + ", " + txt);
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
            var seq = elem[e].split(",");
            
            for(var s = 0; s < seq.length; s++) {
                if(seq[s] == "parent") {
                    //console.log("parent");
                    var parents = [];
                    for(var x = 0; x < matches.length; x++) {
                        //parents.push($(matches[x]).parent()[0]);
                        var currParents = $(matches[x]).parent();
                        if(currParents.length > 0) {
                            parents.push(currParents[0]);    
                        }
                    }
                    matches = parents;
                }
                else if(seq[s] == "prev") {
                    //console.log("prev");
                    var prevs = [];
                    for(var x = 0; x < matches.length; x++) {
                        var currPrevs = $(matches[x]).prev();
                        if(currPrevs.length > 0) {
                            prevs.push(currPrevs[0]);    
                        }
                    }
                    matches = prevs;
                }
                else if(seq[s] == "next") {
                    //console.log("next");
                    var nexts = [];
                    for(var x = 0; x < matches.length; x++) {
                        var currNexts = $(matches[x]).next();
                        if(currNexts.length > 0) {
                            nexts.push(currNexts[0]);    
                        }
                    }
                    matches = nexts;
                }
                else if(seq[s] == "child") {
                    //console.log("child");
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
        else if(prefix == "distance") {
            // searchForBase = false;
            var refs = elem[e];
            var bounds = jQuery.parseJSON(e.substr(dashInd + 1));
            var minDist = bounds[0];
            var maxDist = bounds[1];
            var minAngle = bounds[2];
            var maxAngle = bounds[3];
            var fromX = bounds[4];
            var fromY = bounds[5];
            var toX = bounds[6];
            var toY = bounds[7];
            
            var distInt = typeof bounds[8] == "number" ? bounds[8] : 1;
            var angleInt = typeof bounds[9] == "number" ? bounds[9] : 1;
            
            var degToRad = Math.PI / 180;
            
            if(matches.length == 0) {
                var scrollInterval = window.innerHeight;
                var documentHeight = $(document).height();
                window.scrollTo(0, 0);
                while(window.scrollY + scrollInterval < documentHeight) {
                    for(var i = 0; i < refs.length; i++) {
                        var cr = refs[i].getBoundingClientRect();
                        var refPos = resolvePos(cr, fromX, fromY);
                        var refX = refPos[0];
                        var refY = refPos[1];

                        for(var dist = minDist; dist <= maxDist; dist += distInt) {
                            for(var angle = minAngle; angle <= maxAngle; angle += angleInt) {
                                var newX = Math.floor(refX + dist * Math.cos(angle * degToRad));
                                var newY = Math.floor(refY + dist * Math.sin(angle * degToRad));
                                var elem = document.elementFromPoint(newX, newY);

                                if(elem != null && matches.indexOf(elem) < 0) {
                                    var newPos = resolvePos(elem.getBoundingClientRect(), toX, toY);
                                    var newDist = euclidDist(refX, refY, newPos[0], newPos[1]);
                                    //console.log(newDist + "::" + minDist + "," + maxDist);
                                    //console.log(refX + "," + refY + "::" + newPos[0] + ", " + newPos[1]);
                                    if(newDist >= minDist && newDist <= maxDist) {
                                        matches.push(elem);
                                    }
                                }
                            }
                        }
                    }
                    window.scrollTo(0, window.scrollY + scrollInterval);
                }
                window.scrollTo(0, 0);
            }
            else {
                
            }
            //return _.intersection(subMatches, matches);
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

function resolvePos(clientRect, posX, posY) {
    var xCoord = null;
    var yCoord = null;
    
    if(posX == "center") {
        xCoord = (clientRect.left + clientRect.right) / 2;
    }
    else {
        xCoord = clientRect[posX];
    }
    if(posY == "center") {
        yCoord = (clientRect.top + clientRect.bottom) / 2;
    }
    else {
        yCoord = clientRect[posY];
    }
    
    return [xCoord, yCoord];
}

function normalize(fakeArr) {
    var realArr = [];
    for(var i = 0; i < fakeArr.length; i++) {
        realArr.push(fakeArr[i]);
    }
    return realArr;
}

function applyOpGroup(txt, opGroup) {
    opGroup = opGroup.toLowerCase();
    if(opGroup.indexOf("l") >= 0) {
        txt = txt.toLowerCase();
    }
    if(opGroup.indexOf("t") >= 0) {
        txt = txt.replace(/\s\s+/g, ' ').trim();
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
    posElemA
    ["y"] = (posElemA.top + posElemA.bottom) / 2;
    
    posElemB["bottom"] = posElemB.top + $(elemB).height();
    posElemB["right"] = posElemB.left + $(elemB).width();
    posElemB["x"] = (posElemB.left + posElemB.right) / 2;
    posElemB["y"] = (posElemB.top + posElemB.bottom) / 2;
    
    var distX = posElemA.x - posElemB.x;
    var distY = posElemA.y - posElemB.y;
    
    var dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
    var angle = Math.atan(distY, distX) * (180 / Math.PI);
    
    return [dist, angle];
}

function euclidDist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
    var distances = {"left": 0, "right": 0, "above": 0, "below": 0};
    
    if(posElemA.right <= posElemB.left) {
        directions["left"] = true;
        distances["left"] = Math.abs(posElemA.right - posElemB.left);
    }
    if(posElemA.left >= posElemB.right) {
        directions["right"] = true;
        distances["right"] = Math.abs(posElemA.left - posElemB.right);
    }
    if(posElemA.bottom <= posElemB.top) {
        directions["above"] = true;
        distances["above"] = Math.abs(posElemA.bottom - posElemB.top);
    }
    if(posElemA.top >= posElemB.bottom) {
        directions["below"] = true;
        distances["below"] = Math.abs(posElemA.top - posElemB.bottom);
    }
    
    return [directions[dir], distances[dir]];
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
    
    var markForRemoval = {};
    for(var i = 0; i < parents.length; i++) {
        var parentOfCurr = $(parents[i]).parent();
        if(parentOfCurr.length > 0) {
            var parentOfCurrIndex = parents.indexOf(parentOfCurr[0]);
            if(parentOfCurrIndex >= 0) {
                markForRemoval[parentOfCurrIndex] = true;
            }
        }
    }
    
    var match = [];
    for(var i = 0; i < parents.length; i++) {
        if(!(i in markForRemoval)) {
            match.push(parents[i]);
        }
    }

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