// There are no real accounts yet. The demo sign-in just remembers a sample manager in this browser.
const SESSION_KEY = 'hsg-session';

const DEMO_USER = {
  name: 'Refiloe Sibanda',
  role: 'Marketing manager',
  team: 'HSG marketing'
};

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function startSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true;
  } catch {
    return false;
  }
}

const startDemoSession = () => startSession(DEMO_USER);

function endSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

// Runs in the <head> so people never see a flash of the wrong page.
const pageType = document.documentElement.dataset.page;
const signedIn = readSession();
// The signed-in pages live in pages/, so the way back out is one level up
const SIGN_IN_PAGE = '../index.html';
const HOME_PAGE = pageType === 'app' ? 'decisions.html' : 'pages/decisions.html';

if (pageType === 'app' && !signedIn) location.replace(SIGN_IN_PAGE);
if (pageType === 'auth' && signedIn) location.replace(HOME_PAGE);
