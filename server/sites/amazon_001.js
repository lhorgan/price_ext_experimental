var vsScraperVersion = "001";

if(typeof window.vs_scraper == "undefined") {
    window.vs_scraper = true;
    vs_init();
}

function vs_init() {
    vs_init_ui();
}

function vs_continue() {
   var jsonBlock = 
        [
            {"desc":[{"chain":[{"class-":"+access-title"},{"class-":"+text-normal"}]},{"name":"temp_titles"}]},
         
            {"desc":[{"super":{"ref":"temp_titles"}},{"name":"vs_container","vsid":"generate","tag":true}]},
         
            {"desc":[{"chain":[{"class-":"+-price"},{"class-":"+a-text-bold"},{"contents-20":"+$"}]},{"ctxt":{"ref":"vs_container"},"cascade":true,"name":"vs_price","vsid":"generate","tag":true,"deep":true,"grab":"text","mandatory":true}]},
         
            {"desc":[{"chain":[{"class-":"+access-title"},{"class-":"+text-normal"}]},{"name":"vs_anchor","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","tag":true,"cascade":true,"grab":"text,data-attribute","mandatory":true}]},
         
            {"desc":[{"chain":[{"class-":"+s-access-image"},{"tag-":"=img"}]},{"name":"vs_product_img","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","tag":true,"cascade":true,"grab":"src,srcset"}]},
            
            {"desc":[{"chain":[{"class-":"+a-size-small"},{"class-":"+a-color-null"},{"class-":"+s-inline"},{"class-":"+a-text-normal"}]},{"name":"vs_price::{\"above\":10,\"name\":\"primary_label\",\"gap-above\":10}","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","tag":true,"cascade":true,"grab":"text"}]},
            
            {"desc":[{"chain":[{"class-":"+a-size-small"},{"class-":"+a-color-secondary"},{"contents-30":"[+l]more buying choices"}]},{"name":"vs_price::{\"name\":\"secondary_label\",\"above\":10,\"gap-above\":10}","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","tag":true,"cascade":true,"grab":"text"}]},
            
            {"desc":[{"chain":[{"nav-":"parent"}]},{"name":"vs_price::{\"name\":\"tertiary_label\",\"limit\":1}","ctxt":{"ref":"vs_price"},"split":true, "vsid":"generate","tag":true,"cascade":true,"grab":"tert"}]}
        ];
    
    registerType("tert", function(elem) {
        var txt = $(elem).text().trim();
        
        var priceChars = ["0","1","2","3","4","5","6","7","8","9","."];
        var lastPriceCharInd = -1;
        for(var i = 0; i < txt.length; i++) {
            if(txt[i] == "$") {
                lastPriceCharInd = -1;
                for(var j = i + 1; j < txt.length; j++) {
                    if(priceChars.indexOf(txt[j]) < 0) {
                        lastPriceCharInd = j - 1;
                        break;
                    }
                }
            }
        }
        
        if(lastPriceCharInd >= 0) {
            return txt.substr(lastPriceCharInd + 1).trim();
        }
        
        return undefined;
    });
    
    processJSON(jsonBlock);
    vs_scraper_done(labels);
}