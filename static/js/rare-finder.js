// Rare Username Finder functionality
function setupRareFinder() {
    const rareFinderForm = document.getElementById('rare-finder-form');
    if (rareFinderForm) {
        rareFinderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const patternType = document.getElementById('pattern-type').value;
            const noUnderscore = document.getElementById('filter-no-underscore').checked;
            const noNumbers = document.getElementById('filter-no-numbers').checked;
            
            const submitButton = rareFinderForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Generating...';
            submitButton.disabled = true;
            
            try {
                let usernames = [];
                const resultsDiv = document.getElementById('rare-results');
                resultsDiv.innerHTML = '<div class="text-center">Generating rare usernames...</div>';
                
                switch (patternType) {
                    case 'numeric':
                        usernames = generateNumericUsernames(noUnderscore);
                        break;
                    case 'og':
                        usernames = generateOGUsernames(noUnderscore);
                        break;
                    case 'special':
                        usernames = generateSpecialUsernames(noUnderscore, noNumbers);
                        break;
                    case 'dictionary':
                        usernames = await generateDictionaryUsernames(noUnderscore, noNumbers);
                        break;
                }
                
                displayRareUsernames(usernames);
            } catch (error) {
                console.error('Error generating rare usernames:', error);
                document.getElementById('rare-results').innerHTML = 
                    '<div class="alert alert-danger">Error generating usernames. Please try again.</div>';
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
}

function generateNumericUsernames(noUnderscore) {
    const usernames = [];
    const length = Math.random() < 0.5 ? 3 : 4; // 50% chance of 3 or 4 digits
    const count = 20;
    
    for (let i = 0; i < count; i++) {
        let username = '';
        if (!noUnderscore && Math.random() < 0.3) { // 30% chance of underscore prefix
            username += '_';
        }
        
        // Generate random digits
        for (let j = 0; j < length; j++) {
            username += Math.floor(Math.random() * 10);
        }
        
        if (!noUnderscore && Math.random() < 0.3 && !username.startsWith('_')) { // 30% chance of underscore suffix
            username += '_';
        }
        
        usernames.push(username);
    }
    
    return usernames;
}

function generateOGUsernames(noUnderscore) {
    const usernames = [];
    const length = Math.random() < 0.5 ? 3 : 4; // 50% chance of 3 or 4 letters
    const count = 20;
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    
    for (let i = 0; i < count; i++) {
        let username = '';
        if (!noUnderscore && Math.random() < 0.3) { // 30% chance of underscore prefix
            username += '_';
        }
        
        // Generate random letters
        for (let j = 0; j < length; j++) {
            username += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        if (!noUnderscore && Math.random() < 0.3 && !username.startsWith('_')) { // 30% chance of underscore suffix
            username += '_';
        }
        
        usernames.push(username);
    }
    
    return usernames;
}

function generateSpecialUsernames(noUnderscore, noNumbers) {
    const usernames = [];
    const count = 20;
    const patterns = [
        // Special patterns that are likely to be available
        () => `${getRandomLetter()}${getRandomLetter()}${noNumbers ? '' : getRandomNumber()}`,
        () => `${noNumbers ? '' : getRandomNumber()}${getRandomLetter()}${getRandomLetter()}`,
        () => `${getRandomLetter()}${noNumbers ? getRandomLetter() : getRandomNumber()}${getRandomLetter()}`,
        () => noUnderscore ? `${getRandomLetter()}${getRandomLetter()}${getRandomLetter()}` : 
              `_${getRandomLetter()}${getRandomLetter()}_`
    ];
    
    for (let i = 0; i < count; i++) {
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        usernames.push(pattern());
    }
    
    return usernames;
}

async function generateDictionaryUsernames(noUnderscore, noNumbers) {
    const words = [
        'cat', 'dog', 'fox', 'owl', 'bat', 'elk', 'bee', 'ant', 'fly',
        'sky', 'sun', 'moon', 'star', 'rain', 'wind', 'snow', 'leaf',
        'red', 'blue', 'gold', 'pink', 'gray', 'cool', 'epic', 'pure'
    ];
    
    const usernames = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
        let username = '';
        const word = words[Math.floor(Math.random() * words.length)];
        
        if (!noUnderscore && Math.random() < 0.3) {
            username += '_';
        }
        
        username += word;
        
        if (!noNumbers && Math.random() < 0.5) {
            username += Math.floor(Math.random() * 100);
        }
        
        if (!noUnderscore && Math.random() < 0.3 && !username.startsWith('_')) {
            username += '_';
        }
        
        usernames.push(username);
    }
    
    return usernames;
}

function getRandomLetter() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return letters.charAt(Math.floor(Math.random() * letters.length));
}

function getRandomNumber() {
    return Math.floor(Math.random() * 10);
}

function displayRareUsernames(usernames) {
    const resultsDiv = document.getElementById('rare-results');
    
    // Create a list group for the usernames
    let html = '<div class="list-group mt-3">';
    usernames.forEach(username => {
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span class="username">@${username}</span>
                <button class="btn btn-sm btn-outline-primary check-username" 
                        onclick="addToChecker('${username}')">
                    Check Availability
                </button>
            </div>
        `;
    });
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

function addToChecker(username) {
    const usernamesTextarea = document.getElementById('usernames');
    if (usernamesTextarea) {
        const currentValue = usernamesTextarea.value;
        usernamesTextarea.value = currentValue ? `${currentValue}, ${username}` : username;
        
        // Scroll to the checker section
        document.querySelector('.left-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Export the setup function for use in wallet.js
window.setupRareFinder = setupRareFinder; 