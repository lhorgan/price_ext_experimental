function buildSelector2(elemList) {
    var elems = generateNormalizations(elemList); 
    for(var i = 0; i < elems.length; i++) {
        elemList[i] = elems[i];
    }
    var prof = profile(elems);

    var allTypes = {};
    for(var i = 0; i < prof.length; i++) {
        for(var type in prof[i]) {
            allTypes[type] = true;
        }
    }
    
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
            
            var maxLen = 0;
            if(type == "contents") {
                for(var v = 0; v < vals.length; v++) {
                    if(vals[i].length > maxLen) {
                        maxLen = vals[i].length;
                    }
                }
            }
            
            var uniqueSubstrings = lcssUnique(vals);
            for(var x = 0; x < lcssUnique.length; x++) {
                if(uniqueSubstrings[x].length >= 1) {
                    chainVals.push(createLink(type, uniqueSubstrings[x].trim(), maxLen * 3));
                }
            }
        }
        if(chainVals.length > 0) {
            chainVals.push({"visibility-":"visible"});
            unions.push({"chain": chainVals});
            if(covered.length >= 0.9 * elemList.length) {
                break;
            }
        }
    }
    
    /** CONTENTS MUST ALWAYS COME OUT SECOND **/
    for(var i = 0; i < unions.length; i++) {
        unions[i].chain.sort(function(a, b) {
            if(Object.keys(a)[0].indexOf("contents-") >= 0 || Object.keys(b)[0].indexOf("contents-") >= 0) {
                return -1;
            }
            return 0;
        });
    }
    
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
    var normalizationAnchors = [];
    var anchoredIn = [];
    
    for(var i = 0; i < elems.length; i++) {
        var levels = getAllLevelsWithSameContent(elems[i]);
        levels.push(elems[i]);
        
        var bestMatches = [];
        for(var l = 0; l < levels.length; l++) {    
            var currProf = uniProf(levels[l]);
            currProf["tag"] = $(levels[l]).prop("tagName");
            bestMatches.push({"index":-1, "score":0, "elementIndex":l});

            for(var j = 0; j < normalizationAnchors.length; j++) {
                var currScore = 0;
                var anchor = normalizationAnchors[j].anchor;

                if(anchor["tag"] == currProf["tag"]) {
                    for(var prop in currProf) {
                        if(prop in anchor && prop != "contents" && prop != "tag") {
                            var lcssArr = lcssUnique([currProf[prop], anchor[prop]]);

                            if(lcssArr.length > 0 && lcssArr[0].length >= 3) {
                                currScore += lcssArr[0].length;
                            }
                        }
                    }
                }

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
    
    for(var i = 0; i < normalizationAnchors.length; i++) {
        var subElems = [];
        for(var j = 0; j < normalizationAnchors[i].elements.length; j++) {
            subElems.push(normalizationAnchors[i].elements[j].element);
        }
        var typeObj = quickProcess(subElems);
        delete typeObj["contents"];
        normalizationAnchors[i]["types"] = typeObj;
    }
    
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

function quickProcess(elemList) {
    elems = profile(elemList);
    
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
    var curr = $(elem);
    var origText = $(elem).text().trim().toLowerCase();
    
    var levels = [];
    
    while(curr.parent().length > 0 && curr.parent().text().trim().toLowerCase() == origText) {
        levels.push(curr.parent()[0]);
        curr = curr.parent();
    }
    
    var child = $(elem).find("*").filter(function() {
       return $(this).text().trim().toLowerCase() == origText; 
    });

    for(var i = 0; i < child.length; i++) {
        levels.push(child[i]);
    }
    
    return levels;
}

function uniProf(elem) {
    var elemObj = {};
    var atts = elem.attributes;
    for(var j = 0; j < atts.length; j++) {
        elemObj[atts[j].nodeName] = atts[j].nodeValue.toLowerCase();
    }
    if($(elem).text().length > 0) {
        elemObj["contents"] = $(elem).text().trim().toLowerCase();
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