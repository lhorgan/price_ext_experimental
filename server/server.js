var http = require('http');
var express = require('express');
var bodyParser = require("body-parser");
var Horseman = require('node-horseman');
var fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = require('request');

var app = express();

//Lets define a port we want to listen to
const PORT=7677; 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static('static'));

app.get('/test', function(req, res) {
    res.send('PriceCompare Path: ' + req.url);
});

app.post('/reportPrice', function(req, res) {
    console.log('Report Price: ' + req.url);
    console.log("Version: " + req.body.version);
    console.log("coming from: " + req.body.url);
    scrape(res, req/*req.body.url, req.body.version, req.body.vs_prices*/);
});

app.post('/uploadImage', function(req, res) {
    console.log("sending image " + req.body.instance_id);
    //uploadImage(req.body.instance_id + "_server");
    uploadIfExists(req.body.instance_id + "_server", "screenshots/" + req.body.instance_id + "_server.png");
    res.send({"status": "success"});
});

function uploadIfExists(keyname, filename) {
    var totalTime = 0;
    var pause = 15000;
    var maxTime = 90000;
    checker();
    
    function checker() {
        console.log("in checker");
        checkForFile(filename, function(exists) {
            if(exists) {
                console.log("file exists");
                uploadImage(keyname, filename);
            }
            else if(totalTime < maxTime) {
                setTimeout(checker, pause);
                totalTime += pause;
            }
        });
    }
}

//Lets start our app
app.listen(PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});

var supportedSites = [
    {"base_url": ["https://www.google.com/flights/"], "trigger_url": ["^https:\\/\\/www\\.google\\.com\\/flights\\/\\?f=0#search.*", "^https:\\/\\/www\\.google\\.com\\/flights\\/#search.*"], "name": "Google Flights", "script": "google-flights"},
    {"base_url": ["https://www.amazon.com/"], "trigger_url": ["https://www.amazon.com/s/"], "name": "Amazon", "script": "amazon"},
    {"base_url": ["https://www.priceline.com/"], "trigger_url": ["https://www.priceline.com/stay/#/search/"], "name": "Priceline", "script": "priceline"}
];

function checkForFile(filename, cb) {
    console.log("checking for " + filename);
    fs.stat(filename, function(err, stats) {
        cb(err == null);
    });
}

// url
// type is one of 'base_url' or 'trigger_url'
function checkSupport(url, type) {
    for(var i = 0; i < supportedSites.length; i++) {
        for(var j = 0; j < supportedSites[i][type].length; j++) {
            var patt = new RegExp(supportedSites[i][type][j]);
            if(patt.test(url)) {
                return {"status": true, "name": supportedSites[i].name, "script": supportedSites[i].script};
            }
        }
    }
    
    return {"status": false};
}

function scrape(result, req/*url, version, clientData*/) {
    var scraperScript = null;
    var support = checkSupport(/*url*/req.body.url, "trigger_url");
    if(support.status) {
        scraperScript = support.script;
        fs.stat("sites/" + scraperScript + "_" + /*version*/req.body.version + ".js", function(err, stats) {
           if(err == null) {
               //loadPage(result, url, scraperScript + "_" + req.body.version, clientData);
               loadPage(result, req, scraperScript + "_" + req.body.version);
           } 
           else {
               console.log("unsupported site");
               console.log(err);
               result.send(JSON.stringify({"status": "fail", "msg": "Plugin out of date."}));
               return;
           }
        });
    }
    else {
        console.log("scrape failed because site unsupported");
        result.send(JSON.stringify({"status": "fail", "msg": "Unsupported site."}));
    }
}

function loadPage(result, req, scraperScript/*url, scraperScript, clientData*/) {
    if(scraperScript == null) {
        console.log("scrape failed because site unsupported");
        result.send(JSON.stringify({"status": "fail", "msg": "Unsupported site."}));
        return;
    }
    
    console.log("scraping");
    var page = new Horseman({'timeout':30000});
    
    page
        .userAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36")
        .on("timeout", function(msg) {
            console.log("timeout");
            result.send(JSON.stringify({"status": "fail", "msg": "Server timed out :("}));   
        })
        .on('consoleMessage', function( msg ){
            //console.log(msg);
        })
        .on('error', console.error)
        .open(/*url*/req.body.url)
        .status()
        .then(function (statusCode) {
            if (Number(statusCode) >= 400) {
                result.send(JSON.stringify({"status": "fail", "msg": "Couldn't load page..."}));
                page.close();
                return;
            } 
            else {
                console.log("Page loaded....");
            }
        })
        .catch(function (err) {
            console.log('Error: ', err);
            result.send(JSON.stringify({"status": "fail", "msg": "Network error, aborting"}));
            page.close();
            return;
        })
        .injectJs("scripts/underscore.js")
        .injectJs("scripts/sel.js")
        .injectJs("scripts/extra.js")
        .injectJs("scripts/parse.js")
        .injectJs("scripts/beach.js")
        .injectJs("scripts/process_data.js")
        .injectJs("sites/" + scraperScript + ".js")
        .evaluate(function(done) {
            console.log("starting");
            try {
                vs_init();
                var checkInt = setInterval(function() {
                    if(getVSData() != null) {
                        clearInterval(checkInt);
                        done(null, getVSData());
                    }
                }, 500);
            }
            catch(err) {
                // do nothing, just wait
                // strike that, switch to a better library
            }
        })
        .then(function(msg) {
            //console.log("LENGTH: " + msg);
            console.log("parsing complete");
            //console.log(msg);
            var instance_id = randomString(50);

            result.send(JSON.stringify({"status": "success", "msg": msg, "instance_id": instance_id}));

            var time = Date.now();
            page.screenshot("screenshots/" + instance_id + "_server.png").then(function() {
                console.log(Date.now() - time);
                var toSend = {  "client_data": req.body.vs_prices, 
                                "server_data": msg, 
                                "instance_id": instance_id,
                                "pid": req.body.pid,
                                "url": req.body.url     };

                vsRequest("personalization/create_scrape_data/", toSend, function() {
                    console.log("data submitted to vs remote");
                });

                page.close();   
            });
        });
}

var vs_url = "http://localhost:8000/";
//var vs_url = "https://volunteerscience.com/";
function vsRequest(url, data, cb) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', vs_url + url);
    xhttp.responseType = 'json';
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.responseType = 'json';
    xhttp.onload = function() {
        if(typeof cb == "function") {
            cb(xhttp.response);
        }
    };
    xhttp.send(JSON.stringify(data));
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

function uploadImage(keyname, filename) {
    var r = request.post(vs_url + 'personalization/upload_scrape_image/', function(err, httpResponse, body) {
        if(err) {
            return console.error('upload failed:', err);
        }
        console.log("UPLOAD SUCCEEDED! " + body);
    });
    var form = r.form();
    form.append(keyname, fs.createReadStream(filename));
}