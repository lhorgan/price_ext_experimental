var uniqueID = (function() {
   var id = 0; // This is the private persistent value
   return function() { return id++; };  // Return and increment
})(); // Invoke the outer function after defining it.

function findSuperStructure(elems) {
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
}

/*function findSuperStructure(elems) {
    var superStructure = [];
    for(var i = 0; i < elems.length; i++) {
        var otherElems = [];
        for(var j = 0; j < elems.length; j++) {
            if(j != i) {
                otherElems.push(elems[j]);
            }
        }
        
        var prevElem = elems[i];
        var currElem = $(elems[i]).parent()[0];
        var count = countMatches(currElem, otherElems);
        while(count < 0.5 * otherElems.length) { // gotta tinker with these numbers
            prevElem = currElem;
            currElem = $(currElem).parent()[0];
            count = countMatches(currElem, otherElems);
        }
        if(superStructure.indexOf(prevElem) < 0) {
            superStructure.push(prevElem);
        }
    }
    
    return superStructure;
}

function countMatches(container, children) {
    var matchNum = 0;
    for(var i = 0; i < children.length; i++) {
        if($.contains(container, children[i])) {
            matchNum++;
        }
    }
    
    return matchNum;
}*/

/*function findSuperStructure(elems, tag) {
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
                console.log(currElem);
                console.log(subElems);
                console.log("\n");
                
                superStructure.push(prevElem[0]);
                
                if(tag) {
                    var uid = uniqueID();
                    $(elems[i]).attr("price-id", uid);
                    $(elems[i]).addClass("vs_price");
                    $(prevElem[0]).attr("price-id", uid);
                    $(prevElem[0]).addClass("vs_container");
                }
                
                break;
            }
            prevElem = currElem;
            currElem = $(currElem).parent();
        }
    }
    
    return superStructure;
}

function eachContains(elem, arr) {    
    var numFound = 0;
    for(var i = 0; i < arr.length; arr++) {
        if($.contains($(elem)[0], $(arr[i])[0])) {
            console.log(arr[i]);
            numFound++;
        }
    }
    console.log(numFound);
    return numFound > 0;
}*/

function waitFor(desc, int, cb) {
    var interval = setInterval(function() {
        var matches = findElement(desc);
        if(matches.length > 0) {
            clearInterval(interval);
            cb(matches);
        }
    }, int);
}