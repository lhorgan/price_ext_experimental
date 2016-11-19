// Create a connection to the background page
var backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});

var nextStep = function() {};

backgroundPageConnection.onMessage.addListener(function(message) {
    if(message.status == "continue") {
        //console.log("got the message back");
        nextStep();
    }
    else if(message.status == "message") {
        $("#message").append(message.data + "<br />");
    }
    else if(message.status == "selector") {
        showSelector(message.data);
    }
    else if(message.status == "jsonProcessed") {
        $("#playHelper").text("Complete!  See Log tab.");
        setTimeout(function() {
            $("#playHelper").text("");
        }, 2000);
        postToLog(JSON.stringify(message.data));
    }
});

function setup() {
    $(".addInput").click(function() {
        createInput($("#baseHolder")); 
    });
    
    $("#submit-typeNames").click(function() {
        $("#step-names").hide();
        
        var inputs = $(".value-typeName");
        var typeNames = [];
        for(var i = 0; i < inputs.length; i++) {
            typeNames.push($(inputs[i]).val());
        }
        //console.log(JSON.stringify(typeNames));
        
        nextStep = function() {
            askForType(typeNames, 0);
        };
        
        backgroundPageConnection.postMessage({
            name: 'sandbox',
            data: {'step': 'typeNames', 'typeNames': typeNames},
            tabId: chrome.devtools.inspectedWindow.tabId
        });
    });
    
    $("#submit-typeSelection").click(function() {
        $("#step-selections").hide();
        
        backgroundPageConnection.postMessage({
            name: 'sandbox',
            data: {'step': 'typeSelection'},
            tabId: chrome.devtools.inspectedWindow.tabId
        });
    });
    
    $(".glyphicon-floppy-disk").click(function() {
        $(".helper").hide();
        $("#saveHelper").show();
    });
    
    $("#saveComplete").click(function() {
        var name = $("#scraperName").val();
        if(name.length > 0) {
            var obj = {};
            obj["scraper_" + name] = jsonArr;
            chrome.storage.local.set(obj, function() {
                postToLog(JSON.stringify(jsonArr));
                $("#saveHelper").hide();
            });
        }
        else {
            alert("Please enter a valid name.");
        }
    });
    
    $(".glyphicon-open-file").click(function() {       
        getScrapers(function(nameList) {
            $(".helper").hide();
            var scraperSelect = generateSelect(nameList);
            scraperSelect.addClass("nameSelector");
            $("#scraperListHolder").html(scraperSelect);
            $("#openHelper").show();
        });
    });
    
    $("#openComplete").click(function() {
        var name = $(".nameSelector").val();
        chrome.storage.local.get("scraper_" + name, function(obj) {
            //alert(JSON.stringify(obj)); 
            jsonArr = obj["scraper_" + name];
            showSelector(jsonArr);
        });
    });
    
    $(".glyphicon-magnet").click(function() {       
        getScrapers(function(nameList) {
            $(".helper").hide();
            var scraperSelect = generateSelect(nameList);
            scraperSelect.addClass("mergeSelector");
            scraperSelect.prop("multiple", "multiple");
            $("#mergeListHolder").html(scraperSelect);
            $("#mergeHelper").show();
        });
    });
    
    $("#mergeComplete").click(function() {
        var names =  $(".mergeSelector").val();
        if(names.length >= 2) {
            for(var i = 0; i < names.length; i++) {
                names[i] = "scraper_" + names[i];
            } 
            chrome.storage.local.get(names, function(obj) {
                //alert(JSON.stringify(obj));
                var merged = mergeMain(obj[names[0]], obj[names[1]]);
                for(var i = 2; i < names.length; i++) {
                    merged = mergeMain(merged, obj[names[i]]);
                }
                jsonArr = merged;
                showSelector(jsonArr);
            });
        }
        else {
            alert("Please select at least two scrapers to merge.");
        }
    });
    
    $(".glyphicon-play").click(function() {
        $("#playHelper").text("Working...");
        backgroundPageConnection.postMessage({
            name: 'sandbox',
            data: {'step': 'processJSON', 'data': jsonArr},
            tabId: chrome.devtools.inspectedWindow.tabId
        });
    });
    
    $("#builderTab").click(function() {
        $(".active").removeClass("active");
        $(this).addClass("active");
        $("#builder").show();
        $("#generator").hide();
        $("#log").hide();
        $("#gallery").hide();
        configBuilder();
    });
    
    $("#logTab").click(function() {
        $(".active").removeClass("active");
        $(this).addClass("active");
        $("#builder").hide();
        $("#generator").hide();
        $("#log").show();
        $("#gallery").hide();
    });
    
    $("#generatorTab").click(function() {
        $(".active").removeClass("active");
        $(this).addClass("active");
        $("#builder").hide();
        $("#generator").show();
        $("#log").hide();
        $("#gallery").hide();
    });
    
    $("#galleryTab").click(function() {
        $(".active").removeClass("active");
        $(this).addClass("active");
        $("#builder").hide();
        $("#generator").hide();
        $("#log").hide();
        $("#gallery").show();
        loadGalleryInfo();
    });
    
    $(".glyphicon-remove-circle").click(function() {
        $("#logBody").text(""); 
    });
    
    $("#submit-scraper").click(function() {
        var name = $(".galleryList").val();
        var url = $("#scraperURL").val();
        if(url.length == 0) {
            alert("Please specify a URL");
            return;
        }
        chrome.storage.local.get("scraper_" + name, function(obj) {
            jsonArr = obj["scraper_" + name];
            backgroundPageConnection.postMessage({
                name: 'scraperSubmission',
                data: {'block': jsonArr, 'url': url},
                tabId: chrome.devtools.inspectedWindow.tabId
            });
        });
    });
}

function loadGalleryInfo() {
    getScrapers(function(nameList) {
        var scraperSelect = generateSelect(nameList);
        scraperSelect.addClass("galleryList");
        $("#scraperListGallery").html(scraperSelect);
    });
}

function getScrapers(cb) {
    chrome.storage.local.get(null, function(obj) {
        var nameList = [];
        for(key in obj) {
            if(key.indexOf("scraper_") == 0) {
                nameList.push(key.substr(8));
            }
        }
        nameList.sort();
        cb(nameList);
    });
}

var jsonArr = [{}];
var startedBuilder = false;
function configBuilder() {
    if(!startedBuilder) {
        startedBuilder = true;
        jsonArr = [{}];
        //console.log("PASSING: " + JSON.stringify(jsonArr));
        document.getElementById("builderFrame").contentWindow.renderJSON(jsonArr);
        //console.log("ummm... did that work?");
        //drawJSON(jsonArr, $("#builderFrame").contents().find("#holder"), "iframe");
    }
}

function showSelector(selector) {
    startedBuilder = true;
    jsonArr = selector;
    document.getElementById("builderFrame").contentWindow.resetHolder();
    document.getElementById("builderFrame").contentWindow.renderJSON(jsonArr);
    //$("#builderFrame").contents().find("#holder").empty();
    //drawJSON(selector, $("#builderFrame").contents().find("#holder"), "iframe");
}

function askForType(typeNames, index) {
    $("#step-selections").show();
    //console.log("I've been called");
    //console.log(typeNames[index]);
    $("#currentType").text(typeNames[index]);
    
    if(index < typeNames.length - 1) {
        nextStep = function() {
            askForType(typeNames, index + 1);
        };
    }
    else {
        nextStep = analyze;
    }
}

function analyze() {
    $("#step-analyze").show();
    backgroundPageConnection.postMessage({
        name: 'sandbox',
        data: {'step': 'analyze'},
        tabId: chrome.devtools.inspectedWindow.tabId
    });
}

function postToLog(str) {
    $("#logBody").append(str + "<br />");
}

function createInput(parent) {
    var input = $("<input type='text' name='typeName' class='value-typeName' /><span>&nbsp</span>");
    var minusButton = $("<span class='remInput clickable'><span class='glyphicon glyphicon-minus-sign' aria-hidden='true'></span></span><span>&nbsp</span>");
    var plusButton = $("<span class='addInput clickable'><span class='glyphicon glyphicon-plus-sign' aria-hidden='true'></span></span>");
    var holder = $("<p></p>");
    
    plusButton.click(function() {
       createInput(holder); 
    });
    minusButton.click(function() {
        holder.remove();
    });
    
    holder.append(input);
    holder.append(minusButton);
    holder.append(plusButton);
    holder.insertAfter(parent);
}

function generateSelect(options) {
    var select = $("<select></select");
    for(var i = 0; i <options.length; i++) {
        select.append("<option value='" + options[i] + "'>" + options[i] + "</option>");
    }
    return select;
}

document.addEventListener('DOMContentLoaded', setup);