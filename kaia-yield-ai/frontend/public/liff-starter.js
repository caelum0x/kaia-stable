/**
 * LIFF Starter for KAIA YIELD AI
 * Initialize LINE Front-end Framework for Mini dApp
 */

window.onload = function() {
    const useNodeJS = true;   // if you are not using a node server, set this value to false
    const defaultLiffId = "";   // change the default LIFF value if you are not using a node server

    // DO NOT CHANGE THIS
    let myLiffId = "";

    // if node is used, fetch the environment variable and pass it to the LIFF method
    // otherwise, pass defaultLiffId
    if (useNodeJS) {
        fetch('/send-id')
            .then(function(reqResponse) {
                return reqResponse.json();
            })
            .then(function(jsonResponse) {
                myLiffId = jsonResponse.id;
                initializeLiffOrDie(myLiffId);
            })
            .catch(function(error) {
                console.log('Error getting LIFF ID:', error);
                // Fallback to environment variable or default
                myLiffId = process.env.NEXT_PUBLIC_LIFF_ID || defaultLiffId;
                initializeLiffOrDie(myLiffId);
            });
    } else {
        myLiffId = defaultLiffId;
        initializeLiffOrDie(myLiffId);
    }
};

/**
 * Initialize LIFF or display error messages
 */
function initializeLiffOrDie(myLiffId) {
    if (!myLiffId) {
        console.error('LIFF ID is not set. Please check your environment variables.');
        return;
    }

    liff.init({
        liffId: myLiffId
    }).then(() => {
        console.log('LIFF initialized successfully');

        // Send initialization success event
        if (window.parent) {
            window.parent.postMessage({
                type: 'LIFF_INITIALIZED',
                isLoggedIn: liff.isLoggedIn(),
                isInClient: liff.isInClient(),
                os: liff.getOS(),
                language: liff.getLanguage()
            }, '*');
        }

        // Auto-login if not logged in and in LINE client
        if (!liff.isLoggedIn() && liff.isInClient()) {
            liff.login();
        }

    }).catch((err) => {
        console.error('LIFF initialization failed', err);

        // Send error event
        if (window.parent) {
            window.parent.postMessage({
                type: 'LIFF_ERROR',
                error: err.message || 'LIFF initialization failed'
            }, '*');
        }
    });
}

/**
 * Send message to LINE chat
 */
function sendMessage(text) {
    if (!liff.isLoggedIn()) {
        console.error('User is not logged in');
        return Promise.reject('User is not logged in');
    }

    return liff.sendMessages([{
        type: 'text',
        text: text
    }]).then(() => {
        console.log('Message sent successfully');
    }).catch((err) => {
        console.error('Error sending message', err);
        throw err;
    });
}

/**
 * Share content using LIFF shareTargetPicker
 */
function shareContent(messages) {
    if (!liff.isLoggedIn()) {
        console.error('User is not logged in');
        return Promise.reject('User is not logged in');
    }

    if (!liff.isInClient()) {
        console.error('shareTargetPicker is only available in LINE client');
        return Promise.reject('shareTargetPicker is only available in LINE client');
    }

    return liff.shareTargetPicker(messages).then(() => {
        console.log('Content shared successfully');
    }).catch((err) => {
        console.error('Error sharing content', err);
        throw err;
    });
}

/**
 * Get user profile
 */
function getUserProfile() {
    if (!liff.isLoggedIn()) {
        console.error('User is not logged in');
        return Promise.reject('User is not logged in');
    }

    return liff.getProfile().then(profile => {
        console.log('Profile retrieved:', profile);
        return profile;
    }).catch(err => {
        console.error('Error getting profile', err);
        throw err;
    });
}

/**
 * Close LIFF window
 */
function closeLiffWindow() {
    if (!liff.isInClient()) {
        window.close();
    } else {
        liff.closeWindow();
    }
}

// Export functions for use in React components
window.liffHelper = {
    sendMessage,
    shareContent,
    getUserProfile,
    closeLiffWindow
};