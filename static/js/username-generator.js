// Username Generator Socket Handling
document.addEventListener('socketReady', () => {
    window.socket.on('usernames', (data) => {
        const generatedUsernames = document.getElementById('generated-usernames');
        generatedUsernames.innerHTML = '';

        // Clone the template
        const template = document.getElementById('generated-list-template');
        const listContainer = template.content.cloneNode(true);

        // Get the textarea and set the usernames
        const textarea = listContainer.querySelector('.generated-text');
        textarea.value = data.usernames.join('\n');

        // Set up copy button
        const copyBtn = listContainer.querySelector('.copy-btn');
        copyBtn.onclick = () => {
            textarea.select();
            document.execCommand('copy');
            copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Copied!
            `;
            setTimeout(() => {
                copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                    </svg>
                    Copy All
                `;
            }, 2000);
        };

        // Set up send to checker button
        const sendBtn = listContainer.querySelector('.send-to-bot-btn');
        sendBtn.onclick = () => {
            document.getElementById('usernames').value = data.usernames.join('\n');
            document.querySelector('.left-section').scrollIntoView({ behavior: 'smooth' });
        };

        generatedUsernames.appendChild(listContainer);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const aiProviderSelect = document.getElementById('ai-provider');
    const aiModelSelect = document.getElementById('ai-model');
    const apiKeyLink = document.getElementById('api-key-link');
    
    // Define available models and API links for each provider
    const providerInfo = {
        'openai': {
            models: [
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' }
            ],
            apiLink: 'https://platform.openai.com/api-keys',
            name: 'OpenAI'
        },
        'anthropic': {
            models: [
                { value: 'claude-2', label: 'Claude 2' }
            ],
            apiLink: 'https://console.anthropic.com/account/keys',
            name: 'Anthropic'
        },
        'google': {
            models: [
                { value: 'gemini-pro', label: 'Gemini Pro' }
            ],
            apiLink: 'https://makersuite.google.com/app/apikey',
            name: 'Google'
        }
    };

    // Function to update model options
    function updateModelOptions() {
        const selectedProvider = aiProviderSelect.value;
        const provider = providerInfo[selectedProvider];
        
        // Update API key link
        apiKeyLink.href = provider.apiLink;
        apiKeyLink.querySelector('span').textContent = `Get ${provider.name} API Key`;
        
        // Clear existing options
        aiModelSelect.innerHTML = '';
        
        // Add new options
        provider.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            aiModelSelect.appendChild(option);
        });
    }

    // Update models when provider changes
    aiProviderSelect.addEventListener('change', updateModelOptions);

    // Initial update
    updateModelOptions();
}); 