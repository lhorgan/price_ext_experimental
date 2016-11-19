var vs_smart = (function() {
    var vs_overlay = null;
    var mouseX = 0;
    var mouseY = 0;
    var currElem = null;
    var selectedElems = [];
    var selectedBoxes = [];
    var box = null;
    var mouse_interval = null;
    var offscreen = false;
    var panel = null;
    
    var step1 = $("<div class='smart_panel'>Select all data associated with the price.<br><button type='button' class='btn btn-success'>Done</button></div>");

    selectBox = $("<div class='vs_select_box'></div>");

    $(document).mousemove(function(event) {
        mouseX = event.pageX - $(document).scrollLeft();
        mouseY = event.pageY - $(document).scrollTop();
    });
    
    $(document).mouseleave(function() {
        offscreen = true;
        currElem = null;
        if(box != null) {
            console.log("exit");
            box.css("width", 0);
            box.css("height", 0);
            box.css("left", 0);
            box.css("top", 0);
        }
    });
    
    $(document).mouseenter(function() {
        offscreen = false;
    });

    $(document).scroll(function() {
        for(var i = 0; i < selectedBoxes.length; i++) {
            positionOver(selectedBoxes[i], selectedElems[i]);
        }

        if(currElem != null && box != null) {
            positionOver(box, currElem);
        }
    });

    function positionOver(container, elem) {
        $(container).css("width", $(elem).outerWidth());
        $(container).css("height", $(elem).outerHeight());
        $(container).css("left", $(elem).offset().left - $(document).scrollLeft());
        $(container).css("top", $(elem).offset().top - $(document).scrollTop());
    }

    function createOverlay() {
        if(vs_overlay == null) {
            vs_overlay = $('<div class="vs_smart_overlay"></div>');
        }
        
        vs_overlay.insertBefore('body');
        if(panel == null) {
            $(step1).find('.btn').click(function() {
                evalStep1(panel); 
            });
            panel = step1;
            $(panel).insertBefore(vs_overlay);
        }

        box = $("<div class='vs_highlight_box'></div>");
        box.click(function() {
            selectedElems.push(currElem);

            var ourBox = selectBox.clone();
            //console.log("calling from create");
            positionOver(ourBox, currElem);
            vs_overlay.append(ourBox);

            selectedBoxes.push(ourBox[0]);

            ourBox.click(function() {
                var ind = selectedBoxes.indexOf(ourBox);
                selectedBoxes.splice(ind, 1);
                selectedElems.splice(ind, 1);
                ourBox.remove();
            });

            currElem = null;
        });

        vs_overlay.append(box);
    }

    function highlightElement(elem) {
        if((elem != null && selectedElems.indexOf(elem) < 0) && (currElem == null || elem != currElem)) {
            if(!offscreen) {
                currElem = elem;
                positionOver(box, elem);
            }
        }
        else if(selectedElems.indexOf(elem) >= 0) {
            box.css("width", 0);
            box.css("height", 0);
            box.css("left", 0);
            box.css("top", 0);
        }
    }

    function initUI() {
        createOverlay();
        $("body").addClass("overlay_shift");
        
        restoreHandlers();
        
        mouse_interval = setInterval(function() {
            vs_overlay[0].style.display = "none";
            var elem = document.elementFromPoint(mouseX, mouseY);
            
            if(!$(elem).is(panel) && !$.contains(panel, $(elem))) {
                highlightElement(elem);
            }
            
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
            /*while(selectedElems.length > 0) {
                selectedElems.pop();
            }
            while(selectedBoxes.length > 0) {
                selectedBoxes.pop();
            }*/
            clearSelected();
        }
    }
    
    function clearSelected() {
        while(selectedElems.length > 0) {
            selectedElems.pop();
        }
        while(selectedBoxes.length > 0) {
            $(selectedBoxes[selectedBoxes.length - 1]).remove(); //  NOTE THIS MIGHT CAUSE PROBLEMS IF WE DISABLE THE WHOLE UI
            // PLEASE, FUTURE ME, DON'T FORGET ABOUT THIS
            selectedBoxes.pop();
        }
    }
    
    return {
        initUI: function() { initUI(); },
        disableUI: function(clear) { disableUI(clear); },
        clearSelected: function() { clearSelected(); },
        getSelected: function() { return selectedElems; },
    };
})();