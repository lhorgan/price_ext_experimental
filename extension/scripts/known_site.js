chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.hasOwnProperty("plugin_iframe")) {
        var data = request.plugin_iframe;
        if(data.hasOwnProperty("launch_main_modal")) {
            $("#vs_modal").modal("show");
        }
        else if(data.hasOwnProperty("launch_survey_modal")) {
            $("#vs_modal_survey").modal("show");
        }
    }
});

function initFrame() {
    $("#sureButton").click(function() {
        //chrome.runtime.sendMessage({"iframe": true}, function(response) {});
        messagePlugin({"scrape_start": true});
    });
    
    $("#vs_modal").on("hidden.bs.modal", function () {
        //alert("closed");
        messagePlugin({"modal_closed": true});
    });
    
    $("#sureButtonSurvey").click(function() {
        var survey_dialog = $("#vs_modal_survey");
        survey_dialog.find(".modal-dialog").css("width", "80%");
        survey_dialog.find(".modal-body").html("<iframe src='https://volunteerscience.com/amt/test/ea8ba18bbe50aeabb127/' style='width:100%; height:500px;'></iframe>");
        survey_dialog.find(".survey_close").text("Done");
        $(this).remove();
    });
    
    $("#vs_modal_survey").on("hidden.bs.modal", function () {
        messagePlugin({"survey_modal_closed": true});
    });
}

function messagePlugin(data) {
    chrome.runtime.sendMessage({"iframe_plugin": data}, function(response) {});
}

document.addEventListener('DOMContentLoaded', function () {
    initFrame();
});