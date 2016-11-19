var interface = document.createElement('script');
interface.src = chrome.extension.getURL('scripts/inject.js');
interface.id = "injected_interface";
document.body.appendChild(interface);