var jquery = document.createElement('script');
jquery.src = chrome.extension.getURL('scripts/jquery.js');
jquery.id = "injected_jquery";
document.body.appendChild(jquery);

var underscore = document.createElement('script');
underscore.src = chrome.extension.getURL('scripts/underscore.js');
underscore.id = "injected_underscore";
document.body.appendChild(underscore);

var sel = document.createElement('script');
sel.src = chrome.extension.getURL('scripts/sel.js');
sel.id = "injected_sel";
document.body.appendChild(sel);

var test = document.createElement('script');
test.src = "function nifty() { alert('sweet') }";
test.id = "injected_test";
document.body.appendChild(test);