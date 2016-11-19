var vs_data = null;
window.vs_scraper = true;

function vs_scraper_done(labels) {
    vs_data = collectiveArr;//collectPriceData(labels);
}

function getVSData() {
    return vs_data;
}

function vs_init_ui() {
    console.log("continuing");
    vs_continue();
}

function disableInterface() {
    console.log("interface disabled");
}