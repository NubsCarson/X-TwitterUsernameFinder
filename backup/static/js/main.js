// Initialize all components when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket.io connection
    window.socket = io();
    
    // Dispatch socket ready event
    const socketReadyEvent = new CustomEvent('socketReady');
    window.socket.on('connect', () => {
        document.dispatchEvent(socketReadyEvent);
    });
    
    // Initialize forms
    const checkerForm = document.getElementById('checker-form');
    const generatorForm = document.getElementById('generator-form');

    // Handle Twitter Handle Checker form submission
    checkerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const results = document.getElementById('results');
        results.innerHTML = '';
        const progressBar = document.getElementById('progress-bar');
        progressBar.classList.remove('d-none');
        
        const usernamesInput = document.getElementById('usernames').value;
        const usernames = usernamesInput
            .split(/[\s,]+/)
            .map(u => u.trim())
            .filter(u => u.length > 0);
        
        window.socket.emit('check_handles', {
            bearer_token: document.getElementById('bearer-token').value,
            usernames: usernames
        });
    });

    // Handle Username Generator form submission
    generatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const generatedUsernames = document.getElementById('generated-usernames');
        generatedUsernames.innerHTML = '<div class="alert alert-info">Generating usernames...</div>';
        
        window.socket.emit('generate_usernames', {
            provider: document.getElementById('ai-provider').value,
            model: document.getElementById('ai-model').value,
            api_key: document.getElementById('api-key').value,
            prompt: document.getElementById('prompt').value,
            count: parseInt(document.getElementById('count').value)
        });
    });

    console.log('Application initialized');
}); 