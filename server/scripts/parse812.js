var sets = {};
var collectiveArr = [];
var collective = {};
var labels = {"mandatory-labels":[], "data-labels": []};

function processJSON(jsonArr) {
    for(var i = 0; i < jsonArr.length; i++) {
        //console.log("evaulating " + JSON.stringify(jsonArr[i]));
        resolve(jsonArr[i]);
    }
    
    var refinedCollective = {};
    
    for(var item in collective) {
        var curr = collective[item];    
        //console.log(Object.keys(collective[item]));
        // Does this item have all the necessary keys
        var hasAllKeys = true;
        for(var m = 0; m < labels["mandatory-labels"].length; m++) {
            var currKey = Object.keys(labels["mandatory-labels"][m])[0];
            if(!(currKey in collective[item])) {
                //console.log("lacking label " + currKey);
                hasAllKeys = false;
                break;
            }
        }
        if(hasAllKeys) {
            refinedCollective[item] = collective[item];
        }
    }
    
    var keys = Object.keys(refinedCollective);
    for(var i = 0; i < keys.length; i++) {
        collectiveArr.push(refinedCollective[keys[i]]);
        collectiveArr[i]["vsid"] = keys[i];
    }
    
    collectiveArr = collectiveArr.sort(function(a, b) {
        return a.index - b.index;
    });
}

function EvalSetOp(obj, params) {
    //console.log("evaluating a set op");
    var op = Object.keys(obj)[0];
    var val = obj[op];
    
    var set1 = val[0];
    var set2 = val[1];
    
    alert(JSON.stringify(set1));
    alert(JSON.stringify(set2));
    
    val[0] = resolve(set1, params);
    val[1] = resolve(set2, params);
    set1 = val[0];
    set2 = val[1];
    
    if(op == "union") {
        return _.union(set1, set2);
    }
    else if(op == "inter") {
        return _.intersection(set1, set2);
    }
    else if(op == "diff") {
        return _.difference(set1, set2);
    }
}

function EvalUniOp(obj, params) {
    //console.log("evaluating a uni op");
    var op = Object.keys(obj)[0];
    var val = obj[op];
    
    obj[op] = resolve(val, params);
    obj[op] = findSuperStructure(obj[op], false);
    
    return obj[op];
}

function EvalChain(obj, params) {
    //console.log("evaluating a chain");
    var chain = obj.chain;
    for(var i = 0; i < chain.length; i++) {
        var key = Object.keys(chain[i])[0];
        var val = chain[i][key];
        if(typeof val == "object") {
            chain[i][key] = resolve(val, {});
        }
    }
    
    elements = [];
    if("cascade" in params && params["cascade"] == true) {
        var context = resolve(params["ctxt"]);
        for(var i = 0; i < context.length; i++) {
            var subElements = findElement(chain, [context[i]], params["deep"]);
            for(var x = 0; x < subElements.length; x++) {
                if($(context[i]).attr("vsid") != "undefined") {
                    $(subElements[x]).attr("vsid", $(context[i]).attr("vsid"));
                    $(subElements[x]).addClass("vsid");
                }
            }
            elements = elements.concat(subElements);
        }
    }
    else {
        elements = findElement(chain, resolve(params["ctxt"]), params["deep"]);
    }
    
    return elements;
}

function EvalDesc(obj) {
    //console.log("evaluating a desc");
    var desc = obj.desc[0];
    var params = obj.desc[1];
    
    var val = null;
    if(Object.keys(params).length > 0) {
        val = resolve(desc, params);
        
        if("name" in params) {
            sets[params.name] = val;
        }
    }
    else {
        val = resolve(desc);
    }
    
    if("vsid" in params && params["vsid"] == "generate") {
        if(("cascade" in params && params["cascade" == false]) || !("cascade" in params)) {
            for(var i = 0; i < val.length; i++) {
                var id = randomString(20);
                $(val[i]).attr("vsid", id);
                $(val[i]).addClass("vsid");
            }
        }
    } 
    if("tag" in params && params["tag"] == true && "name" in params && params["name"].length > 0) {
        for(var i = 0; i < val.length; i++) {
            $(val[i]).addClass(params["name"]);
        }
    }
    
    if("grab" in params && "name" in params && "vsid" in params) {
        var types = params["grab"].split(",");
        
        var obj = {};
        obj[params["name"]] = types;
        if(params["mandatory"] == true) {
            labels["mandatory-labels"].push(obj);
        }
        else {
            labels["data-labels"].push(obj);
        }
        
        var currInd = 0;
        for(var i = 0; i < val.length; i++) {
            var vsid = $(val[i]).attr("vsid");
            /*if(typeof $(val[i]).attr("vsuid") == "undefined") {
                $(val[i]).attr("vsuid") = randomString(20);
            }
            var vsuid = $(val[i]).attr("vsuid");*/
            
            if(!(vsid in collective)) {
                collective[vsid] = {"index":currInd++};
            }
            
            if(typeof collective[vsid][params["name"]] == "undefined") {
                collective[vsid][params["name"]] = {};
            }
            
            for(var x = 0; x < types.length; x++) {
                if(typeof collective[vsid][params["name"]][types[x]] == "undefined") {
                    collective[vsid][params["name"]][types[x]] = [];
                }
                
                if(types[x] == "text") {
                    collective[vsid][params["name"]][types[x]].push($(val[i]).text());  
                }
                else {
                    if(typeof $(val[i]).attr(types[x]) != "undefined") {
                        collective[vsid][params["name"]][types[x]].push($(val[i]).attr(types[x]));
                    }
                } 
            }
        }
        
        /*var keys = Object.keys(collective);
        collectiveArr = new Array(keys.length);
        
        for(var i = 0; i < keys.length; i++) {
            var index = collective[keys[i]]["index"];
            collectiveArr[index] = {};
            collectiveArr[index] = collective[keys[i]];
            collectiveArr[index]["vsid"] = keys[i];
        }*/
    }
    
    return val;
}

function EvalRef(obj) {
    //console.log("evaluating a ref");
    var refName = obj.ref;
    return sets[refName];
}

function resolve(obj, params) {
    //console.log("Resolving");
    if(typeof obj == "undefined") {
        console.log("Type of obj is undefined");
        return obj;
    }
    
    var keys = Object.keys(obj);
    var type = keys[0];
    
    var res = null;
    
    //console.log("RESOLVING: " + type);
    
    if(type == "chain") {
        res = EvalChain(obj, params);
    }
    else if(type == "desc") {
        res = EvalDesc(obj, params);
    }
    else if(type == "ref") {
        res = EvalRef(obj);
    }
    else if(type == "super") {
        res = EvalUniOp(obj, params);
    }
    else if(type == "union" || type == "inter" || type == "diff") {
        res = EvalSetOp(obj, params);
    }
    //console.log(res);
    return res;
}

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