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
            //console.log(curr);
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
                //console.log(ind);
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

function profile(elems) {
    var attrList = [];
    
    for(var i = 0; i < elems.length; i++) {
        var elemObj = {};
        var atts = elems[i].attributes;
        for(var j = 0; j < atts.length; j++) {
            //console.log(atts[j].nodeName + ": " + atts[j].nodeValue);
            elemObj[atts[j].nodeName] = atts[j].nodeValue;
        }
        if($(elems[i]).text().length > 0) {
            elemObj["contents"] = $(elems[i]).text();
        }
        attrList.push(elemObj);
    }
    
    //console.log(attrList);
    return attrList;
}

function buildSelector(attrList) {
    //console.log(attrList);
    
    var groupedByAttr = {};
    
    for(var i = 0; i < attrList.length; i++) {
        var currKeys = Object.keys(attrList[i]).sort();
        //console.log(arrToStr(currKeys));
        if(!(currKeys in groupedByAttr)) {
            groupedByAttr[currKeys] = [attrList[i]];
        }
        else {
            groupedByAttr[currKeys].push(attrList[i]);
        }
    }
    
    var refinedGroups = {};
    // which attributes can we actually use?
    for(var attrGroup in groupedByAttr) {
        var types = attrGroup.split(",");
        refinedGroups[attrGroup] = [];
        for(var i = 0; i < groupedByAttr[attrGroup].length; i++) {
            refinedGroups[attrGroup][i] = {};
            var currElem = groupedByAttr[attrGroup][i];
            for(var j = 0; j < types.length; j++) {
                //var components = currElem[types[j]].split(/[^A-Za-z$\d]/);
                var components = currElem[types[j]].split(/[^A-Za-z$]/);
                var refinedVals = [];
                for(var x = 0; x < components.length; x++) {
                    var words = findAllWords(components[x].toLowerCase(), dict, 2);
                    if(words.length > 0 /*&& words[0].length >= 0.8 * components[x].length*/) {
                        var allowed = true;
                        if(words[0].length <= 2 && !hasWord(words[0], dict)) {
                            allowed = false;
                        }
                        if(allowed) {
                            refinedVals.push(words[0]);
                        }
                    }
                }
                var refinedStr = arrToStr(refinedVals, ",");
                refinedGroups[attrGroup][i][types[j]] = refinedStr;
            }              
        }
    }
    //console.log(refinedGroups);
    //return;
    
    var resObj = {};
    for(var attrGroup in refinedGroups) {
        var types = attrGroup.split(",");
        
        for(var t = 0; t < types.length; t++) {
            var typeValList = [];
            for(var g = 0; g < refinedGroups[attrGroup].length; g++) {
                typeValList.push(refinedGroups[attrGroup][g][types[t]]);
            }
            //console.log(typeValList);
            var lcssGroups = groupByLCSSWithSep(typeValList, 2, ",", "$"); // take this out to not pass through dollar signs unconditionally
            //console.log(lcssGroups);
            //console.log(lcssGroups);
            
            var lcssGroupCover = [];  
            for(var  j = 0; j < typeValList.length; j++) {
                lcssGroupCover.push(false);
            }
            
            // Do we have complete cover of typeValList?
            for(var j = 0; j < lcssGroups.length; j++) {
                for(var k = 0; k < lcssGroups[j].length; k++) {
                    lcssGroupCover[lcssGroups[j][k].ind] = true;
                }
            }
            var allCovered = true;
            var maxGroups = 4;
            for(var j = 0; j < lcssGroupCover.length; j++) {
                if(lcssGroupCover[j] == false || lcssGroups.length >= maxGroups) { // NOTE REMOVE THIS AND ANY NUMBER OF GROUPS IS ALLOWED
                    allCovered = false;
                    lcssGroups = [[]];
                    break;
                }
            }
            
            resObj[types[t]] = lcssGroups;
        }
    }
    
    //console.log(resObj);
    
    // And, FINALLY, create the selector
    var resArr = [];
    for(var attr in resObj) {
        var tempObj = {};
        tempObj[attr] = resObj[attr];
        resArr.push(tempObj);
    }
    resArr.sort(function(a, b) {
       return a[Object.keys(a)[0]].length -  b[Object.keys(b)[0]].length;
    });

    var finalArr = processForOverlap(resArr);
    //console.log(finalArr);
    
    for(var i = 0; i < finalArr.length; i++) {
        var chain = [];
        for(var key in finalArr[i]) {
            var wordList = [];
            for(var j = 0; j < finalArr[i][key].length; j++) {
                wordList = wordList.concat(_.uniq(finalArr[i][key][j].val.split(",")));
            }
            var groups = groupByLCSS(wordList, 2, false, "$");
            //console.log(groups);
            var chainWords = [];
            for(var j = 0; j < groups.length; j++) {
                //console.log(JSON.stringify(finalArr[i][key]) + "\n" + JSON.stringify(groups[j]) + "\n\n");
                if(groups[j].length == finalArr[i][key].length) {
                    //console.log(groups[j]);
                    chainWords.push(lcss(groups[j])[0]);
                }
            }
            finalArr[i][key] = chainWords;
        }
    }
    
    var selector = buildChains(finalArr, 1);
    return selector;
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
                        //console.log(unions[u][v]);
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
    //console.log(JSON.stringify(unions));
    
    var emptyChainInds = [];
    
    // Now let's take each component of these unions and make them into actual chains
    for(var i = 0; i < unions.length; i++) {
        for(var j = 0; j < unions[i].length; j++) {
            var chain = [];
            for(var prop in unions[i][j]) {
                //console.log(prop);
                for(var word in unions[i][j][prop]) {
                    if(unions[i][j][prop][word].length >= minPropLength) {
                        chain.push(createLink(prop, unions[i][j][prop][word]));
                    }
                }
            }
            //console.log(JSON.stringify(chain));
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
        interObj = {"inter": [unions[0], unions[1]]};
        var currObj = interObj;
        for(var i = 2; i < unions.length; i++) {
            currObj["inter"][1] = {"inter": [currObj["inter"][1], unions[i]]};
            currObj = currObj["inter"][1];
        }
    }
    
    //console.log(interObj);
    //yippyObj = interObj;
    console.log(JSON.stringify(interObj));
    
    return interObj;
}

function createLink(prop, val) {
     var obj = {};
    if(prop == "id" || prop == "class") {
        obj[prop + "-"] = "[+l]" + val;
    }
    else if(prop == "contents") {
        obj["contents-20"] = "[+l]" + val;
    }
    else {
        obj["prop-" + prop] = "[+l]" + val;
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
                        //console.log(currClusterIndeces[y] + ", " + newClusterIndeces[y]);
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
    
    //console.log(newGroups);
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

function buildJSON(elemGroups) {
    loadDict(); // gotta do this
    console.log("step1");
    console.log("psssst elem groups");
    console.log(elemGroups);
    var anchorGroups = groupByAnchor(elemGroups);
    //console.log("step2");
    console.log("pssssst anchor groups");
    console.log(anchorGroups);
    var pathGroups = collectPaths(anchorGroups);
    console.log("step3");
    console.log(pathGroups);
    var globalTypes = getGlobalTypes(elemGroups, anchorGroups);
    
    //console.log(pathGroups);
    
    console.log("step4");
    var selectors = {};
    for(var i = 0; i < globalTypes.length; i++) {
        var ind = -1;
        for(var x = 0; x < elemGroups.length; x++) {
            if(elemGroups[x].type == globalTypes[i]) {
                ind = x;
                break;
            }
        }
        var prof = profile(elemGroups[x].list);
        var selector = buildSelector(prof);
        if(typeof selector != "undefined") {
            selectors[globalTypes[i]] = selector;
        }
    }
    
    var selArr = [];
    for(var key in selectors) {
        selArr.push(selectors[key]);
    }
    //selArrGlob = selArr;
    
    if(selArr.length > 0) {
        var superObj = generateSuperSelector(selArr);
        var superElems = resolveSafe(superObj);
        console.log("SUPEROBJ");
        console.log(JSON.stringify(superObj));
        //console.log(superElems);
        
        var productionSelector = [{"desc":[superObj,{"name":"vs_container","vsid":"generate"}]}];
        
        if(superElems.length > 0) {
            // within each super element, attempt to find each thing by it's description.
            // if its description exists, but it isn't very good, try to use the path in concert with the description
            // if its description doesn't exist or its path + description doesn't get us anywhere, then use its path
            // if all these methods fail, give up
            
            var typeScores = {}; // lower score is better
            var finalizedSelectors = {};
            var unfinalized = [];
            for(var x = 0; x < globalTypes.length; x++) {
                var currType = globalTypes[x];
                //console.log(globalTypes[x]);
                if(currType in selectors) {
                    var resElems = resolveSafe({"desc":[selectors[currType],{"deep":true,"ctxt":superObj,"cascade":true}]});
            
                    //console.log(resElems);
                    var currUserList = [];
                    for(var y = 0; y < elemGroups.length; y++) {
                        if(elemGroups[y].type == currType) {
                            currUserList = elemGroups[y].list;
                            break;
                        }
                    }
                    //console.log(resElems);
                    var extraElems = _.difference(resElems, currUserList);
                    var missingElems = _.difference(currUserList, resElems);
                    console.log(currType + ":: extra: " + extraElems.length + ", missing: " + missingElems.length + "\n");
                    typeScores[currType] = extraElems.length + missingElems.length; // lower score is better
                    
                    if(typeScores[currType] < elemGroups[findInElemGroups(elemGroups, currType)].list.length * 0.2) {
                        finalizedSelectors[currType] = {"desc":[selectors[currType],{"deep":true,"ctxt":superObj,"cascade":true}]};
                        
                        var mand = everPresent(anchorGroups, currType);
                        var grab = getContentType(resElems);
                        var prod = {"desc":[selectors[currType],{"name":currType,"vsid":"generate","tag":true,"ctxt":{"ref":"vs_container"},"deep":true,"grab":grab,"mandatory":mand,"cascade":true}]};
                        productionSelector.push(prod);
                        
                        //productionSelectors.push({"desc":[selectors[currType],{"deep":true,"ctxt":superObj,"cascade":true}]});
                        console.log("FINALIZING: " + currType);
                        console.log(JSON.stringify(finalizedSelectors[currType]));
                        console.log("\n");
                    }
                    else {
                        console.log(currType + " is not ready to be finalized because its score is " + typeScores[currType]);
                        unfinalized.push(currType);
                    }
                }
            }
            
            /*var finalizedSelectors = {};
            var unfinalized = [];
            for(var type in typeScores) {
                if(typeScores[type] < elemGroups[findInElemGroups(elemGroups, type)].list.length * 0.2) {
                    finalizedSelectors[type] = {"desc":[selectors[type],{"deep":true,"ctxt":superObj,"cascade":true}]};
                    console.log("FINALIZING: " + type);
                    console.log(JSON.stringify(finalizedSelectors[type]));
                    console.log("\n");
                }
                else {
                    console.log(type + " is not ready to be finalized because its score is " + typeScores[type]);
                    unfinalized.push(type);
                }
            }*/
            
            var pathGroupsRefined = {};
            for(var key in finalizedSelectors) {
                if(key in pathGroups) { // TODO: path groups is presently missing the anchor // EDIT: Fixed
                    pathGroupsRefined[key] = pathGroups[key];
                }
            }
            
            var stillUnfinalized = [];
            for(var i = 0; i < unfinalized.length; i++) {
                var bestType = findBestPath(unfinalized[i], pathGroupsRefined);//findTypeWithShortestAvgPathToOtherType(unfinalized[i], pathGroupsRefined);
                console.log("the best way to get to " + unfinalized[i] + " is to go through " + bestType);
                var paths = pathGroupsRefined[bestType][unfinalized[i]];
                
                if(paths.length > 0) { 
                    console.log("THE PATHS ARE");
                    console.log(paths);
                    var baseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]};
                    var prodBaseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]};
                    //console.log(JSON.stringify(baseline));
                    
                    if(paths.length >= 2) {
                        //baseline = {"union": [baseline, "desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]]};
                        baseline = {"union":[baseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                        prodBaseline = {"union":[prodBaseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                        console.log(JSON.stringify(baseline));
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

                    var currUserList = elemGroups[findInElemGroups(elemGroups, unfinalized[i])].list;
                    console.log(currUserList);
                    var extraElems = _.difference(resElems, currUserList);
                    var missingElems = _.difference(currUserList, resElems);
                    console.log(unfinalized[i] + ":: extra: " + extraElems.length + ", missing: " + missingElems.length);
                    typeScores[unfinalized[i]] = extraElems.length + missingElems.length; // lower score is better
                    
                    if(typeScores[unfinalized[i]] < elemGroups[findInElemGroups(elemGroups, unfinalized[i])].list.length * 0.2) {
                        console.log("finalizing " + unfinalized[i] + " with score " + typeScores[unfinalized[i]]);
                        finalizedSelectors[unfinalized[i]] = newSelector;
                        
                        var mand = everPresent(anchorGroups, unfinalized[i]);
                        var grab = getContentType(resElems);
                        prodSelector = {"desc":[prodSelector, {"name":unfinalized[i],"grab":true,"mandatory":mand,"grab":grab}]};
                        productionSelector.push(prodSelector);
                        //console.log("PROD BASELINE");
                        //console.log(prodBaseline);
                        //console.log(JSON.stringify(prodBaseline));
                    }
                    else {
                        console.log(type + " is not ready to be finalized because its score is " + typeScores[unfinalized[i]]);
                        // These elements are not selectable by content, even though selectors were generated for them.  In one final effort, we will
                        // make an attempt exclusively by path, without regard for content, for these elements, as well as for the elements that do not have
                        // a content-based selector.
                    }
                }
                else {
                    console.log("umm.... well.... in spite of our best efforts");
                }
            }
            
            // Re-refine the path gruops to include any additional elements we just found
            for(var key in finalizedSelectors) {
                if(key in pathGroups) { 
                    pathGroupsRefined[key] = pathGroups[key];
                }
            }
            for(var i = 0; i < globalTypes.length; i++) {
                // for these, we haven't got a reliable selector
                if(!(globalTypes[i] in finalizedSelectors)) {
                    // what sort of results do we get just by applying the path?
                    var type = globalTypes[i];
                    var bestType = findBestPath(type, pathGroupsRefined);
                    if(bestType != null) {
                        console.log("the best way to get to " + type + " is to go through " + bestType);
                        var paths = pathGroupsRefined[bestType][type];
                        console.log(paths[0]);
                        
                        var baseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]};
                        var prodBaseline = {"desc":[{"chain":[{"nav-":paths[0]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]};
                        //console.log(JSON.stringify(baseline));
                        
                        if(paths.length >= 2) {
                            //baseline = {"union": [baseline, "desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]]};
                            baseline = {"union":[baseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                            prodBaseline = {"union":[prodBaseline, {"desc":[{"chain":[{"nav-":paths[1]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                            console.log(JSON.stringify(baseline));
                            for(var p = 2; p < paths.length; p++) {
                                baseline.union[1] = {"union":[baseline.union[1], {"desc":[{"chain":[{"nav-":paths[p]}]},{"ctxt":finalizedSelectors[bestType],"cascade":true}]}]};
                                prodBaseline.union[1] = {"union":[prodBaseline.union[1], {"desc":[{"chain":[{"nav-":paths[p]}]},{"ctxt":{"ref":bestType},"cascade":true,"vsid":"generate"}]}]};
                                if(p < paths.length - 1) {
                                    baseline = baseline.union[1];
                                }
                            }
                        }
                        
                        var resElems = resolveSafe(baseline);
                        console.log(resElems);
                        var currUserList = elemGroups[findInElemGroups(elemGroups, type)].list;
                        var extraElems = _.difference(resElems, currUserList);
                        var missingElems = _.difference(currUserList, resElems);
                        console.log(type + ":: extra: " + extraElems.length + ", missing: " + missingElems.length);
                        typeScores[type] = extraElems.length + missingElems.length; // lower score is better
                        
                        if(typeScores[type] < elemGroups[findInElemGroups(elemGroups, type)].list.length * 0.2) {
                            console.log("finalizing " + type + " with score " + typeScores[type]);
                            finalizedSelectors[type] = baseline;
                            
                            var mand = everPresent(anchorGroups, type);
                            var grab = getContentType(resElems);
                            var prodSelector = {"desc":[prodBaseline, {"name":type,"grab":true,"mandatory":mand,"grab":grab}]};
                            productionSelector.push(prodSelector);
                        }   
                    }
                    else {
                        console.log("NOTHING was available for this element.  No paths.  No selectors.  NOTHING.  Evaders, well done.")
                    }
                }
            }
            console.log(pathGroupsRefined);
        }
        else {
            alert("No superstructure could be identified.  Gonna go take a nap.");
        }
    }
    else {
        alert("OOPS");
    }
    
    console.log("PRODUCTION SELECTOR:");
    console.log(JSON.stringify(productionSelector));
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

function findBestPath(otherType, pathGroups) {
    var penalties = {};
    
    for(var type in pathGroups) {
        if(otherType in pathGroups[type]) {
            var penalty = 20 * pathGroups[type][otherType].length;
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

function generateSuperSelector(selArr) {
    var interObj = {"super": selArr[0]};
    if(selArr.length >= 2) {
        interObj = {"inter": [{"super": selArr[0]}, {"super": selArr[1]}]};
        var currObj = interObj;
        for(var i = 2; i < selArr.length; i++) {
            currObj["inter"][1] = {"inter": [currObj["inter"][1], {"super": selArr[i]}]};
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

/*function collectSuperStructure(elemLists, anchorGroups) {
    var globalTypes = [elemLists[0].type];
    
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
    
    var superStructure = findSuperStructure(elemLists[0].list); // CF0
    for(var i = 1; i < globalTypes.length; i++) {
        var ind = -1;
        for(var x = 0; x < elemLists.length; x++) {
            if(elemLists[x].type == globalTypes[i]) {
                ind = x;
                break;
            }
        }
        console.log(globalTypes[i] + ", " + ind);
        superStructure = _.intersection(superStructure, findSuperStructure20(elemLists[ind].list));
    }
    
    return [superStructure, globalTypes];
}*/

function loadDict() {
    if(typeof dict == "undefined") {
        dict = buildDictionary(vs_dict);
        addWord("pm", dict);
        addWord("$", dict);
        addWord("$0", dict);
        addWord("$1", dict);
        addWord("$2", dict);
        addWord("$3", dict);
        addWord("$4", dict);
        addWord("$5", dict);
        addWord("$6", dict);
        addWord("$7", dict);
        addWord("$8", dict);
        addWord("$9", dict);
    }
}

function findSuperStructure20(elems) {
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
                if(superStructure.indexOf(prevElem[0]) < 0) {
                    superStructure.push(prevElem[0]);   
                }
                break;
            }
            prevElem = currElem;
            currElem = $(currElem).parent();
        }
    }
    
    return superStructure;
}

function evalStep1(panel) {
    var sel = vs_smart.getSelected().slice();
    
    panel.html("");
    for(var i = 0; i < sel.length; i++) {
        var textNode = $(sel[i]).text();
        if(textNode.length == 0) {
            textNode = sel[i].outerHTML.replace("<", "&lt").replace(">", "&gt").substr(0, 10) + "...";
        }
        var prompt = $("<p>What is " + textNode + "? <input type='text' class='vs_type_name'/></p>");
        panel.append(prompt);
    }
    var button = $("<button type='button' class='btn btn-success'>Submit</button></div>");
    button.click(function() {
       evalStep2(panel, sel); 
    });
    panel.append(button);
}

function evalStep2(panel, origSel) {
    var inputs = $(".vs_type_name");
    var names = [];
    
    for(var i = 0; i < inputs.length; i++) {
        names.push($(inputs[i]).val());
    }
    
    vs_smart.clearSelected();
    panel.html("<p>Please select another set of the same elements.</p>");
    var button = $("<button type='button' class='btn btn-success'>Done</button></div>");
    button.click(function() {
       evalStep3(panel, origSel, names); 
    });
    panel.append(button);
}

function evalStep3(panel, origSel, names) {    
    var sel = vs_smart.getSelected().slice();
    panel.html("");
    for(var i = 0; i < sel.length; i++) {
        var textNode = $(sel[i]).text();
        if(textNode.length == 0) {
            textNode = sel[i].outerHTML.replace("<", "&lt").replace(">", "&gt").substr(0, 10) + "...";
        }
        var selectBox = generateSelect(names);
        selectBox.addClass('vs_type_name');
        var prompt = $("<p>What is " + textNode + "? <span class='selHolder'></span></p>");
        prompt.find('.selHolder').append(selectBox);
        panel.append(prompt);
    }
    var button = $("<button type='button' class='btn btn-success'>Submit</button></div>");
    button.click(function() {
       evalStep4(panel, origSel, names, sel); 
    });
    panel.append(button);
}

function evalStep4(panel, origSel, origNames, newSel) {    
    var newNameList = $(".vs_type_name");
    var newNames = [];
    for(var i = 0; i < newNameList.length; i++) {
        newNames.push($(newNameList[i]).val());
    }
    
    var selObj1 = {};
    var selObj2 = {};    
    for(var i = 0; i < origSel.length; i++) {
        selObj1[origNames[i]] = origSel[i];
        selObj2[newNames[i]] = newSel[i];
    }
    
    var reachable = {};
    
    for(var key1 in selObj1) {
        for(var key2 in selObj2) {
            if(key1 != key2) {
                var path = arrToStr(bfs(selObj1[key1], selObj1[key2]));
                var newElem = findElement([{"nav-": path}], [selObj2[key1]]);
                if(newElem.length == 1 && newElem[0] == selObj2[key2]) {
                    if(!(key1 in reachable)) {
                        reachable[key1] = {};
                    }
                    reachable[key1][key2] = path;
                    //console.log("hoorah");
                }
            }
        }
    }
    
    //console.log("reachable");
    //console.log(reachable);
    
    var navArr = [];
    for(var key in reachable) {
        var obj = {};
        obj[key] = reachable[key];
        navArr.push(obj);
    }
    navArr = navArr.sort(function(a, b) {
        Object.keys(b).length - Object.keys(a).length; 
    });
    
    evalStep5(panel, navArr, 0)
}

function evalStep5(panel, navArr, ind) {
    console.log(navArr);
    
    vs_smart.clearSelected();
    panel.html("<div>Please select all " + Object.keys(navArr[0])[0] + "'s on the page.</div>");
    
    var button = $("<button type='button' class='btn btn-success'>Done</button></div>");
    button.click(function() {
       evalStep6(panel, navArr, ind); 
    });
    panel.append(button);
}

function evalStep6(panel, navArr, ind) {
    var currType = Object.keys(navArr[ind]);
    var sel = vs_smart.getSelected().slice();
    //console.log("ALL " + currType + "'s:");
    //console.log(sel);
    console.log(navArr);
    
    /*dict = buildDictionary(vs_dict);
    addWord("pm", dict);
    addWord("$", dict);
    addWord("$0", dict);
    addWord("$1", dict);
    addWord("$2", dict);
    addWord("$3", dict);
    addWord("$4", dict);
    addWord("$5", dict);
    addWord("$6", dict);
    addWord("$7", dict);
    addWord("$8", dict);
    addWord("$9", dict);
    var prof = profile(sel);
    var selector = buildSelector(prof);
    
    
    console.log(JSON.stringify(selector));*/
}