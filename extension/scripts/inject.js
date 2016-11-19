if(typeof window.vs_scripts == "undefined") {
    //alert("injection underway");
    
    window.vs_scripts = true;
    
    //if(typeof jQuery == "undefined") 
    {
        var jquery = document.createElement('script');
        jquery.src = chrome.extension.getURL('scripts/jquery.js');
        jquery.id = "injected_jquery";
        document.body.appendChild(jquery);
    }
    
    //if(typeof _ == "undefined") 
    {
        var underscore = document.createElement('script');
        underscore.src = chrome.extension.getURL('scripts/underscore.js');
        underscore.id = "injected_underscore";
        document.body.appendChild(underscore);
    }

    var sel = document.createElement('script');
    sel.src = chrome.extension.getURL('scripts/sel.js');
    sel.id = "injected_sel";
    document.body.appendChild(sel);
    
    var merge = document.createElement('script');
    merge.src = chrome.extension.getURL('scripts/merge.js');
    merge.id = "injected_merge";
    document.body.appendChild(merge);

    var beach = document.createElement('script');
    beach.src = chrome.extension.getURL('scripts/beach.js');
    beach.id = "injected_beach";
    document.body.appendChild(beach);

    var debug = document.createElement('script');
    debug.src = chrome.extension.getURL('scripts/parse.js');
    debug.id = "injected_parse";
    document.body.appendChild(debug);
  
    var extra = document.createElement('script');
    extra.src = chrome.extension.getURL('scripts/extra.js');
    extra.id = "injected_extra";
    document.body.appendChild(extra);

    var debug = document.createElement('script');
    debug.src = chrome.extension.getURL('scripts/client_debug.js');
    debug.id = "injected_debug";
    document.body.appendChild(debug);
    
    var smart_ui = document.createElement('script');
    smart_ui.src = chrome.extension.getURL('smart/smart_ui.js');
    smart_ui.id = "injected_smart_ui";
    document.body.appendChild(smart_ui);
    
    var smart_sel = document.createElement('script');
    smart_sel.src = chrome.extension.getURL('smart/smart_sel.js');
    smart_sel.id = "injected_smart_sel";
    document.body.appendChild(smart_sel);
    
    /*var smart_sel_2 = document.createElement('script');
    smart_sel_2.src = chrome.extension.getURL('smart/smart_sel_2.js');
    smart_sel_2.id = "injected_smart_sel_2";
    document.body.appendChild(smart_sel_2);*/
    
    var smart_dict_file = document.createElement('script');
    smart_dict_file.src = chrome.extension.getURL('smart/dictionary.js');
    smart_dict_file.id = "injected_smart_dict_file";
    document.body.appendChild(smart_dict_file);
    
    var smart_dict = document.createElement('script');
    smart_dict.src = chrome.extension.getURL('smart/dict.js');
    smart_dict.id = "injected_smart_dict";
    document.body.appendChild(smart_dict);
    
    var smart_lcss = document.createElement('script');
    smart_lcss.src = chrome.extension.getURL('smart/lcss.js');
    smart_lcss.id = "injected_smart_lcss";
    document.body.appendChild(smart_lcss);
    
    var smart_ui_css = document.createElement('link');
    smart_ui_css.rel = "stylesheet";
    smart_ui_css.href = chrome.extension.getURL('css/smart_ui.css');
    smart_ui_css.id = "injected_smart_ui_css";
    document.body.appendChild(smart_ui_css);
    
    /*var bootstrap_css = document.createElement('link');
    bootstrap_css.rel = "stylesheet";
    bootstrap_css.href = chrome.extension.getURL('css/bootstrap.css');
    bootstrap_css.id = "injected_bootstrap_css";
    document.body.appendChild(bootstrap_css);*/
}