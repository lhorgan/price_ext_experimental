var vs_smart = (function() {
    var vs_overlay = null;
    var mouseX = 0;
    var mouseY = 0;
    var currElem = null;
    /*var */selectedElems = [];
    var selectedBoxes = [];
    var box = null;
    var mouse_interval = null;
    var offscreen = false;
    var helperMode = false;
    
    helperBoxes = [];
    helperElements = [];

    var selectBox = $("<div class='vs_select_box'></div>");
    
    $(document).keyup(function(e) {
        if(e.keyCode == 13 && helperMode) {
            selectHelperElements();
        }
        else if(e.keyCode == 27) {
            if(helperMode) {
                helperClean();
            }
            helperMode = !helperMode;
        }
    });
    
    $(document).mousemove(function(event) {
        mouseX = event.pageX - $(document).scrollLeft();
        mouseY = event.pageY - $(document).scrollTop();
    });
    
    $(document).mouseleave(function() {
        offscreen = true;
        currElem = null;
        if(box != null) {
            //console.log("exit");
            box.css("width", 0);
            box.css("height", 0);
            box.css("left", 0);
            box.css("top", 0);
        }
    });
    
    $(window).resize(function() {
        console.log("resizing");
        for(var i = 0; i < selectedBoxes.length; i++) {
            positionOver($(selectedBoxes[i]), $(selectedBoxes[i].homeElement)); 
        }
    });
    
    $(document).mouseenter(function() {
        offscreen = false;
    });
    
    function helperClean() {
        for(var i = 0; i < helperBoxes.length; i++) {
            $(helperBoxes[i]).remove();
        }
        while(helperBoxes.length > 0) {
            helperBoxes.pop();
        }
        while(helperElements.length > 0) {
            helperElements.pop();
        }
    }
    
    function positionOver(container, elem) {
        //var myDiv = $("<div></div>");
        
        //$(elem).wrap(myDiv);
        
        $(container).css("width", $(elem).outerWidth());
        $(container).css("height", $(elem).outerHeight());
        
        //$(elem).unwrap();
        
        $(container).css("left", $(elem).offset().left);
        $(container).css("top", $(elem).offset().top);
    }

    function createOverlay() {
        if(vs_overlay == null) {
            vs_overlay = $('<div class="vs_smart_overlay"></div>');
        }
        
        vs_overlay.insertBefore('body');

        box = $("<div class='vs_highlight_box'></div>");
        box.click(function() {
            selectedElems.push(currElem);
            
            // Good place to run the helper code
            if(helperMode) {    
                highlightHelper();
            }
            // end highlight helper
            
            createPermBox();
            
            currElem = null;
        });

        vs_overlay.append(box);
    }
    
    function createPermBox() {
        var ourBox = selectBox.clone();
        ourBox[0].homeElement = currElem;
        ourBox.addClass("selectionBox");
        //console.log("calling from create");
        positionOver(ourBox, currElem);
        vs_overlay.append(ourBox);

        selectedBoxes.push(ourBox[0]);

        ourBox.click(function() {
            var ind = selectedBoxes.indexOf(ourBox);
            selectedBoxes.splice(ind, 1);
            selectedElems.splice(selectedElems.indexOf(ourBox[0].homeElement), 1);
            ourBox.remove();
            
            if(helperMode) {
                highlightHelper();
            }
        });

        setInterval(function() {
            positionOver(ourBox, ourBox[0].homeElement);
        }, 500);
    }

    function highlightElement(elem) {
        if((elem != null && selectedElems.indexOf(elem) < 0) && (currElem == null || elem != currElem)) {
            if(!offscreen) {
                currElem = elem;
                positionOver(box, elem);
            }
        }
        else if(selectedElems.indexOf(elem) >= 0 && box != null) {
            box.css("width", 0);
            box.css("height", 0);
            box.css("left", 0);
            box.css("top", 0);
        }
    }
    
    function highlightHelper() {
        helperClean();
        
        if(selectedElems.length > 0) {
            var quickElems = findElement(quickSelector(selectedElems));
            helperElements = _.difference(quickElems, selectedElems);

            helperBoxes = auxHighlight(helperElements);
        }
    }
    
    function selectHelperElements() {
        for(var i = 0; i < helperBoxes.length; i++) {
            $(helperBoxes[i]).remove();
        }
        while(helperBoxes.length > 0) {
            helperBoxes.pop();
        }
        
        for(var i = 0; i < helperElements.length; i++) {
            currElem = helperElements[i];
            selectedElems.push(currElem);
            createPermBox();
        }
        currElem = null;
        
        while(helperElements.length > 0) {
            helperElements.pop();
        }
    }
    
    function auxHighlight(elems) {
        var boxList = [];
        
        for(var i = 0; i < elems.length; i++) {
            var ghostBox = $("<div class='vs_ghost_box'></div>");
            vs_overlay.append(ghostBox);
            positionOver(ghostBox[0], elems[i]);
            boxList.push(ghostBox);
        }
        
        return boxList;
    }

    function initUI(helper) {
        createOverlay();
        
        if(helper) {
            helperMode = true;
        }
        
        restoreHandlers();
        
        mouse_interval = setInterval(function() {
            vs_overlay[0].style.display = "none";
            var elem = document.elementFromPoint(mouseX, mouseY);
            
            highlightElement(elem);
            
            vs_overlay.css("width", $(document).width());
            vs_overlay.css("height", $(document).height());
            
            vs_overlay[0].style.display = "";
        }, 100);
    }
    
    function restoreHandlers() {
        for(var i = 0; i < selectedBoxes.length; i++) {
            (function() {
                var currBox = $(selectedBoxes[i]);
                currBox.click(function() {
                    var ind = selectedBoxes.indexOf(this);
                    selectedBoxes.splice(ind, 1);
                    selectedElems.splice(ind, 1);
                    $(this).remove();
                });
            })();
        }
    }
    
    function disableUI(clear) {
        vs_overlay.remove();
        mouseX = 0;
        mouseY = 0;
        currElem = null;
        if(box != null) {
            box.remove();
            box = null;
        }
        clearInterval(mouse_interval);
        
        if(typeof clear == "boolean" && clear == true) {
            vs_overlay = null;
            clearSelected();
        }
    }
    
    function clearSelected() {
        while(selectedElems.length > 0) {
            selectedElems.pop();
        }
//        while(selectedBoxes.length > 0) {
//            $(selectedBoxes[selectedBoxes.length - 1]).remove(); //  NOTE THIS MIGHT CAUSE PROBLEMS IF WE DISABLE THE WHOLE UI
//            // PLEASE, FUTURE ME, DON'T FORGET ABOUT THIS
//            selectedBoxes.pop();
//        }
        
        for(var i = 0; i < selectedBoxes.length; i++) {
            $(selectedBoxes[i]).remove();
        }
        while(selectedBoxes.length > 0) {
            selectedBoxes.pop();
        }
        
        if(helperMode) {
            helperClean();
        }
    }
    
    return {
        initUI: function(helper) { initUI(helper); },
        disableUI: function(clear) { disableUI(clear); },
        clearSelected: function() { clearSelected(); },
        getSelected: function() { return selectedElems; },
        auxHighlight: function(elems) { return auxHighlight(elems); }
    };
})();

/*chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    alert("MESSAGE");
});*/

/*function evalStep1(panel) {
    var sel = vs_smart.getSelected().slice();
    
    var initSuper = findSuperStructure(sel);
    var newSel = [];
    while(initSuper.length > 15) {
        var toRemove = Math.floor(Math.random() * initSuper.length);
        $(initSuper[toRemove]).css("display", "none");
        initSuper.splice(toRemove, 1);
        sel.splice(toRemove, 1);
    }
    
    vs_smart.clearSelected();
    panel.html("<p>Enter a name for the anchor group.  If it is the price, it MUST be called price.</p>");
    var input = $("<input type'text' name='typeName' />");
    var button = $("<button type='button' class='btn btn-success'>Submit</button></div>");
    
    button.click(function() {
        var elemGroups = [{"type":"vs_" + input.val(), "list":normalize(sel)}];
        evalStep2(panel, elemGroups);
    });
    
    panel.append(input);
    panel.append(button);
    input.wrap("<p></p>");
    button.wrap("<p></p>");
}

function evalStep2(panel, elemGroups) {
    panel.html("<p>Please give a name to all other element groups that you plan to select.</p>");
    var inputGroup = $("<div></div>");
    panel.append(inputGroup);
    inputGroup.wrap("<p></p>");
    createInput(inputGroup, false);
    
    var button = $("<button type='button' class='btn btn-success'>Submit</button></div>");
    button.click(function() {
        var groups = $(".vs_elemGroup");
        var groupNames = [];
        for(var i = 0; i < groups.length; i++) {
            groupNames.push($(groups[i]).val());
        }
        evalStep3(panel, elemGroups, groupNames, 0);
    });
    
    panel.append(button);
}

function evalStep3(panel, elemGroups, groupNames, index) {
    panel.html("<p>Please select all " + groupNames[index] + "'s.</p>");
    var button = $("<button type='button' class='btn btn-success'>Done</button></div>");
    
    button.click(function() {
        var sel = vs_smart.getSelected().slice(); 
        vs_smart.clearSelected();
        elemGroups.push({"type":"vs_" + groupNames[index], "list":normalize(sel)});
        if(index < groupNames.length - 1) {
            evalStep3(panel, elemGroups, groupNames, ++index);
        }
        else {
            panel.html("Evaluating.....");
            setTimeout(function() {
                buildJSON(elemGroups, sel.slice());
            }, 500);
        }
    });
    
    panel.append(button);
    button.wrap("<p></p>");
    
}

function createInput(parent, minus) {
    var input = $("<input type='text' class='vs_elemGroup' />");
    var plusButton = $("<span style='cursor:pointer'> + </span>");
    var minusButton = $("<span style='cursor:pointer'> - <br/></span>");

    plusButton.click(function() {
        createInput(parent, true); 
    });
    if(minus) {
        minusButton.click(function() {
            input.remove();
            plusButton.remove();
            minusButton.remove();
        });
    }
    
    var holder = $("<div></div>");
    holder.append(input);
    holder.append(plusButton);
    holder.append(minusButton);
    parent.append(holder);
    holder.wrap("<p></p>");
}*/