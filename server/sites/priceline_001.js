if(typeof window.vs_scraper == "undefined") {
    window.vs_scraper = true;
    vs_init();
}

function vs_init() {
    waitFor([{"class-":"=next"}, {"tag-":"=BUTTON"}], 1000, function() {
        vs_continue();
    });
}

function vs_continue() {
    var jsonBlock = 
        [{"desc":[{"chain":[{"prop-bo-html":"=hotel.name"}]},{"name":"temp_title"}]},{"desc":[{"super":{"ref":"temp_title"}},{"name":"vs_container","vsid":"generate","tag":true}]},{"desc":[{"chain":[{"prop-bo-html":"=hotel.name"}]},{"name":"vs_hotel_name","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","grab":"text","mandatory":true,"cascade":true,"tag":true}]},{"desc":[{"chain":[{"class-":"=price-wrapper"}]},{"name":"vs_price","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","grab":"text","mandatory":true,"tag":true,"cascade":true}]},{"desc":[{"chain":[{"class-":"+thumbnail"},{"class-":"+img"},{"tag-":"=IMG"}]},{"name":"vs_hotel_img","deep":true,"ctxt":{"ref":"vs_container"},"vsid":"generate","grab":"src,alt","mandatory":false,"tag":true,"cascade":true}]}];
    
    processJSON(jsonBlock);
    
    vs_scraper_done(labels);
}