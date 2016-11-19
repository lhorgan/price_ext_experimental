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

function waitFor(desc, int, cb) {
    var interval = setInterval(function() {
        var matches = findElement(desc);
        if(matches.length > 0) {
            clearInterval(interval);
            cb(matches);
        }
    }, int);
}