var lcssLimit = 150;

function bfs(a, b) {
    $(a).addClass("vs_seen");
    var q = [a];
    
    var found = false;
    
    while(q.length > 0) {
        var curr = q.shift();
        if(curr == b) {
            found = true;
            break;
        }
        
        var parent = $(curr).parent();
        var children = $(curr).children();
        for(var i = 0; i < children.length; i++) {
            if(!($(children[i]).hasClass("vs_seen"))) {
                $(children[i]).attr("vs_step", i==0?"child":"next");
                $(children[i]).addClass("vs_seen");
                q.push(children[i]);
            }
        }
        if(parent.length == 1) {
            if(!($(parent[0]).hasClass("vs_seen"))) {
                $(parent[0]).attr("vs_step", "parent-" + childNum(curr));
                $(parent[0]).addClass("vs_seen");
                q.push(parent[0]);
            }
        }
    }
    
    if(found) {
        var curr = b;
        var ops = [];
        
        while(curr != a) {
            ////console.log(curr);
            if($(curr).attr("vs_step") == "child") {
                curr = $(curr).parent()[0];
                ops.push("child");
            }
            else if($(curr).attr("vs_step") == "next") {
                curr = $(curr).prev()[0];
                ops.push("next");
            }
            else if($(curr).attr("vs_step").indexOf("parent") == 0) {
                var ind = $(curr).attr("vs_step").substr(7);
                ////console.log(ind);
                curr = $(curr).children()[ind];
                ops.push("parent");
            }
        }
        
        ops.reverse();
    }
    
    var seen = $(".vs_seen");
    seen.removeClass("vs_seen");
    seen.removeAttr("vs_step");
    $(".vs_seen").removeClass("vs_seen");
    
    return ops;
}

function childNum(elem) {
    var parent = $(elem).parent();
    var num = 0;
    var children = parent.children();
    for(var i = 0; i < children.length; i++) {
        if(children[i] == elem) {
            num = i;
            break;
        }
    }
    
    return num;
}

function arrToStr(arr, sep) {
    if(typeof sep == "undefined") {
        sep = ",";
    }
    
    var res = "";
    for(var i = 0; i < arr.length; i++) {
        res += arr[i];
        if(i < arr.length - 1) {
            res += sep;
        }
    }
    return res;
}

function generateSelect(options) {
    var select = $("<select></select");
    for(var i = 0; i < options.length; i++) {
        select.append("<option value='" + options[i] + "'>" + options[i] + "</option>");
    }
    return select;
}

function profile(elems, limit) {
    if(typeof limit == "undefined") {
        limit = Infinity;
    }
    //console.log("LIMIT IS " + limit);
    
    var attrList = [];
    
    for(var i = 0; i < elems.length; i++) {
        var elemObj = {};
        var atts = elems[i].attributes;
        for(var j = 0; j < atts.length; j++) {
            ////console.log(atts[j].nodeName + ": " + atts[j].nodeValue);
            var att = sTrim(atts[j].nodeValue.toLowerCase());
            if(att.length < limit) {
                elemObj[atts[j].nodeName] = atts[j].nodeValue.toLowerCase();
            }
        }
        if($(elems[i]).text().length > 0) {
            var att = sTrim($(elems[i]).text().toLowerCase());
            //if(att.length < limit) 
            {
                elemObj["contents"] = sTrim($(elems[i]).text().toLowerCase());
            }
        }
        
        elemObj["tag"] = $(elems[i]).prop("tagName");
        
        attrList.push(elemObj);
    }
    
    ////console.log(attrList);
    return attrList;
}

function sTrim(str) {
    return str.replace(/\s\s+/g, ' ').trim();
}

// much less clever, but fast and good for selecting things on the fly
function quickSelector(elemList) {
    elems = profile(elemList);
    //console.log("profiling from 136");
    //console.log(elems);
    
    var allTypes = [];
    for(var i = 0; i < elems.length; i++) {
        for(var type in elems[i]) {
            if(allTypes.indexOf(type) < 0) {
                allTypes.push(type);
            }
        }
    }
    
    var globalTypes = [];
    for(var i = 0; i < allTypes.length; i++) {
        var global = true;
        var type = allTypes[i];
        for(var j = 0; j < elems.length; j++) {
            if(!(type in elems[j])) {
                global = false;
                break;
            }
        }
        if(global && globalTypes.indexOf(type) < 0) {
            globalTypes.push(type);
        }
    }
    
    var typeObj = {};
    for(var i = 0; i < globalTypes.length; i++) {
        var type = globalTypes[i];
        typeObj[type] = [];
        for(var j = 0; j < elems.length; j++) {
            typeObj[type].push(elems[j][type]);
        }
    }
    
    var chain = [];
    for(var type in typeObj) {
        var lcssStr = lcss(typeObj[type])[0];
        if(lcssStr.length > 0) {
            chain.push(createLink(type, lcssStr, 300));
        }
    }
    if(chain.length > 0) {
        chain.push({"visibility-":"visible"});   
    }
    
    return chain;
}

function buildSelector2(elemList) {
    //console.log("building selector for: ");
    //console.log(elemList);
  
    var elems = generateNormalizations(elemList); 
    for(var i = 0; i < elems.length; i++) {
        elemList[i] = elems[i];
    }
    console.log(elems);
    var prof = profile(elems, lcssLimit);
    //console.log("profiling from 194");

    var allTypes = {};
    for(var i = 0; i < prof.length; i++) {
        for(var type in prof[i]) {
            allTypes[type] = true;
        }
    }
    
    //return "ALL DONE";
    var typeNLCSSGroups = {};
    for(var type in allTypes) {
        var typeVals = [];
        for(var i = 0; i < prof.length; i++) {
            var val = "";
            if(type in prof[i]) {
                val = prof[i][type];
            }
            typeVals.push(val);
        }
        typeNLCSSGroups[type] = groupByLCSS(typeVals, 3, true, "$");
    }
    //console.log("TYPE N LCSS GROUPS");
    
    var typeNLCSSGroupsArr = [];
    for(var type in typeNLCSSGroups) {
        var tempObj = {};
        tempObj[type] = typeNLCSSGroups[type];
        typeNLCSSGroupsArr.push(tempObj);
    }
    
    var overlapArr = processForOverlap(typeNLCSSGroupsArr);
    overlapArr = orderGroups(overlapArr);
    
    var covered = [];
    var unions = [];
    //console.log(overlapArr);
    for(var i = 0; i < overlapArr.length; i++) {
        var chainVals = [];
        for(var type in overlapArr[i]) {
            var vals = [];
            for(var j = 0; j < overlapArr[i][type].length; j++) {
                var entry = overlapArr[i][type][j];
                vals.push(entry.val);
                if(covered.indexOf(entry.ind) < 0) {
                    covered.push(entry.ind);
                }
            }
            var uniqueSubstrings = lcssUnique(vals);
            var avgLength = 0;
            var maxLength = 0;
            for(var v = 0; v < vals.length; v++) {
                avgLength += vals[v].length;
                maxLength = (vals[v].length > maxLength ? vals[v].length : maxLength);
            }

            for(var x = 0; x < uniqueSubstrings.length; x++) {
                uniqueSubstrings[x] = sTrim(uniqueSubstrings[x]);
                if(uniqueSubstrings[x].length >= 1) {
                    if(uniqueSubstrings[x].length >= 3 || uniqueSubstrings[x].length / avgLength >= 0.75 || uniqueSubstrings[x].indexOf("$") >= 0) {
                         chainVals.push(createLink(type, uniqueSubstrings[x], maxLength * 3));   
                    }
                }
            }
        }
 
        if(chainVals.length > 0) {
            //chainVals.push({"visibility-":"visible"});
            unions.push({"chain": chainVals});
            if(covered.length >= 0.9 * elemList.length) {
                //console.log("HOORAH");
                break;
            }
        }
    }
    
    console.log(JSON.stringify(unions));
    gunions = JSON.parse(JSON.stringify(unions));
    // CONTENTS MUST ALWAYS COME OUT SECOND
    for(var i = 0; i < unions.length; i++) {
        /*unions[i].chain.sort(function(a, b) {
            console.log(JSON.stringify(a) + "::" + JSON.stringify(b));
            if(Object.keys(a)[0].indexOf("contents-") >= 0 || Object.keys(b)[0].indexOf("contents-") >= 0) {
                console.log("pushing");
                return -1;
            }
            return 1;
        });*/
        var contentsArr = [];
        var otherArr = [];
        for(var x = 0; x < unions[i].chain.length; x++) {
            if(Object.keys(unions[i].chain[x])[0].indexOf("contents-") >= 0) {
                //unions[i].push(unions[i].chain.splice(x));
                contentsArr.push(unions[i].chain[x]);
            }
            else {
                otherArr.push(unions[i].chain[x]);
            }
        }
        contentsArr.push({"visibility-":"visible"});
        contentsArr.push({"deepest-":true});
        unions[i].chain = otherArr.concat(contentsArr);
    }
    console.log(JSON.stringify(unions));
    
    var unionObj = unions[0];
    if(unions.length >= 2) {
        unionObj = {"union": [unions[0], unions[1]]};
        var currObj = unionObj;
        for(var i = 2; i < unions.length; i++) {
            currObj["union"][1] = {"inter": [currObj["union"][1], unions[i]]};
            currObj = currObj["union"][1];
        }
    }
    
    return unionObj;
}

function generateNormalizations(elems) {
    //console.log("generating normalizations");
    var normalizationAnchors = [];
    var anchoredIn = [];
    
    for(var i = 0; i < elems.length; i++) {
        var levels = getAllLevelsWithSameContent(elems[i]);
        levels.push(elems[i]);
        //console.log("LEVELS: ");
        //console.log(levels);
        var bestMatches = [];
        for(var l = 0; l < levels.length; l++) {    
            var currProf = uniProf(levels[l], lcssLimit);
            currProf["tag"] = $(levels[l]).prop("tagName");
            bestMatches.push({"index":-1, "score":0, "elementIndex":l});

            for(var j = 0; j < normalizationAnchors.length; j++) {
                var currScore = 0;
                var anchor = normalizationAnchors[j].anchor;

                if(anchor["tag"] == currProf["tag"]) {
                    currScore = 2; // NOTE, probably leave this in, maybe take it out NOTE NOTE NOTE 8/8/2016
                    //console.log("HEHEHEHEHEH");
                    //console.log(JSON.stringify(currProf));
                    for(var prop in currProf) {
                        if(prop in anchor && prop != "contents" && prop != "tag") {
                            //console.log("finding lcss arr for " + prop);
                            //console.log(JSON.stringify([currProf[prop], anchor[prop]]));
                            var lcssArr = lcssUnique([currProf[prop], anchor[prop]]);
                            //console.log(JSON.stringify(lcssArr));
                            
                            if(lcssArr.length > 0 && lcssArr[0].length >= 3) {
                                currScore += lcssArr[0].length;
                            }
                        }
                    }
                }
                //console.log("made it to 295");
                if(currScore > bestMatches[bestMatches.length - 1].score) {
                    bestMatches[bestMatches.length - 1].score = currScore;
                    bestMatches[bestMatches.length - 1].index = j;
                }
                else if(currScore == bestMatches[bestMatches.length - 1].score && bestMatches[bestMatches.length - 1].score != 0) {
                    // Does one of them have substantially less extra stuff?
                    var otherAnchor = normalizationAnchors[bestMatches[bestMatches.length - 1].index].anchor;
                    var score1 = scoreIt(currProf, anchor);
                    var score2 = scoreIt(currProf, otherAnchor); // score currProf against otherAnchor
                    
                    if(score1 > score2) {
                        bestMatches[bestMatches.length - 1].score = currScore;
                        bestMatches[bestMatches.length - 1].index = j;
                    }
                }
            }
        }
        
        bestMatches.sort(function(a, b) {
            return b.score - a.score;
        });
        
        var indsUsed = [];
        for(var l = 0; l < bestMatches.length; l++) {
            if(bestMatches[l].index >= 0 && indsUsed.indexOf(bestMatches[l].index) < 0) {
                normalizationAnchors[bestMatches[l].index]["elements"].push({"element":levels[bestMatches[l].elementIndex], "index":i});
                indsUsed.push(bestMatches[l].index);
            }
            else {
                var newProf = uniProf(levels[bestMatches[l].elementIndex]);
                newProf["tag"] = $(levels[bestMatches[l].elementIndex]).prop("tagName");
                normalizationAnchors.push({"anchor":newProf, "elements":[{"element":levels[bestMatches[l].elementIndex], "index":i}]});
                
                indsUsed.push(normalizationAnchors.length - 1);
            }
        }
    }
    //console.log("made it to 333");
    for(var i = 0; i < normalizationAnchors.length; i++) {
        var subElems = [];
        for(var j = 0; j < normalizationAnchors[i].elements.length; j++) {
            subElems.push(normalizationAnchors[i].elements[j].element);
        }
        var typeObj = quickProcess(subElems, lcssLimit);
        delete typeObj["contents"];
        normalizationAnchors[i]["types"] = typeObj;
    }
    
    console.log("THE NORMALIZATION ANCHORS ARE: ");
    console.log(normalizationAnchors);
    
    normalizationAnchors.sort(function(a, b) {
         if(b.elements.length == a.elements.length) {
             var aTypeLength = 0;
             var bTypeLength = 0;
             
             for(var type in a.types) {
                 aTypeLength += a.types[type].length;
             }
             for(var type in b.types) {
                 bTypeLength += b.types[type].length;
             }
             return bTypeLength - aTypeLength;
        }
        else {
            return b.elements.length - a.elements.length;
        }
    });
    
    var normalizedElems = [];
    for(var i = 0; i < elems.length; i++) {
        for(var j = 0; j < normalizationAnchors.length; j++) {
            var found = false;
            for(var k = 0; k < normalizationAnchors[j].elements.length; k++) {
                if(normalizationAnchors[j].elements[k].index == i) {
                    normalizedElems.push(normalizationAnchors[j].elements[k].element);   
                    found = true;
                    break;
                }
            }
            if(found) {
                break;
            }
        }
    }
    
    return normalizedElems;
}

function scoreIt(profA, refProf) {
    var resScore = 0;
    for(var type in profA) {
        if(type != "contents" && type != "tag") {
            if(!(type in refProf)) {
                resScore--;
            }
            else {
                var lcssStr = lcss(profA[type], refProf[type])[0];
                resScore -= refProf[type].length - lcssStr.length;
            }
        }
    }
    return resScore;
}

function quickProcess(elemList, limit) {
    elems = profile(elemList, limit);
    //console.log("profiling from 420");
    
    var allTypes = [];
    for(var i = 0; i < elems.length; i++) {
        for(var type in elems[i]) {
            if(allTypes.indexOf(type) < 0) {
                allTypes.push(type);
            }
        }
    }
    
    var globalTypes = [];
    for(var i = 0; i < allTypes.length; i++) {
        var global = true;
        var type = allTypes[i];
        for(var j = 0; j < elems.length; j++) {
            if(!(type in elems[j])) {
                global = false;
                break;
            }
        }
        if(global && globalTypes.indexOf(type) < 0) {
            globalTypes.push(type);
        }
    }
    
    var typeObj = {};
    for(var i = 0; i < globalTypes.length; i++) {
        var type = globalTypes[i];
        typeObj[type] = [];
        for(var j = 0; j < elems.length; j++) {
            typeObj[type].push(elems[j][type]);
        }
    }
    
    var finalTypeObj = {};
    for(var type in typeObj) {
        var lcssStr = lcss(typeObj[type])[0];
        if(lcssStr.length >= 3) {
            finalTypeObj[type] = lcssStr;
        }
    }
    
    return finalTypeObj;
}

function getAllLevelsWithSameContent(elem) {
    //console.log("getting all levels with same content");
    var curr = $(elem);
    var origText = sTrim($(elem).text().toLowerCase());
    
    var levels = [];
    
    while(curr.parent().length > 0 && sTrim(curr.parent().text().toLowerCase()) == origText) {
        levels.push(curr.parent()[0]);
        curr = curr.parent();
    }
    
    var child = $(elem).find("*").filter(function() {
       return sTrim($(this).text().toLowerCase()) == origText; 
    });

    for(var i = 0; i < child.length; i++) {
        levels.push(child[i]);
    }
    
    return levels;
}

/*function getAllLevelsWithSameImage(elem) {
    var theImg = $(elem).find("*").filter.(function() {
       return $(this).prop("tagName") == "IMG"; 
    });
    if(theImg.length == 1) {
        theImg = theImg[0];
        var curr = $(elem);
        
        var levels = [];
        
        while(curr.parent().length > 0 && sTrim(curr.parent().text().toLowerCase()) == origText) {
        levels.push(curr.parent()[0]);
        curr = curr.parent();
        }

        var child = $(elem).find("*").filter(function() {
           return sTrim($(this).text().toLowerCase()) == origText; 
        });

        for(var i = 0; i < child.length; i++) {
            levels.push(child[i]);
        }

        return levels;
    }
    else {
        alert("TOO MANY IMAGES 543 in SMART SEL");
        return null;
    }
}*/

function uniProf(elem, limit) {
    if(typeof limit == "undefined") {
        limit = Infinity;
    }
    
    var elemObj = {};
    var atts = elem.attributes;
    for(var j = 0; j < atts.length; j++) {
        var att = sTrim(atts[j].nodeValue.toLowerCase());
        if(att.length < limit) {
            //console.log("HOORAY");
            //console.log(att);
            elemObj[atts[j].nodeName] = atts[j].nodeValue.toLowerCase();
        }
    }
    if($(elem).text().length > 0) {
        elemObj["contents"] = sTrim($(elem).text().toLowerCase());
    }
    return elemObj;
}

function orderGroups(overlapArr) {
    overlapArr.sort(function(a, b) {
       return b[Object.keys(b)[0]].length - a[Object.keys(a)[0]].length;
    });
    
    var mainCover = cover(overlapArr[0][Object.keys(overlapArr[0])[0]]);
    var suboverlap = overlapArr.splice(1);
    
    suboverlap.sort(function(a, b) {
        var aCover = cover(a[Object.keys(a)[0]]);
        var bCover = cover(b[Object.keys(b)[0]]);
        
        return absDifference(bCover, mainCover).length - absDifference(aCover, mainCover).length ;
    });
    
    overlapArr = overlapArr.concat(suboverlap);
    
    return overlapArr;
}

function cover(arr) {
    var covered = [];
    for(var i = 0; i < arr.length; i++) {
        covered.push(arr[i].ind);
    }
    return covered;
}

function buildChains(arr, minPropLength) {
    var unions = [];
    for(var i = 0; i < arr.length; i++) {
        var foundUnion = false;
        for(var prop in arr[i]) {
            // Do we have a union with this prop?
            for(var u = 0; u < unions.length; u++) {
                for(var v = 0; v < unions[u].length; v++) {
                    if(prop in unions[u][v]) {
                        unions[u].push(arr[i]);
                        foundUnion = true;
                        break;
                    }
                }
            }
        }
        if(!foundUnion) {
            unions.push([arr[i]]);
        }
    }
    
    var emptyChainInds = [];
    
    // Now let's take each component of these unions and make them into actual chains
    for(var i = 0; i < unions.length; i++) {
        for(var j = 0; j < unions[i].length; j++) {
            var chain = [];
            for(var prop in unions[i][j]) {
                for(var word in unions[i][j][prop]) {
                    if(unions[i][j][prop][word].length >= minPropLength) {
                        chain.push(createLink(prop, unions[i][j][prop][word], 150));
                    }
                }
            }
            if(chain.length > 0) { chain.push({"visibility-":"visible"}); } // REMOVE THIS LINE ONLY IF VISIBILITY IS NOT A CONCERN
            chain = {"chain": chain};
            unions[i][j] = chain;
            if(chain.length == 0) {
                emptyChainInds.push([i, j]);
            }
        }
    }
    
    /*************** 7/19/2016 *******************/
    /***** filter out empty chains ***************/
    var newUnions = [];
    for(var i = 0; i < unions.length; i++) {
        var subArr = [];
        for(var j = 0; j < unions[i].length; j++) {
            if(unions[i][j].chain.length > 0) {
                subArr.push(unions[i][j]);
            }
        }
        if(subArr.length > 0) {
            newUnions.push(subArr);
        }
    }
    unions = newUnions;
    /******************************************/
    
    for(var i = 0; i < unions.length; i++) {
        if(unions[i].length >= 2) {
            var unionObj = {"union": [unions[i][0], unions[i][1]]};
            var currObj = unionObj;
            for(var j = 2; j < unions[i].length; j++) {
                currObj["union"][1] = {"union": [currObj["union"][1], unions[i][j]]};
                currObj = currObj["union"][1];
            }
            unions[i] = unionObj;
        }
        else {
            unions[i] = unions[i][0];
        }
    }
    
    // Now unions is a bunch of things that should be intersections
    var interObj = unions[0];
    if(unions.length >= 2) {
        interObj = {"union": [unions[0], unions[1]]};
        var currObj = interObj;
        for(var i = 2; i < unions.length; i++) {
            currObj["union"][1] = {"inter": [currObj["union"][1], unions[i]]};
            currObj = currObj["union"][1];
        }
    }
    
    return interObj;
}

function createLink(prop, val, len) {
    var obj = {};
    if(prop == "id" || prop == "class") {
        obj[prop + "-"] = "[+lt]" + val;
    }
    else if(prop == "contents") {
        obj["contents-" + len] = "[+lt]" + val;
    }
    else if(prop == "tag") {
        obj["tag-"] = "=" + val;
    }
    else {
        obj["prop-" + prop] = "[+lt]" + val;
    }
    return obj;
}

function processForOverlap(groups) {
    var newGroups = [];
    
    for(var i  = 0; i < groups.length; i++) {
        var prop = Object.keys(groups[i])[0];
        for(var j = 0; j < groups[i][prop].length; j++) {
            var currCluster = groups[i][prop][j];
            // do we have a match for the current cluster in our new groups already?
            // that is, a cluster which covers the same element indeces?
            var foundMatch = false;
            for(var x = 0; x < newGroups.length; x++) {
                var currNewCluster = newGroups[x][Object.keys(newGroups[x])[0]];
                var allMatch = true;
                if(currNewCluster.length == currCluster.length) {
                    // do they share all the same indeces?
                    var currClusterIndeces = [];
                    var newClusterIndeces = [];
                    for(var y = 0; y < currCluster.length; y++) {
                        currClusterIndeces.push(currCluster[y].ind);
                        newClusterIndeces.push(currNewCluster[y].ind);
                    }
                    currClusterIndeces.sort();
                    newClusterIndeces.sort();
                    for(var y = 0; y < currClusterIndeces.length; y++) {
                        if(currClusterIndeces[y] != newClusterIndeces[y]) {
                            allMatch = false;
                            break;
                        }
                    }
                }
                else {
                    allMatch = false;
                }

                if(allMatch) {
                    newGroups[x][prop] = currCluster;
                    foundMatch = true;
                }
            }
            if(!foundMatch) {
                var newObj = {};
                newObj[prop] = currCluster;
                newGroups.push(newObj);
            }
        }
    }

    return newGroups;
}

function sameValues(arrA, arrB) {
    if(arrA.length != arrB.length) {
        return false;
    }
    
    for(var i = 0; i < arrA.length; i++) {
        var found = false;
        for(var j = 0; j < arrB.length; j++) {
            if(arrA[i] == arrB[j]) {
                found = true; 
                break;
            }
        }
        if(!found) {
            return false;
        }
    }
    
    return true;
}

function matchWithAnchor(anchors, elem) {
    var minLength = Infinity;
    var minIndex = -1;
    
    for(var i = 0; i < anchors.length; i++) {
        var path = bfs(anchors[i], elem);
        if(path.length < minLength) {
            minIndex = i;
            minLength = path.length;
        }
    }
    
    return minIndex;
}

function groupByAnchor(elemLists) {    
    var anchor = elemLists[0].list;
    var groups = [];
    for(var i = 0; i < anchor.length; i++) {
        var tempObj = {};
        tempObj[elemLists[0].type] = [anchor[i]];
        groups.push(tempObj);
    }
    
    for(var i = 1; i < elemLists.length; i++) {
        var list = elemLists[i].list;
        var type = elemLists[i].type;
        for(var j = 0; j < list.length; j++) {
            var anchorInd = matchWithAnchor(anchor, list[j]);
            if(type in groups[anchorInd]) {
                groups[anchorInd][type].push(list[j]);
            }
            else {
                groups[anchorInd][type] = [list[j]];
            }
        }
    }
    
    return groups;
}

function groupByAnchorFast(elemLists) {
    var anchor = elemLists[0].list;
    
    var groups = [];
    for(var i = 0; i < anchor.length; i++) {
        var tempObj = {};
        tempObj[elemLists[0].type] = [anchor[i]];
        groups.push(tempObj);
    }
    
    var superStructure = findSuperStructure(anchor);
    
    if(superStructure.length != anchor.length) {
        alert("Warning: Superstructure length doesn't match anchor.");
        //console.log(superStructure);
        //console.log(anchor);
        //return;
    }
    
    for(var i = 1; i < elemLists.length; i++) {
        var list = elemLists[i].list;
        var type = elemLists[i].type;
        
        for(var j = 0; j < list.length; j++) {
            for(var s = 0; s < superStructure.length; s++) {
                if($.contains(superStructure[s], list[j])) {
                    if(type in groups[s]) {
                        groups[s][type].push(list[j]);
                    }
                    else {
                        groups[s][type] = [list[j]];
                    }
                    break;
                }
            }
        }
    }
    
    return groups;
}

function collectPaths(groups) {
    var paths = {};
    
    for(var i = 0; i < groups.length; i++) {
        for(var t1 in groups[i]) {
            if(!(t1 in paths)) {
                paths[t1] = {};
            }
            for(var x = 0; x < groups[i][t1].length; x++) {
                for(var t2 in groups[i]) {
                    if(t2 != t1) {
                        for(var y = 0; y < groups[i][t2].length; y++) {
                            var path = arrToStr(bfs(groups[i][t1][x], groups[i][t2][y]));
                            if(!(t2 in paths[t1])) {
                                paths[t1][t2] = [path];
                            }
                            else if(paths[t1][t2].indexOf(path) < 0) {
                                paths[t1][t2].push(path);
                            }
                        }
                    }
                }   
            }
        }
    }
    
    return paths;
}

function buildJSON(elemGroups/*, origSelection*/) {
    //console.log(elemGroups);
    
    //return;
    origSelection = elemGroups[0].list;
    
    devlog("grouping elements");
    var anchorGroups = groupByAnchorFast(elemGroups); // experimental, groupByAnchor is definitely better, but MUCH slower
    devlog("mapping relations");
    var pathGroups = collectPaths(anchorGroups);
    devlog("identifying global elements");
    var globalTypes = getGlobalTypes(elemGroups, anchorGroups);
    var allTypes = getAllTypes(elemGroups);
    var selectors = {};
    console.log("ALL TYPES");
    console.log(allTypes);
    for(var i = 0; i < allTypes.length; i++) {
        //console.log("starting anew with " + allTypes[i]);
        var ind = -1;
        for(var x = 0; x < elemGroups.length; x++) {
            if(elemGroups[x].type == allTypes[i]) {
                ind = x;
                break;
            }
        }
        //var prof = profile(elemGroups[ind].list);
        //var selector = buildSelector(prof);
        //console.log("EXCELLENT progress");
        //console.log(ind);
        //console.log(elemGroups);
        //console.log(elemGroups[ind]);
        devlog("building selector for " + allTypes[i]);
        var selector = buildSelector2(elemGroups[ind].list);
        
        console.log("RAW SELECTOR FOR " + allTypes[i]);
        console.log(JSON.stringify(selector));
        
        if(typeof selector != "undefined") {
            selectors[allTypes[i]] = selector;
        }
        //console.log("good good");
    }
    
    //return;
    
    //console.log("ALIVE HERE ON 813");
    devlog("identifying page superstructure");
    var anchorType = elemGroups[0].type;
    var selArr = [];
    var selArrGlobal = [];
    if(anchorType in selectors) {
        selArr = [selectors[anchorType]]; // we need the anchor to be the first thing in the array to ensure
        selArrGlobal = [selectors[anchorType]]; // shared by all
        // a self-consistent super structure
        for(var key in selectors) {
            if(key != anchorType) {
                selArr.push(selectors[key]);
            }
            if(key != anchorType && globalTypes.indexOf(key) >= 0) {
                selArrGlobal.push(selectors[key]);
            }
        }   
    }
    else {
        alert("Could not selector anchor type.  Error.");
    }
    //console.log("ALIVE HERE ON 833");
    
    if(selArr.length > 0) {
        devlog("testing superstructure selector");
        var superObj = generateSuperSelector(selArrGlobal, origSelection);
        console.log("SUPEROBJ");
        console.log(JSON.stringify(superObj));
        var superElems = resolveSafe(superObj);
        console.log("must have died while doing some 'safe' resolving");
        console.log(superElems);
        
        var productionSelector = [{"desc":[superObj,{"name":"vs_container","vsid":"generate"}]}];
        
        if(superElems.length > 0) {
            // within each super element, attempt to find each thing by its description.
            // if its description exists, but it isn't very good, try to use the path in concert with the description
            // if its description doesn't exist or its path + description doesn't get us anywhere, then use its path
            // if all these methods fail, give up
            
            var typeScores = {}; // lower score is better
            var finalizedSelectors = {};
            var unfinalized = [];
            for(var x = 0; x < allTypes.length; x++) {
                devlog("testing selector for " + allTypes[x]);
                var currType = allTypes[x];
                if(currType in selectors) {
                    var resElems = resolveSafe({"desc":[selectors[currType],{"deep":true,"ctxt":superObj,"cascade":true}]});
            
                    var currUserList = [];
                    for(var y = 0; y < elemGroups.length; y++) {
                        if(elemGroups[y].type == currType) {
                            currUserList = elemGroups[y].list;
                            break;
                        }
                    }
                    ////console.log(resElems);
                    var extraElems = _.difference(resElems, currUserList);
                    var missingElems = _.difference(currUserList, resElems);
                    //console.log(currType + ":: extra: " + extraElems.length + ", missing: " + missingElems.length + "\n");
                    typeScores[currType] = extraElems.length + missingElems.length; // lower score is better
                    
                    console.log("FOR " + currType + " we got:");
                    console.log(resElems);
                    
                    if(typeScores[currType] < elemGroups[findInElemGroups(elemGroups, currType)].list.length * 0.2) {
                        devlog("selector for " + currType + " passed");
                        finalizedSelectors[currType] = {"desc":[selectors[currType],{"deep":true,"ctxt":superObj,"cascade":true}]};
                        
                        var mand = everPresent(anchorGroups, currType);
                        var grab = getContentType(resElems);
                        var prod = {"desc":[selectors[currType],{"name":currType,"vsid":"generate","tag":true,"ctxt":{"ref":"vs_container"},"deep":true,"grab":grab,"mandatory":mand,"cascade":true}]};
                        productionSelector.push(prod);
                        
                        //productionSelectors.push({"desc":[selectors[currType],{"deep":true,"ctxt":superObj,"cascade":true}]});
                        console.log("FINALIZING: " + currType);
                        //console.log(JSON.stringify(finalizedSelectors[currType]));
                        //console.log("\n");
                    }
                    else {
                        devlog("selector for " + currType + " failed");
                        console.log(currType + " is not ready to be finalized because its score is " + typeScores[currType]);
                        unfinalized.push(currType);
                    }
                }
            }
            
            var pathGroupsRefined = {};
            devlog("refining element relations");
            for(var key in finalizedSelectors) {
                if(key in pathGroups) { // TODO: path groups is presently missing the anchor // EDIT: Fixed
                    pathGroupsRefined[key] = pathGroups[key];
                }
            }
            
            console.log("REFINED PATH GROUPS");
            console.log(pathGroupsRefined);
            var stillUnfinalized = [];
            for(var i = 0; i < unfinalized.length; i++) {
                devlog("attemping to recover " + unfinalized[i]);
                var bestType = findBestPath(unfinalized[i], pathGroupsRefined, anchorGroups);//findTypeWithShortestAvgPathToOtherType(unfinalized[i], pathGroupsRefined);
                console.log("the best way to get to " + unfinalized[i] + " is to go through " + bestType);
                if(bestType == null) {
                    console.log("path for " + unfinalized[i] + " null");
                    devlog("could not find a path for " + unfinalized[i]);
                    continue;
                }
                var paths = pathGroupsRefined[bestType][unfinalized[i]];
                
                if(paths != null && paths.length > 0) { 
                    console.log("THE PATHS ARE");
                    console.log(paths);
                    var baseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]};
                    var prodBaseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]};
                    ////console.log(JSON.stringify(baseline));
                    
                    if(paths.length >= 2) {
                        baseline = {"union":[baseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                        prodBaseline = {"union":[prodBaseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                        //console.log(JSON.stringify(baseline));
                        for(var p = 2; p < paths.length; p++) {
                            baseline.union[1] = {"union":[baseline.union[1], {"desc":[{"chain":[{"nav-":paths[p]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                            prodBaseline.union[1] = {"union":[prodBaseline.union[1], {"desc":[{"chain":[{"nav-":paths[p]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                            if(p < paths.length - 1) {
                                baseline = baseline.union[1];
                            }
                        }
                    }
                    
                    var newSelector = {"sinter":[baseline,
                                                 {"desc":[selectors[unfinalized[i]],{"ctxt":superObj,"cascade":true,"deep":true}]}]};
                    
                    var prodSelector = {"sinter":[prodBaseline,
                                                  {"desc":[selectors[unfinalized[i]],{"ctxt":{"ref":"vs_container"},"cascade":true,"deep":true}]}]};

                    console.log(JSON.stringify(newSelector));

                    var resElems = resolveSafe(newSelector);

                    console.log(resElems);
                    console.log(currUserList);

                    var currUserList = elemGroups[findInElemGroups(elemGroups, unfinalized[i])].list;
                    //console.log(currUserList);
                    var extraElems = _.difference(resElems, currUserList);
                    var missingElems = _.difference(currUserList, resElems);
                    //console.log(unfinalized[i] + ":: extra: " + extraElems.length + ", missing: " + missingElems.length);
                    typeScores[unfinalized[i]] = extraElems.length + missingElems.length; // lower score is better
                    
                    if(typeScores[unfinalized[i]] < elemGroups[findInElemGroups(elemGroups, unfinalized[i])].list.length * 0.2) {
                        devlog("finalizing " + unfinalized[i]);
                        console.log("finalizing " + unfinalized[i] + " with score " + typeScores[unfinalized[i]]);
                        finalizedSelectors[unfinalized[i]] = newSelector;
                        
                        var mand = everPresent(anchorGroups, unfinalized[i]);
                        var grab = getContentType(resElems);
                        prodSelector = {"desc":[prodSelector, {"name":unfinalized[i],"grab":true,"mandatory":mand,"grab":grab}]};
                        productionSelector.push(prodSelector);
                        ////console.log("PROD BASELINE");
                        ////console.log(prodBaseline);
                        ////console.log(JSON.stringify(prodBaseline));
                    }
                    else {
                        devlog("could not finalize " + unfinalized[i]);
                        console.log(unfinalized[i] + " is not ready to be finalized because its score is " + typeScores[unfinalized[i]]);
                        // These elements are not selectable by content, even though selectors were generated for them.  In one final effort, we will
                        // make an attempt exclusively by path, without regard for content, for these elements, as well as for the elements that do not have
                        // a content-based selector.
                    }
                }
                else {
                    console.log("NO AVAILABLE PATHS");
                    //console.log("umm.... well.... in spite of our best efforts");
                }
            }
            
            // Re-refine the path gruops to include any additional elements we just found
            devlog("attemping final relation refinement");
            for(var key in finalizedSelectors) {
                if(key in pathGroups) { 
                    pathGroupsRefined[key] = pathGroups[key];
                }
            }
            for(var i = 0; i < allTypes.length; i++) {
                // for these, we haven't got a reliable selector
                if(!(allTypes[i] in finalizedSelectors)) {
                    // what sort of results do we get just by applying the path?
                    var type = allTypes[i];
                    var bestType = findBestPath(type, pathGroupsRefined, anchorGroups);
                    if(bestType != null) {
                        devlog("attemping to select " + type);
                        //console.log("the best way to get to " + type + " is to go through " + bestType);
                        var paths = pathGroupsRefined[bestType][type];
                        //console.log(paths[0]);
                        
                        var baseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]};
                        var prodBaseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]};
                        ////console.log(JSON.stringify(baseline));
                        
                        if(paths != null && paths.length >= 2) {
                            //baseline = {"union": [baseline, "desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]]};
                            baseline = {"union":[baseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                            prodBaseline = {"union":[prodBaseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                            //console.log(JSON.stringify(baseline));
                            for(var p = 2; p < paths.length; p++) {
                                baseline.union[1] = {"union":[baseline.union[1], {"desc":[{"chain":[{"nav-":paths[p]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                                prodBaseline.union[1] = {"union":[prodBaseline.union[1], {"desc":[{"chain":[{"nav-":paths[p]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                                if(p < paths.length - 1) {
                                    baseline = baseline.union[1];
                                }
                            }
                        }
                        
                        var resElems = resolveSafe(baseline);
                        //console.log(resElems);
                        var currUserList = elemGroups[findInElemGroups(elemGroups, type)].list;
                        var extraElems = _.difference(resElems, currUserList);
                        var missingElems = _.difference(currUserList, resElems);
                        //console.log(type + ":: extra: " + extraElems.length + ", missing: " + missingElems.length);
                        typeScores[type] = extraElems.length + missingElems.length; // lower score is better
                        
                        if(typeScores[type] < elemGroups[findInElemGroups(elemGroups, type)].list.length * 0.2) {
                            devlog("finalizing selector for " + type);
                            console.log("finalizing " + type + " with score " + typeScores[type]);
                            finalizedSelectors[type] = baseline;
                            
                            var mand = everPresent(anchorGroups, type);
                            var grab = getContentType(resElems);
                            var prodSelector = {"desc":[prodBaseline, {"name":type,"grab":true,"mandatory":mand,"grab":grab}]};
                            productionSelector.push(prodSelector);
                        }   
                    }
                    else {
                        devlog("could not select " + type);
                        console.log("NOTHING was available for this element.  No paths.  No selectors.  NOTHING.  Evaders, well done.")
                    }
                }
            }
            //console.log(pathGroupsRefined);
        }
        else {
            devlog("no superstructure could be identified... aborting");
            alert("No superstructure could be identified.  Gonna go take a nap.");
        }
    }
    else {
        devlog("critical error; sorry");
        alert("OOPS");
    }
    
    console.log("PRODUCTION SELECTOR:");
    console.log(JSON.stringify(productionSelector));
    devlog("Success!  See the BUILDER tab.");
    sendSelector(productionSelector);
    disableInterface();
}

function everPresent(anchorGroups, type) {
    for(var i = 0; i < anchorGroups.length; i++) {
        if(!(type in anchorGroups[i])) {
            return false;
        }
    }
    
    return true;
}

// elements that arr a contains that are also contained in arrB OR
// elements that are in arrA that are parents of elements in arrB
function smartInter(arrA, arrB) {
    var inter = [];
    for(var i = 0; i < arrA.length; i++) {
        for(var j = 0; j < arrB.length; j++) {
            if(arrA[i] == arrB[j] || $.contains(arrA[i], arrB[j])) {
                if(inter.indexOf(arrA[i]) < 0) {
                    inter.push(arrA[i]);
                }
            }
        }
    }
    return inter;
}

// TODO: Make this function more robust.  It should really look at more than just
// the first element to figure out what type of list this is
function getContentType(resElems) {
    if($(resElems[0]).prop("tagName") == "IMG") {
        return "src";
    }
    else {
        return "text";
    }
}

function findInElemGroups(elemGroups, type) {
    for(var y = 0; y < elemGroups.length; y++) {
        if(elemGroups[y].type == type) {
            return y;
        }
    }
}

function findBestPath(otherType, pathGroups, anchorGroups) {
    var penalties = {};
    
    for(var type in pathGroups) {
        if(otherType in pathGroups[type]) {
            var penalty = 20 * pathGroups[type][otherType].length;
            penalty += 10 * absDifference(getCover(type, anchorGroups), getCover(otherType, anchorGroups));
            var avgLength = 0;
            for(var i = 0; i < pathGroups[type][otherType].length; i++) {
                avgLength += pathGroups[type][otherType][i].split(",").length;
            }
            avgLength /= pathGroups[type][otherType].length;
            penalty += avgLength;
            
            penalties[type] = penalty;
        }
    }
    
    var bestType = null;
    var lowestPenalty = Infinity;
    for(var type in penalties) {
        if(penalties[type] < lowestPenalty) {
            bestType = type;
            lowestPenalty = penalties[type];
        }
    }
    
    return bestType;
}

function absDifference(arrA, arrB) {
    return _.union(_.difference(arrA, arrB), _.difference(arrB, arrA));
}

function getCover(type, anchorGroups) {
    var cover = [];
    for(var i = 0; i < anchorGroups.length; i++) {
        if(type in anchorGroups[i]) {
            cover.push(i);
        }
    }
    
    return cover;
}

function findTypeWithShortestAvgPathToOtherType(otherType, pathGroups) {
    var bestType = null;
    var bestAvgLength = Infinity;
    
    for(var type in pathGroups) {
        if(otherType in pathGroups[type]) {
            var avgLength = 0;
            for(var i = 0; i < pathGroups[type][otherType].length; i++) {
                avgLength += pathGroups[type][otherType][i].split(",").length;
            }
            avgLength /= pathGroups[type][otherType].length;
            if(avgLength > 0 && avgLength < bestAvgLength) {
                bestAvgLength = avgLength;
                bestType = type;
            }
        }
    }
    
    return bestType;
}

function generateSuperSelector(selArr, origSelection) {
    console.log("SEL ARR IS: ");
    console.log(selArr);
    var refStruct = findSuperStructure(origSelection);
    
    var supers = [];
    for(var i = 0; i < selArr.length; i++) {
        var currSuper = findSuperStructure(resolveSafe(selArr[i]));
        var penalty = absDifference(refStruct, currSuper).length;
        supers.push({"selector":selArr[i], "structure":currSuper, "penalty":penalty});
    }
    // low penalty is better
    supers.sort(function(a, b) {
        return a.penalty - b.penalty;
    });
    
    console.log(supers);
    
    var selArrRefined = [supers[0].selector];
    var superStruct = supers[0].super;
    var minPenalty = supers[0].penalty;
    for(var i = 1; i < supers.length; i++) {
        var inter = _.intersection(superStruct, supers[i].super);
        var penalty = absDifference(refStruct, inter);
        if(penalty < minPenalty) {
            selArrRefined.push(supers[i].selector);
            minPenalty = penalty;
        }
    }
    
    console.log("selArrRefined is ");
    console.log(selArrRefined);
    
    /*var selArrRefined = [selArr[0]];
    var superStruct = findSuperStructure(resolveSafe(selArr[0]));
    var origLength = superStruct.length;
    //var superStruct = findSuperStructure(resolveSafe(selArr[0]));
    for(var i = 1; i < selArr.length; i++) {
        var currSuperStruct = findSuperStructure(resolveSafe(selArr[0]));
        var inter = _.intersection(superStruct, currSuperStruct);
        if(inter.length > 0) {
            superStruct = inter;
            selArrRefined.push(selArr[i]);
        }
    }*/
    
    var interObj = {"super": selArrRefined[0]}; 
    if(selArrRefined.length >= 2) {
        interObj = {"inter": [{"super": selArrRefined[0]}, {"super": selArrRefined[1]}]};
        
        var currObj = interObj;
        for(var i = 2; i < selArrRefined.length; i++) {
            currObj["inter"][1] = {"inter": [currObj["inter"][1], {"super": selArrRefined[i]}]};
            currObj = currObj["inter"][1];
        }
    }
    
    return interObj;
}

function getGlobalTypes(elemLists, anchorGroups) {
    var globalTypes = [/*elemLists[0].type*/];
    
    // which elements occur in every anchor group
    for(var i = 0; i < elemLists.length; i++) {
        var type = elemLists[i].type;
        var globallyPresent = true;
        // Does this type occur in every anchor group?
        for(var j = 0; j < anchorGroups.length; j++) {
            if(!(type in anchorGroups[j])) {
                globallyPresent = false;
                break;
            }
        }
        if(globallyPresent) {
            globalTypes.push(type);
        }
    }
    
    return globalTypes;
}

function getAllTypes(elemLists) {
    var allTypes = [];
    
    for(var i = 0; i < elemLists.length; i++) {
        var type = elemLists[i].type;
        allTypes.push(type);
    }
    
    return allTypes;
}

/*function findAnchorSuperStructure(elems) {
    var superStructure = [];
    
    for(var i = 0; i < elems.length; i++) {
        var currParent = $(elems[i]).parent()[0];
        var prevParent = elems[i];
        while($(currParent).find($(elems)).length == 1) {
            prevParent = currParent;
            currParent = $(currParent).parent()[0];
        }
        
        superStructure.push(prevParent);
    }
    
    //console.log(superStructure);
    return superStructure;
}*/