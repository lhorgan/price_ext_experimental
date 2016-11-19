// todo: stop polluting the global namespace
var prevScrollY = 0;
var prevScrollX = 0;
var lastScrollCutY = 0;
var lastScrollCutX = 0;
var instance_id;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.hasOwnProperty("captured")) {
        if(typeof imgArr[row] == "undefined") {
            imgArr.push([]);
        }
        
        if(window.scrollY - prevScrollY < scrollIntervalY && window.scrollY - prevScrollY >= 0 && prevScrollY != 0) {
            console.log("scrolled " + (window.scrollY - prevScrollY) + " against scroll interval " + scrollIntervalY);
            lastScrollCutY = scrollIntervalY - (window.scrollY - prevScrollY);
        }
 
        imgArr[row].push({"img": request["captured"]/*, "diffY": diffY, "diffX": diffX*/});
        prevScrollY = window.scrollY;
        setTimeout(function() {
            captureHelper(true);
        }, 0);
    }
});
captureInProgress = false;

function capturePage(cb) {
    if(!captureInProgress) {
        prevScrollY = 0;
        prevScrollX = 0;
        lastScrollCutY = 0;
        lastScrollCutX = 0;
        
        captureInProgress = true;
        scrollIntervalY = window.innerHeight;
        documentHeight = $(document).height();
        scrollIntervalX = window.innerWidth;
        documentWidth = $(document).width();
        row = 0;
        col = 0;
        imgArr = [];
        vsCallback = cb;
        window.scrollTo(0, 0);
        captureHelper(false);
    }
}

function captureHelper(scroll) {
    /*if(scroll) {
        row++;
        //window.scrollTo(window.scrollX, window.scrollY + scrollIntervalY);
        window.scrollBy(0, scrollIntervalY);
    }*/
    
    if(window.scrollY + scrollIntervalY < documentHeight) {
        if(scroll) {
            row++;
            window.scrollBy(0, scrollIntervalY);   
        }
        chrome.runtime.sendMessage({"capture": true});
    }
    else if(window.scrollX + scrollIntervalX < documentWidth) {
        row = 0;
        col++;
        var currScrollX = window.scrollX;
        window.scrollTo(window.scrollX + scrollIntervalX, 0);
        lastScrollCutX = scrollIntervalX - (window.scrollX - currScrollX);
        chrome.runtime.sendMessage({"capture": true});
    }
    else {
        window.scrollTo(0, 0);
        captureInProgress = false;
        vsCallback();
        createCanvasImage();
    }
}

function createCanvasImage() {
    var width = 0;
    var height = 0;
    var images = [];
    for(var i = 0; i < imgArr.length; i++) {
        images.push([]);
        for(var j = 0; j < imgArr[i].length; j++) {
            var img = new Image();
            img.src = imgArr[i][j].img;
            images[i].push(img);
            //console.log(img.width + ", " + img.height);
            if(j == 0) {
                height += img.height;// - imgArr[i][j].diffY;
            }
            if(i == 0) {
                width += img.width; //- imgArr[i][j].diffX;
            }
        }
    }
    
    //console.log(width + ":::::" + height);
    
    var myCanvas = $("<canvas><canvas>");
    myCanvas.attr("width", width - lastScrollCutX);
    myCanvas.attr("height", height - lastScrollCutY);
    myCanvas.attr("id", "vs_hidden_canvas");
    myCanvas.css("display", "none");
    $("body").append(myCanvas);
    
    myCanvas.ready(function() {
        var c = document.getElementById("vs_hidden_canvas");
        var ctx = c.getContext("2d");
        
        var y = 0;
        for(var i = 0; i < images.length; i++) {
            var x = 0;
            for(var j = 0; j < images[i].length; j++) {
                //console.log("image height " + images[i][j].height);
                var yShift = 0;
                var xShift = 0;
                if(i == images.length - 1) {
                    yShift = lastScrollCutY;
                }
                if(j == images[i].length - 1) {
                    xShift = lastScrollCutX;
                }
                ctx.drawImage(images[i][j], x - xShift, y - yShift);
                x += images[i][j].width;
            }
            y += images[i][0].height;
        }
        console.log("about to draw image to canvas");
        //console.log("images " + images[0][0].width + ", " + images[0][0].height);
        ctx.drawImage(images[0][0], 0, 0);
        var cvsImg = c.toDataURL("image/png");//c.toDataURL("image/jpeg", 0.2);
        //document.write('<img src="'+cvsImg+'"/>');
        console.log("Survived, type of instance id is " + (typeof instance_id));
        if(typeof instance_id != "undefined") {
            console.log("sending message");
            chrome.runtime.sendMessage({"upload_screenshot": true, "base64": cvsImg, "instance_id": instance_id});
        }
    });
}

function snap(instance, cb) {
    console.log("instance is " + instance);
    instance_id = instance;
    var setting = $("body").css("overflow");
    $("body").css("overflow", "hidden");
    setTimeout(function() {
        capturePage(function() {
            console.log("capture done!");
            $("body").css("overflow", setting);
            //instance_id = undefined;
            if(typeof cb == "function") {
                cb();
            }
        });
    }, 1000);
}