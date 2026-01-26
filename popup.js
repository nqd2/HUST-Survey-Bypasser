document.addEventListener('DOMContentLoaded', function() {
    const alertToggle = document.getElementById('alertToggle');
    const autoFillToggle = document.getElementById('autoFillToggle');

    // params: keys ['enableAlert', 'enableAutoFill']
    // output: result contains settings
    chrome.storage.sync.get(['enableAlert', 'enableAutoFill'], function(result) {
        alertToggle.checked = result.enableAlert !== false;
        autoFillToggle.checked = result.enableAutoFill !== false;
    });

    // params: event 'change', callback
    alertToggle.addEventListener('change', function() {
        // params: object { enableAlert: boolean }, callback
        chrome.storage.sync.set({ enableAlert: alertToggle.checked }, function() {
            console.log('Alert setting saved');
        });
    });

    // params: event 'change', callback
    autoFillToggle.addEventListener('change', function() {
        // params: object { enableAutoFill: boolean }, callback
        chrome.storage.sync.set({ enableAutoFill: autoFillToggle.checked }, function() {
            console.log('Auto Fill setting saved');
        });
    });
});
