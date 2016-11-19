var scraper = document.createElement('script');
scraper.src = chrome.extension.getURL('sites/google-flights.js');
scraper.id = "injected_scraper";
document.body.appendChild(scraper);