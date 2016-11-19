var scraper = document.createElement('script');
scraper.src = chrome.extension.getURL('sites/amazon.js');
scraper.id = "injected_scraper";
document.body.appendChild(scraper);