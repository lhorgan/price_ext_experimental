function processJSON_M(jsonArr) {
    for (var i = 0; i < jsonArr.length; i++) {
        resolveSafe_M({
            "obj": jsonArr[i]
            , "parent": {}
        });
    }
}

function EvalSetOp_M(data, instr) {
    console.log("evaluating a set op");
    var op = Object.keys(data.obj)[0];
    var val = data.obj[op];

    var set1 = val[0];
    var set2 = val[1];
    var set1Data = {
        "obj": set1
        , "parent": data.obj
        , "params": data.params
    };
    var set2Data = {
        "obj": set2
        , "parent": data.obj
        , "params": data.params
    };

    handleInstr(data, instr);
    resolveSafe_M(set1Data, instr);
    resolveSafe_M(set2Data, instr);
}

function EvalUniOp_M(data, instr) {
    console.log("evaluating a uni op");
    var op = Object.keys(data.obj)[0];
    var val = data.obj[op];

    var newData = {
        "obj": val
        , "parent": data.obj
        , "params": data.params
    }

    handleInstr(data, instr);
    resolveSafe_M(newData, instr);
}

function EvalChain_M(data, instr) {
    handleInstr(data, instr);

    console.log("evaluating a chain");
    var chain = data.obj.chain;
    for (var i = 0; i < chain.length; i++) {
        var key = Object.keys(chain[i])[0];
        var val = chain[i][key];
        if (typeof val == "object") {
            var newData = {
                "obj": val
                , "parent": data.obj
                , "params": {}
            };
            resolveSafe_M(newData, instr);
        }
    }
}

function EvalDesc_M(data, instr) {
    console.log("evaluating a desc");
    var desc = data.obj.desc[0];
    var params = data.obj.desc[1];

    if (Object.keys(data.params).length > 0) {
        var newData = {
            "obj": desc
            , "parent": data.obj
            , "params": data.params
        };
        handleInstr(data, instr);
        resolveSafe_M(newData, instr);
    } else {
        var newData = {
            "obj": desc
            , "parent": data.obj
        };
        handleInstr(data, instr);
        resolveSafe_M(newData, instr);
    }
}

function EvalRef_M(data, instr) {
    console.log("evaluating a ref");
    var newData = {
        "obj": data.obj.ref
        , "parent": data.obj
    };
    handleInstr(data, instr);
}

function resolveSafe_M(data, instr) {
    if (typeof params == "object") {
        resolve_M({
            "obj": JSON.parse(JSON.stringify(data.obj))
            , "parent": JSON.parse(JSON.stringify(data.parent))
            , "params": JSON.parse(JSON.stringify(data.params))
        }, instr);
    } else {
        resolve_M({
            "obj": JSON.parse(JSON.stringify(data.obj))
            , "parent": JSON.parse(JSON.stringify(data.parent))
        }, instr);
    }
}

function resolve_M(data, instr) {
    //console.log("Resolving " + JSON.stringify(data.obj));
    //console.log("PARENT: " + JSON.stringify(data.parent) + "\n\n");
    if (typeof data.obj == "undefined") {
        console.log("Type of obj is undefined");
    }

    var keys = Object.keys(data.obj);
    var type = keys[0];

    if (typeof (data.params) == "undefined") {
        data.params = {};
    }

    if (type == "chain") {
        EvalChain_M(data, instr);
    } else if (type == "desc") {
        EvalDesc_M(data, instr);
    } else if (type == "ref") {
        EvalRef_M(data, instr);
    } else if (type == "super") {
        EvalUniOp_M(data, instr);
    } else if (type == "union" || type == "inter" || type == "sinter" || type == "diff") {
        EvalSetOp_M(data, instr);
    }
}

function handleInstr(data, instr) {
    if (typeof instr == "object" && typeof instr.func == "function" && "args" in instr) {
        instr.func(data, instr.args);
    }
    /*console.log("handling");
    if(typeof instr == "function") {
        instr(data);
    }*/
}

//function flatten(json) {
//    var stackArr = [{}];
//    
//    resolveSafe_M({"obj":json, "parent":{}},
//                 {"func": function(data, stack) {
//                     var type = Object.keys(data.obj)[0];
//                     var currObj = stack[stack.length - 1];
//                                      
//                     if(type == "chain") {
//                         currObj[type] = {};
//                         var pos = currObj[pos];
//                         
//                         if(pos == "right") {
//                             while(pos == "right" && stack.length > 0) {
//                                 stack.pop();
//                                 pos = stack[stack.length - 1].pos;
//                             }
//                         }
//                         else {
//                            stack.pop();
//                         }
//                     }
//                     else {
//                         var newObj = [{"pos":"left"}, {"pos":"right"}];
//                         currObj[type] = newObj;
//                         stack.push(newObj[1]);
//                         stack.push(newObj[0]);
//                     }
//                     
//                     console.log(JSON.parse(JSON.stringify(stack)));
//                 }, "args":stackArr});
//    
//    console.log(JSON.stringify(stackArr));
//    console.log(stackArr);
//}


function flatten(json) {
    var stackArr = [{}];

    resolveSafe_M({
        "obj": json
        , "parent": {}
    }, {
        "func": function (data, currObj) {
            var type = Object.keys(data.obj)[0];

            if (type == "chain") {
                var newObj = {};
                currObj[type] = newObj;
                
                
            } else {
                var newObj = [{"parent": currObj}, {"parent": currObj}];
                currObj[type] = newObj;
                currObj = newObj;
            }
        }
        , "args": stackArr
    });

    console.log(JSON.stringify(stackArr));
    console.log(stackArr);
}

/****** START NON GENERIC CODE *******/
//function flatten(json) {
//    var types = [];
//    var copyObj = {};
//    
//    resolveSafe_M({"obj": json, "parent": {}}, function(data) {
//        var type = Object.keys(data.obj)[0];
//        types.push(type);
//    });
//    
//    return types;
//}
//
//function structuralEquality(jsonA, jsonB) {
//    var flatA = flatten(jsonA);
//    var flatB = flatten(jsonB);
//    
//    if(flatA.length != flatB.length) {
//        return false;
//    }
//    
//    for(var i = 0; i < flatA.length; i++) {
//        if(flatA[i] != flatB[i]) {
//            return false;
//        }
//    }
//    
//    return true;
//}