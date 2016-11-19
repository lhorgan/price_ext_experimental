var myTab = null;
var mySearchId = null;

function getCurrentTab() {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
//    var url = tab.url;
    myTab = tab.id;
    
    chrome.runtime.sendMessage({"vs_column_rebroadcast": myTab}, function(response) {
      
    });
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.hasOwnProperty('vs_column')) { // from the hook
    if (request.tab==myTab) {
      // it's for me
      if (request.search_id != mySearchId) {
        mySearchId = request.search_id;
        resetTable();
      }
      addColumn(request.vs_column, request.data);
      
      $('#status').append('<p>Tab:'+myTab+' search_id:'+request.search_id+' Got data for '+request.vs_column+'</p>');
    }
  }
});

function resetTable() {
  
}
    
function addColumn(name, data) {
  
}
    
document.addEventListener('DOMContentLoaded', function() {
  console.log("VS popup loaded");
  getCurrentTab();
});
