function EvalSetOp_M(data, copy) {
    //console.log("evaluating a set op");
    var op = Object.keys(data.obj)[0];
    var val = data.obj[op];
    
    var set1 = val[0];
    var set2 = val[1];
    var set1Data = {"obj":set1, "parent":data.obj, "params":data.params};
    var set2Data = {"obj":set2, "parent":data.obj, "params":data.params};
    
    var newObj = [{}, {}];
    copy[op] = newObj;
    resolveSafe_M(set1Data, newObj[0]);
    resolveSafe_M(set2Data, newObj[1]);
}

function EvalUniOp_M(data, copy) {
    //console.log("evaluating a uni op");
    var op = Object.keys(data.obj)[0];
    var val = data.obj[op];
    
    var newData = {"obj":val, "parent":data.obj, "params":data.params}
    
    var newObj = {};
    copy[op] = newObj;
    resolveSafe_M(newData, newObj);
}

function EvalChain_M(data, copy) {    
    //console.log("evaluating a chain");
    var chain = data.obj.chain;
    
    copy["chain"] = {};
    
    /*for(var i = 0; i < chain.length; i++) {
        var key = Object.keys(chain[i])[0];
        var val = chain[i][key];
        if(typeof val == "object") {
            var newData = {"obj":val, "parent":data.obj, "params":{}};
            resolveSafe_M(newData);
        }
    }*/
}

function EvalDesc_M(data, copy) {
    //console.log("evaluating a desc");
    var desc = data.obj.desc[0];
    var params = data.obj.desc[1];
    
    var newObj = {};
    copy["desc"] = newObj;
    
    if(Object.keys(data.params).length > 0) {
        var newData = {"obj":desc, "parent":data.obj, "params":data.params};
        resolveSafe_M(newData, newObj);
    }
    else {
        var newData = {"obj":desc, "parent":data.obj};
        resolveSafe_M(newData, newObj);
    }
}

function EvalRef_M(data, copy) {
    //console.log("evaluating a ref");
    var newData = {"obj":data.obj.ref, "parent":data.obj};
    
    copy["ref"] = {};
}

function resolveSafe_M(data, copy) {
    //console.log("resolving safely");
    if(typeof data.params == "object") {
        resolve_M({"obj":JSON.parse(JSON.stringify(data.obj)), "parent":JSON.parse(JSON.stringify(data.parent)), "params":JSON.parse(JSON.stringify(data.params))}, copy);
    }
    else {
        resolve_M({"obj":JSON.parse(JSON.stringify(data.obj)), "parent":JSON.parse(JSON.stringify(data.parent))}, copy);
    }
}

function resolve_M(data, copy) {
    //console.log("Resolving " + JSON.stringify(data.obj));
    //console.log("PARENT: " + JSON.stringify(data.parent) + "\n\n");
    if(typeof data.obj == "undefined") {
        //console.log("Type of obj is undefined");
    }
    
    var keys = Object.keys(data.obj);
    var type = keys[0];
    
    if(typeof(data.params) == "undefined") {
        data.params = {};
    }
    
    if(type == "chain") {
        EvalChain_M(data, copy);
    }
    else if(type == "desc") {
        EvalDesc_M(data, copy);
    }
    else if(type == "ref") {
        EvalRef_M(data, copy);
    }
    else if(type == "super") {
        EvalUniOp_M(data, copy);
    }
    else if(type == "union" || type == "inter" || type == "sinter" || type == "diff") {
        EvalSetOp_M(data, copy);
    }
}

function structuralCopy(json) {
    var copyJSON = {};
    resolveSafe_M({"obj": json, "parent": {}}, copyJSON);
    //console.log(JSON.stringify(copyJSON));
    return copyJSON;
}

/**************************************************************************************************/

function EvalSetOp_C(data, chains) {
    //console.log("evaluating a set op");
    var op = Object.keys(data.obj)[0];
    var val = data.obj[op];
    
    var set1 = val[0];
    var set2 = val[1];
    var set1Data = {"obj":set1, "parent":data.obj, "params":data.params};
    var set2Data = {"obj":set2, "parent":data.obj, "params":data.params};
    
    //console.log("caller Nicole");
    resolve_C(set1Data, chains);
    //console.log("caller Dan");
    resolve_C(set2Data, chains);
}

function EvalUniOp_C(data, chains) {
    //console.log("evaluating a uni op");
    var op = Object.keys(data.obj)[0];
    var val = data.obj[op];
    
    var newData = {"obj":val, "parent":data.obj, "params":data.params};
    //console.log("caller Marc");
    resolve_C(newData, chains);
}

function EvalChain_C(data, chains) {    
    //console.log("evaluating a chain");
    var chain = data.obj.chain;
    chains.push(chain);
    /*for(var i = 0; i < chain.length; i++) {
        var key = Object.keys(chain[i])[0];
        var val = chain[i][key];
        if(typeof val == "object") {
            var newData = {"obj":val, "parent":data.obj, "params":{}};
            resolve_C(newData);
        }
    }*/
}

function EvalDesc_C(data, chains) {
    //console.log("evaluating a desc");
    var desc = data.obj.desc[0];
    var params = data.obj.desc[1];
    
    if(Object.keys(data.params).length > 0) {
        var newData = {"obj":desc, "parent":data.obj, "params":data.params};
        //console.log("caller Adam");
        resolve_C(newData, chains);
    }
    else {
        var newData = {"obj":desc, "parent":data.obj};
        //console.log("caller Eli");
        resolve_C(newData, chains);
    }
}

function EvalRef_C(data, chains) {
    //console.log("evaluating a ref");
    var newData = {"obj":data.obj.ref, "parent":data.obj};
}

function resolveSafe_C(data, chains) {
    //console.log("resolving safely");
    if(typeof data.params == "object") {
        //console.log("caller Ari");
        resolve_C({"obj":JSON.parse(JSON.stringify(data.obj)), "parent":JSON.parse(JSON.stringify(data.parent)), "params":JSON.parse(JSON.stringify(data.params))}, chains);
    }
    else {
        //console.log("caller Walley");
        resolve_C({"obj":JSON.parse(JSON.stringify(data.obj)), "parent":JSON.parse(JSON.stringify(data.parent))}, chains);
    }
}

function resolve_C(data, chains) {
    //console.log("Resolving " + JSON.stringify(data.obj));
    //console.log("PARENT: " + JSON.stringify(data.parent) + "\n\n");
    if(typeof data.obj == "undefined") {
        //console.log("Type of obj is undefined");
    }
    
    var keys = Object.keys(data.obj);
    var type = keys[0];
    
    if(typeof(data.params) == "undefined") {
        data.params = {};
    }
    
    if(type == "chain") {
        EvalChain_C(data, chains);
    }
    else if(type == "desc") {
        EvalDesc_C(data, chains);
    }
    else if(type == "ref") {
        EvalRef_C(data, chains);
    }
    else if(type == "super") {
        EvalUniOp_C(data, chains);
    }
    else if(type == "union" || type == "inter" || type == "sinter" || type == "diff") {
        EvalSetOp_C(data, chains);
    }
}

function collectChains(json) {
    var chains = [];
    //console.log("caller Shifu");
    resolve_C({"obj":json, "parent":{}}, chains);
    return chains;
}

/***********************************************************************/

function mergeMain(arr1, arr2) { 
    var jsonArr1 = JSON.parse(JSON.stringify(arr1));
    var jsonArr2 = JSON.parse(JSON.stringify(arr2));
    
    var matchList = [];
    for(var i = 0; i < jsonArr2.length; i++) {
        matchList.push([]);
        var struct1 = structuralCopy(jsonArr2[i]);
        for(var j = 0; j < jsonArr1.length; j++) {
            var struct2 = structuralCopy(jsonArr1[j]);
            //console.log(JSON.stringify(struct1) + " :::: " + JSON.stringify(struct2));
            if(JSON.stringify(struct1) == JSON.stringify(struct2)) {
                matchList[matchList.length - 1].push(j);
            }
        }
    }
    //console.log(matchList);
    
    var bestMatches = [];
    for(var m = 0; m < matchList.length; m++) {
        var chains1 = collectChains(jsonArr2[m]);
        var bestAvg = 0;
        var bestInd = -1;
        for(var n = 0; n < matchList[m].length; n++) {
            var chains2Curr = collectChains(jsonArr1[matchList[m][n]]);
            var avgLength = 0;
            for(var i = 0; i < chains1.length; i++) {
                var testChain = mergeChains(chains1[i], chains2Curr[i]);
                avgLength += testChain.length;
            }
            avgLength /= chains1.length;
            if(avgLength > bestAvg) {
                bestAvg = avgLength;
                bestInd = matchList[m][n]; // index in jsonArr1
            }   
        }
        //console.log("BEST IND FOR " + m + " IS " + bestInd);
        bestMatches.push(bestInd);
    }
    
    var jsonArr1UsedInds = [];
    for(var m = 0; m < bestMatches.length; m++) {
        if(bestMatches[m] >= 0) {
            var chains1 = collectChains(jsonArr2[m]);
            var chains2 = collectChains(jsonArr1[bestMatches[m]]);
            jsonArr1UsedInds.push(bestMatches[m]);
            
            for(var i = 0; i < chains1.length; i++) {
                var newChain = mergeChains(chains1[i], chains2[i]);
                while(chains1[i].length > 0) {
                    chains1[i].pop();
                }
                for(var j = 0; j < newChain.length; j++) {
                    chains1[i].push(newChain[j]);
                }
            }
        }
        else {
            //jsonArr2.push(jsonArr1[m]);
        }
    }
    
    for(var i = 0; i < jsonArr1.length; i++) {
        if(jsonArr1UsedInds.indexOf(i) < 0) {
            jsonArr2.push(jsonArr1[i]);
        }
    }
    
    return jsonArr2;
}

function mergeChains(chain1, chain2) {
    var bestMatchScores = [];
    for(var i = 0; i < chain1.length; i++) {
        bestMatchScores.push([]);
        var link1 = parseLink(chain1[i]);
        
        for(var j = 0; j < chain2.length; j++) {
            var scoreObj = {"index": j, "score": 0};
            //console.log("parsing link 295");
            var link2 = parseLink(chain2[j]);
            var score = 0;
            if(link1.type == link2.type) {
                switch(link1.type) {
                    case "id":
                    case "class":
                    case "prop":
                    case "contents":
                        var lcssStr = lcss([link1.val, link2.val])[0];
                        //console.log("LCSS: " + lcssStr);
                        scoreObj.score += Math.min(lcssStr.length, 5);
                        var newOp = link1.op;
                        if(link2.op.length > link1.op.length) {
                            newOp = link2.op;
                        }
                        else if(link2.op == "+" && link1.op.length == link2.op.length) {
                            newOp = "+";
                        }
                        if(lcssStr.length >= 0.5 * ((link1.val.length + link2.val.length) / 2)) {
                            scoreObj["link"] = {"type": link2.type, "meta": link2.meta, "op": newOp, "val": lcssStr};
                        }
                        break;
                    case "tag":
                    case "parent":
                    case "child":
                    case "sibling":
                    case "nav":
                    case "left":
                    case "right":
                    case "above":
                    case "below":
                    case "distance":
                    case "visibility":
                    case "deepest":
                        if(link1.val == link2.val) {
                            scoreObj.score += 5;
                            scoreObj["link"] = link1;
                        }
                        break;
                    default:
                        console.log("UNRECOGNIZED TYPE " + link1.type);
                }
            }
            if("link" in scoreObj) {
                bestMatchScores[i].push(scoreObj);
            }
        }
        bestMatchScores[i].sort(function(a, b) {
           return b.score - a.score; 
        });
    }
    
    bestMatchScores.sort(function(a, b) {
        if(a.length > 0 && b.length > 0) {
            return b[0].score - a[0].score;
        }
        else {
            return b.length - a.length;
        }
    });
    
    var used = [];
    
    //console.log(bestMatchScores);
    
    var newChain = [];
    for(var i = 0; i < bestMatchScores.length; i++) {
        if(bestMatchScores[i].length > 0 /*&& used.indexOf(bestMatchScores[i][0].index) < 0*/) { 
            //console.log(bestMatchScores[i][0]);
            var linkObj = bestMatchScores[i][0].link;
            //console.log(JSON.stringify(linkObj));
            var newLink = {};
            newLink[linkObj.type + "-" + linkObj.meta] = linkObj.op + linkObj.val;
            newChain.push(newLink);
        }
    }
    
    // CONTENTS SECOND!!!
    var contentsArr = [];
    var deepestArr = [];
    var otherArr = [];
    for(var x = 0; x < newChain.length; x++) {
        if(Object.keys(newChain[x])[0].indexOf("contents-") >= 0) {
            contentsArr.push(newChain[x]);
        }
        else if(Object.keys(newChain[x])[0].indexOf("deepest-") >= 0) {
            deepestArr.push(newChain[x]);
        }
        else {
            otherArr.push(newChain[x]);
        }
    }
    newChain = otherArr.concat(contentsArr).concat(deepestArr);
    
    //console.log("NEW CHAIN: " + JSON.stringify(newChain));
    return newChain;
}

function parseLink(link) {
    //console.log("LINK IS " + JSON.stringify(link));
    
    var chainComps = {};
    var fullKey = Object.keys(link)[0];
    var dashInd = fullKey.indexOf("-");
    var type = fullKey.substr(0, dashInd);
    var meta = fullKey.substr(dashInd + 1);
    
    var val = link[fullKey];
    var textTypes = ["id", "class", "prop", "contents", "tag", "distance"];
    var op = "";
    
    if(textTypes.indexOf(type) >= 0) {
        op = val[0];

        if(op == "[") {
            var closeIndex = val.indexOf("]");
            op = val.substr(0, closeIndex + 1);
            val = val.substr(closeIndex + 1);
        }
        else {
            val = val.substr(1);
        }
    }
    
    return {"type": type, "meta": meta, "op": op, "val": val};
}