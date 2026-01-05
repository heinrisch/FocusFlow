import '../styles/main.css';
import { storage, type SessionState } from '../lib/storage';

const bgImage = '/assets/blocked_bg.png';

// State
let session: SessionState | null = null;
let remainingTime = '00:00';
let domain = '';
let timerInterval: ReturnType<typeof setInterval> | undefined = undefined;

// DOM elements
const app = document.getElementById('app')!;

function updateRemainingTime() {
  if (!session?.endsAtEpochMs) {
    remainingTime = '00:00';
    updateUI();
    return;
  }

  const now = Date.now();
  const diff = session.endsAtEpochMs - now;

  if (diff <= 0) {
    remainingTime = 'Finish';
    updateUI();
    return;
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  updateUI();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  updateRemainingTime();
  timerInterval = setInterval(updateRemainingTime, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = undefined;
  }
}

function updateUI() {
  const timerDisplay = app.querySelector('.timer-display') as HTMLElement;
  const timerSection = app.querySelector('.timer-section') as HTMLElement;
  const endedSection = app.querySelector('.ended-section') as HTMLElement;
  const tryAccessBtn = app.querySelector('.try-access-btn') as HTMLElement;
  
  if (session?.active) {
    if (timerDisplay) timerDisplay.textContent = remainingTime;
    if (timerSection) timerSection.style.display = 'block';
    if (endedSection) endedSection.style.display = 'none';
    if (tryAccessBtn) tryAccessBtn.style.display = 'none';
  } else {
    if (timerSection) timerSection.style.display = 'none';
    if (endedSection) endedSection.style.display = 'block';
    if (tryAccessBtn) tryAccessBtn.style.display = 'block';
  }
}

function goBack() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.getCurrent((tab) => {
      if (tab && tab.id) {
        chrome.tabs.remove(tab.id);
      } else {
        window.close();
      }
    });
  } else {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  }
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}

function tryAccessSite() {
  if (!domain || domain === 'this site') {
    goBack();
    return;
  }
  
  const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  const targetUrl = `https://${normalizedDomain}`;
  
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.getCurrent((tab) => {
      if (tab && tab.id) {
        chrome.tabs.update(tab.id, { url: targetUrl });
      } else {
        window.location.href = targetUrl;
      }
    });
  } else {
    window.location.href = targetUrl;
  }
}

// Initialize
async function init() {
  const url = new URL(window.location.href);
  domain = url.searchParams.get('domain') || 'this site';

  // Create HTML structure
  app.innerHTML = `
    <div class="blocked-container" style="--bg-url: url(${bgImage})">
      <div class="overlay"></div>
      
      <main class="content">
        <div class="glass-card">
          <div class="icon-sphere">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>

          <h1>Focus Mode Active</h1>
          <p class="subtitle">
            FocusFlow is currently shielding you from <strong>${domain}</strong>.
          </p>

          <div class="timer-section" style="display: none;">
            <div class="timer-display">${remainingTime}</div>
            <p class="timer-label">UNTIL BREAK TIME</p>
          </div>
          
          <div class="ended-section" style="display: none;">
            <h2 class="success-text">Session Complete!</h2>
            <p>You can now return to your task or take a short break.</p>
          </div>

          <div class="actions">
            <button class="btn-primary large try-access-btn" style="display: none;">
              Try accessing site again
            </button>
            <button class="btn-primary large back-btn">
              Back to Work
            </button>
            <button class="btn-secondary options-btn">
              Configure Block List
            </button>
          </div>
        </div>
        
        <footer class="footer">
          Powered by <span class="logo-text">FocusFlow</span>
        </footer>
      </main>
    </div>
  `;

  // Add event listeners
  app.querySelector('.back-btn')?.addEventListener('click', goBack);
  app.querySelector('.options-btn')?.addEventListener('click', openOptions);
  app.querySelector('.try-access-btn')?.addEventListener('click', tryAccessSite);

  // Load session
  session = await storage.getSession();

  if (session?.active) {
    startTimer();
  }

  updateUI();

  // Listen for changes
  const unsubscribe = storage.onChanged((changes, area) => {
    if (area === 'local' && changes.session) {
      session = changes.session.newValue;
      if (session?.active) {
        startTimer();
      } else {
        stopTimer();
      }
      updateUI();
    }
  });

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
    stopTimer();
  });
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: 'Inter', -apple-system, system-ui, sans-serif;
  }

  .blocked-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    background-image: var(--bg-url);
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%);
    backdrop-filter: blur(4px);
    z-index: 1;
  }

  .content {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 500px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(48px);
    -webkit-backdrop-filter: blur(48px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 32px;
    padding: 60px 40px;
    text-align: center;
    width: 100%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: slideIn 1.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .icon-sphere {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #818cf8;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
  }

  h1 {
    font-size: 32px;
    font-weight: 800;
    margin: 0 0 12px 0;
    letter-spacing: -0.02em;
    color: #ffffff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    color: #e2e8f0;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 40px 0;
    max-width: 320px;
  }

  .subtitle strong {
    color: #ffffff;
    font-weight: 700;
  }

  .timer-section {
    margin-bottom: 40px;
  }

  .timer-display {
    font-size: 72px;
    font-weight: 800;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    letter-spacing: -0.05em;
    color: #6366f1;
    text-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
  }

  .timer-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: #cbd5e1;
    margin-top: 4px;
    text-transform: uppercase;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .btn-primary {
    background: #6366f1;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-primary:hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .btn-primary.large {
    padding: 16px 32px;
    font-size: 16px;
    width: 100%;
  }

  .btn-secondary {
    padding: 12px;
    font-size: 14px;
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
    font-weight: 600;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
  }

  .footer {
    font-size: 14px;
    color: #cbd5e1;
  }

  .logo-text {
    font-weight: 700;
    background: linear-gradient(to right, #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .ended-section {
    margin-bottom: 40px;
  }

  .ended-section p {
    color: #e2e8f0;
    margin-bottom: 20px;
  }

  .success-text {
    color: #10b981;
    margin-bottom: 8px;
    font-size: 24px;
    font-weight: 700;
  }
`;
document.head.appendChild(style);

init();
