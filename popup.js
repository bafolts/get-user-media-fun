const filterSelect = document.getElementById('filterSelect');

// Load saved filter
chrome.storage.local.get(['filter'], function(result) {
  if (result.filter) {
    filterSelect.value = result.filter;
  }
});

filterSelect.addEventListener('change', () => {
  const filter = filterSelect.value;
  chrome.storage.local.set({filter: filter});
});

