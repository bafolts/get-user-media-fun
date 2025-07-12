/**
 * content.js
 * * This script acts as a bridge between the extension's background script 
 * and the page's own JavaScript context (where injected.js runs).
 * It cannot directly modify the page's JavaScript variables or functions.
 */

// 1. Inject the main script
const s = document.createElement('script');
s.type = 'module';
s.src = chrome.runtime.getURL('injected.js');
(document.head || document.documentElement).appendChild(s);
s.onload = function() {
  // Clean up the script tag from the DOM after it has been loaded.
  s.remove();
};

// 2. Listen for messages FROM the background script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // When the filter changes, forward the message to the page's context.
    if (message.type === 'filterChanged') {
        console.log('Content script received filter change, forwarding to page.');
        window.postMessage({ type: 'FROM_EXTENSION_FILTER_UPDATE', filter: message.filter }, '*');
    }
});

// 3. Listen for messages FROM the page's context (injected.js).
window.addEventListener('message', (event) => {
    // We only accept messages from the window itself.
    if (event.source !== window || !event.data.type) {
        return;
    }

    // When the page asks for the current filter, forward the request to the background script.
    if (event.data.type === 'FROM_PAGE_GET_FILTER') {
        console.log('Content script received request for filter from page, asking background.');
        chrome.runtime.sendMessage({type: 'getFilter'}, (response) => {
            // Handle potential errors, e.g., if the background script is inactive.
            if(chrome.runtime.lastError) {
                console.error("Error getting filter:", chrome.runtime.lastError.message);
                return;
            }
            // Forward the response from the background script back to the page.
            window.postMessage({ type: 'FROM_EXTENSION_FILTER_UPDATE', filter: response.filter }, '*');
        });
    }
});

