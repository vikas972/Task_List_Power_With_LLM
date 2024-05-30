document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const modelNameInput = document.getElementById('modelName');
    const saveButton = document.getElementById('saveButton');

    // Load the API key and model name from storage
    chrome.storage.local.get(['hf_api_token', 'model_name'], function(result) {
        if (result.hf_api_token) {
            apiKeyInput.value = result.hf_api_token;
        }
        if (result.model_name) {
            modelNameInput.value = result.model_name;
        }
    });

    // Save the API key and model name to storage
    saveButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value;
        const modelName = modelNameInput.value;
        chrome.storage.local.set({ hf_api_token: apiKey, model_name: modelName }, function() {
            alert('API settings saved.');
        });
    });
});
