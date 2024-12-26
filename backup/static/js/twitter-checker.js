// Twitter Handle Checker Socket Handling
document.addEventListener('socketReady', () => {
    window.socket.on('check_result', (data) => {
        const resultsList = document.getElementById('results');
        const resultItem = document.createElement('div');
        resultItem.className = `alert ${data.available ? 'alert-success' : 'alert-danger'}`;
        resultItem.textContent = `@${data.handle}: ${data.available ? 'Available!' : 'Taken'}`;
        resultsList.appendChild(resultItem);
    });

    window.socket.on('progress_update', (data) => {
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${data.progress}%`;
        progressBar.textContent = `${data.progress}%`;
    });

    window.socket.on('rate_limit', (data) => {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = `Rate limit reached. Waiting ${data.waitTime} seconds...`;
    });

    window.socket.on('error', (data) => {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = `Error: ${data.message}`;
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const checkerForm = document.getElementById('checker-form');
    const resultsDiv = document.getElementById('results');
    const progressBar = document.getElementById('progress-bar');
    const waitingMessage = document.getElementById('waiting-message');

    checkerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const bearerToken = document.getElementById('bearer-token').value;
        const usernames = document.getElementById('usernames').value
            .split(/[\s,]+/)
            .filter(username => username.trim() !== '');

        if (!bearerToken) {
            alert('Please enter your X API Bearer Token');
            return;
        }

        if (usernames.length === 0) {
            alert('Please enter at least one username to check');
            return;
        }

        console.log(`Checking ${usernames.length} usernames...`);
        
        // Clear previous results
        resultsDiv.innerHTML = '';
        progressBar.classList.remove('d-none');
        waitingMessage.classList.remove('d-none');
        waitingMessage.textContent = 'Checking usernames...';

        try {
            const response = await fetch('/check-usernames', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bearer_token: bearerToken,
                    usernames: usernames
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response received:', data);

            // Process results
            data.results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = `result-item ${result.status}`;
                resultItem.textContent = `@${result.username}: ${result.message}`;
                resultsDiv.appendChild(resultItem);
            });

        } catch (error) {
            console.error('Error checking usernames:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'result-item error';
            errorDiv.textContent = `Error: ${error.message}`;
            resultsDiv.appendChild(errorDiv);
        } finally {
            progressBar.classList.add('d-none');
            waitingMessage.classList.add('d-none');
        }
    });
}); 