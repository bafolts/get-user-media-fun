/**
 * background.js
 * * This script acts as the central hub for the extension.
 * - It listens for changes to the filter setting in chrome.storage.
 * - When a filter is changed, it broadcasts the new filter to all content scripts.
 * - It also listens for messages from content scripts requesting the current filter value.
 */

// Listen for when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  // Set a default filter on installation to ensure a value exists.
  chrome.storage.local.set({ filter: 'none' });
  console.log('GetUserMediaFun extension installed and default filter set.');
});

// Listen for any changes in the extension's local storage.
chrome.storage.onChanged.addListener((changes, namespace) => {
  // Check if the 'filter' value was the one that changed.
  if (changes.filter) {
    const newFilterValue = changes.filter.newValue;
    console.log(`Filter changed to: ${newFilterValue}. Notifying content scripts.`);
    
    // Send a message to all tabs with the updated filter.
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'filterChanged', filter: newFilterValue })
          .catch(error => {
            // This error is expected if a tab doesn't have the content script injected.
            if (!error.message.includes("Could not establish connection")) {
                 console.log(`Could not send message to tab ${tab.id}: ${error.message}`);
            }
          });
      });
    });
  }
});

// Listen for direct messages from content scripts.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle the case where the content script is asking for the current filter.
  if (request.type === 'getFilter') {
    chrome.storage.local.get(['filter'], (result) => {
      console.log(`Content script requested filter. Sending: ${result.filter}`);
      sendResponse({ filter: result.filter });
    });
    // Return true to indicate that we will send a response asynchronously.
    return true;
  }
});

