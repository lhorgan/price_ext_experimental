var sets = {};
var collectiveArr = [];
var collective = {};
var labels = {"mandatory-labels":[], "data-labels": []};

function resetGlobals() {
    sets = {};
    collectiveArr = [];
    collective = {};
    labels = {"mandatory-labels":[], "data-labels": []};
}

function processJSON(jsonArr) {
    resetGlobals();
    var resolveRes = [];
    for(var i = 0; i < jsonArr.length; i++) {
        //console.log("evaulating " + JSON.stringify(jsonArr[i]));
        resolveRes.push(resolve(jsonArr[i]));
    }
    
    //console.log("COLLECTIVE IS: ");
    //console.log(JSON.parse(JSON.stringify(collective)));
    
    var refinedCollective = refineCollective();
    
    var keys = Object.keys(refinedCollective);
    for(var i = 0; i < keys.length; i++) {
        var copy = {};
        var orig = refinedCollective[keys[i]];
        
        for(var key in orig) {
            if(key != "index") {
                copy[key] = {};
                for(var type in orig[key]) {
                    if(type != "element") {
                        copy[key][type] = orig[key][type];
                    }
                }
            }
            else {
                copy[key] = orig[key];
            }
        }
        
        collectiveArr.push(copy);
        collectiveArr[i]["vsid"] = keys[i];
    }
    
    collectiveArr = collectiveArr.sort(function(a, b) {
        return a.index - b.index;
    });
    
    //console.log(collectiveArr);
    
    return resolveRes;
}

function EvalSetOp(obj, params) {
    //console.log("evaluating a set op");
    //console.log(JSON.stringify(obj));
    var op = Object.keys(obj)[0];
    var val = obj[op];
    
    var set1 = val[0];
    var set2 = val[1];
    
    //alert(JSON.stringify(set1));
    //alert(JSON.stringify(set2));
    
    val[0] = resolve(set1, params);
    val[1] = resolve(set2, params);
    set1 = val[0];
    set2 = val[1];
    
    //console.log("from setop");
    //console.log(set1);
    //console.log(set2);
    if(op == "union") {
        return _.union(set1, set2);
    }
    else if(op == "inter") {
        return _.intersection(set1, set2);
    }
    else if(op == "sinter") {
        return smartInter(set1, set2);
    }
    else if(op == "diff") {
        return _.difference(set1, set2);
    }
}

function EvalUniOp(obj, params) {
    //console.log("evaluating a uni op");
    //console.log(JSON.stringify(obj));
    var op = Object.keys(obj)[0];
    var val = obj[op];
    
    obj[op] = resolve(val, params);
    obj[op] = findSuperStructure(obj[op], false);
    
    //console.log("from uniop");
    //console.log(obj);
    return obj[op];
}

function EvalChain(obj, params) {
    //console.log("evaluating a chain");
    //console.log(JSON.stringify(obj));
    var chain = obj.chain;
    for(var i = 0; i < chain.length; i++) {
        var key = Object.keys(chain[i])[0];
        var val = chain[i][key];
        if(typeof val == "object") {
            chain[i][key] = resolve(val, {});
        }
    }
    
    var elements = [];
    if("cascade" in params && params["cascade"] == true) {
        //console.log("HELLO HELLO CASCADE CASCADE");
        var context = resolveSafe(params["ctxt"]);
        //console.log("context is: ");
        //console.log(context);
        for(var i = 0; i < context.length; i++) {
            //console.log(context[i]);
            var subElements = findElement(chain, [context[i]], params["deep"]);
            for(var x = 0; x < subElements.length; x++) {
                if(typeof $(context[i]).attr("vsid") != "undefined") {
                    //console.log("adding vsid: " + $(context[i]).attr("vsid"));
                    $(subElements[x]).attr("vsid", $(context[i]).attr("vsid"));
                    $(subElements[x]).addClass("vsid");
                }
            }
            elements = elements.concat(subElements);
        }
    }
    else {
        //console.log("I WONDER WHY WE ARE IN HERE");
        if("ctxt" in params && "split" in params) {
            var ctxt = resolveSafe(params["ctxt"]);
            for(var i = 0; i < ctxt.length; i++) {
                
            }
        }
        if("ctxt" in params && "deep" in params) {
            elements = findElement(chain, resolveSafe(params["ctxt"]), params["deep"]);
        }
        else if("ctxt" in params) {
            elements = findElement(chain, resolveSafe(params["ctxt"]));
        }
        else {
            elements = findElement(chain);
        }
        //elements = findElement(chain, resolve(params["ctxt"]), params["deep"]);
    }
    
    //console.log("from chain:");
    //console.log(elements);
    return elements;
}

function EvalDesc(obj) {
    //console.log("evaluating a desc");
    //console.log(JSON.stringify(obj));
    var desc = obj.desc[0];
    var params = obj.desc[1];
    
    var val = null;
    if(Object.keys(params).length > 0) {
        //console.log("HEYOOOOO");
        //console.log(JSON.stringify(params));
        val = resolve(desc, params);
        
        if("name" in params) {
            sets[params.name] = val;
        }
    }
    else {
        val = resolve(desc);
    }
    
    if("vsid" in params && params["vsid"] == "generate") {
        if(("cascade" in params && params["cascade"] == false) || !("cascade" in params)) {
            //console.log("adding vsid");
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
    
    // Note, really, no human should try to write a parser that has a grab/name separate from a vsid, but
    // we're gonna let it slide since it really helps our poor computer
    if("grab" in params && "name" in params/* && "vsid" in params*/) {
        //console.log("grabbing " + params["name"]);
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
                //console.log("Marking VSID " + vsid + " at index " + currInd + " with name " + params.name);
            }
            
            if(typeof collective[vsid][params["name"]] == "undefined") {
                collective[vsid][params["name"]] = {};
            }
            
            if(typeof collective[vsid][params["name"]]["element"] == "undefined") {
                collective[vsid][params["name"]]["element"] = [val[i]];
            }
            else {
                collective[vsid][params["name"]]["element"].push(val[i]);
            }
            
            for(var x = 0; x < types.length; x++) {
                if(typeof collective[vsid][params["name"]][types[x]] == "undefined") {
                    collective[vsid][params["name"]][types[x]] = [];
                }
                
                if(types[x] == "text") {
                    collective[vsid][params["name"]][types[x]].push($(val[i]).text());  
                }
                else if(types[x] in pluginTypes) {
                    //console.log(types[x] + " is a plugin type.");
                    var typeVal = pluginTypes[types[x]](val[i]);
                    //if(typeof typeVal != "undefined") 
                    {
                        //console.log("typeval is " + typeVal);
                        collective[vsid][params["name"]][types[x]].push(typeVal);
                    }
                    /*else {
                        console.log("type val was undefined, sadly");
                    }*/
                }
                else {
                    if(typeof $(val[i]).attr(types[x]) != "undefined") {
                        collective[vsid][params["name"]][types[x]].push($(val[i]).attr(types[x]));
                    }
                } 
            }
        }
    }
    
    //console.log("from desc:");
    //console.log(val);
    return val;
}

function EvalRef(obj, params) {
    //console.log("evaluating a ref");
    var refName = obj.ref;
    return sets[refName];
}

function resolveSafe(obj, params) {
    if(typeof params == "object") {
        return resolve(JSON.parse(JSON.stringify(obj)), JSON.parse(JSON.stringify(params)));
    }
    else {
        return resolve(JSON.parse(JSON.stringify(obj)));
    }
}

function resolve(obj, params) {
    //console.log("Resolving " + JSON.stringify(obj));
    //console.log(obj);
    if(typeof obj == "undefined") {
        //console.log("Type of obj is undefined");
        return obj;
    }
    
    var keys = Object.keys(obj);
    var type = keys[0];
    
    var res = null;
    
    //console.log("RESOLVING: " + type);
    if(typeof(params) == "undefined") {
        params = {};
    }
    
    if(type == "chain") {
        res = EvalChain(obj, params);
    }
    else if(type == "desc") {
        res = EvalDesc(obj, params);
    }
    else if(type == "ref") {
        res = EvalRef(obj, params);
    }
    else if(type == "super") {
        res = EvalUniOp(obj, params);
    }
    else if(type == "union" || type == "inter" || type == "sinter" || type == "diff") {
        res = EvalSetOp(obj, params);
    }
    
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