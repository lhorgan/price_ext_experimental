function renderJSON(theJSON) {
    //console.log("ive been called");
    //console.log(JSON.stringify(theJSON));
    drawJSON(theJSON, $("#holder"));
}

function resetHolder() {
    $("#holder").empty();
}