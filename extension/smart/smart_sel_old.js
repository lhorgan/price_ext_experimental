function bfs(a, b) {
    $(a).addClass("vs_seen");
    var q = [a];
    
    var found = false;
    
    while(q.length > 0) {
        var curr = q.shift();
        if(curr == b) {
            //console.log("aha!");
            //console.log(curr);
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
    
    console.log(attrList);
    return attrList;
}

function buildSelector(attrList) {
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
    
    //console.log(groupedByAttr);
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
                    var words = findAllWords(components[x].toLowerCase(), dict);
                    if(words.length > 0 && words[0].length >= 0.8 * components[x].length) {
                        refinedVals.push(words[0]);
                    }
                }
                var refinedStr = arrToStr(refinedVals, ",");
                refinedGroups[attrGroup][i][types[j]] = refinedStr;
            }              
        }
    }
    console.log(refinedGroups);

    var resObj = {};
    for(var attrGroup in refinedGroups) {
        var types = attrGroup.split(",");
        
        for(var t = 0; t < types.length; t++) {
            var typeValList = [];
            for(var g = 0; g < refinedGroups[attrGroup].length; g++) {
                typeValList.push(refinedGroups[attrGroup][g][types[t]]);
            }
            //console.log(typeValList);
            console.log(typeValList);
            var lcssGroups = groupByLCSSWithSep(typeValList, 2, ",", "$"); // take this out to not pass through dollar signs unconditionally
            console.log(lcssGroups);
            //console.log(lcssGroups);
            resObj[types[t]] = lcssGroups;
        }
    }
    
    console.log(resObj);
    
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
                        console.log(unions[u][v]);
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
            chain = {"chain": chain};
            unions[i][j] = chain;
            if(chain.length == 0) {
                emptyChainInds.push([i, j]);
            }
        }
    }
    return;
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
    console.log(unions);
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
        obj[prop + "-"] = "+" + val;
    }
    else if(prop == "contents") {
        obj["contents-20"] = "+" + val;
    }
    else {
        obj["prop-"] = "+" + val;
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
    console.log("ALL " + currType + "'s:");
    console.log(sel);
    
    dict = buildDictionary(vs_dict);
    addWord("pm", dict);
    var prof = profile(sel);
    var selector = buildSelector(prof);
}