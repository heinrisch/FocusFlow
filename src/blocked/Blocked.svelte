<script lang="ts">
  import { onMount } from 'svelte';
  import { storage, type SessionState } from '../lib/storage';
  const bgImage = '/assets/blocked_bg.png';

  let session: SessionState | null = null;
  let remainingTime = '00:00';
  let domain = '';
  let timerInterval: number;

  onMount(async () => {
    const url = new URL(window.location.href);
    domain = url.searchParams.get('domain') || 'this site';

    session = await storage.getSession();
    
    if (session?.active) {
      updateRemainingTime();
      timerInterval = window.setInterval(updateRemainingTime, 1000);
    }

    const unsubscribe = storage.onChanged((changes, area) => {
      if (area === 'local' && changes.session) {
        session = changes.session.newValue;
        if (!session?.active) {
          clearInterval(timerInterval);
        }
      }
    });

    return () => {
      unsubscribe();
      clearInterval(timerInterval);
    };
  });

  function updateRemainingTime() {
    if (!session?.endsAtEpochMs) return;
    const now = Date.now();
    const diff = session.endsAtEpochMs - now;

    if (diff <= 0) {
      remainingTime = 'Finish';
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
</script>

<div class="blocked-container" style="--bg-url: url({bgImage})">
  <div class="overlay"></div>
  
  <main class="content">
    <div class="glass-card">
      <div class="icon-sphere">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>

      <h1>Focus Mode Active</h1>
      <p class="subtitle">
        FocusFlow is currently shielding you from <strong>{domain}</strong>.
      </p>

      {#if session?.active}
        <div class="timer-section">
          <div class="timer-display">{remainingTime}</div>
          <p class="timer-label">UNTIL BREAK TIME</p>
        </div>
      {:else}
        <div class="ended-section">
          <h2 class="success-text">Session Complete!</h2>
          <p>You can now return to your task or take a short break.</p>
          <button on:click={() => window.location.reload()} class="btn-primary">
            Try accessing site again
          </button>
        </div>
      {/if}

      <div class="actions">
        <button on:click={goBack} class="btn-primary large">
          Back to Work
        </button>
        <button on:click={openOptions} class="btn-secondary">
          Configure Block List
        </button>
      </div>
    </div>
    
    <footer class="footer">
      Powered by <span class="logo-text">FocusFlow</span>
    </footer>
  </main>
</div>

<style>
  :global(body, html) {
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
    background: radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%);
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
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(48px);
    -webkit-backdrop-filter: blur(48px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    padding: 60px 40px;
    text-align: center;
    width: 100%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
    background: linear-gradient(to right, #fff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    color: #94a3b8;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 40px 0;
    max-width: 320px;
  }

  .subtitle strong {
    color: white;
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
    color: #475569;
    margin-top: 4px;
    text-transform: uppercase;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
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
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer {
    font-size: 14px;
    color: #475569;
  }

  .logo-text {
    font-weight: 700;
    background: linear-gradient(to right, #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .success-text {
    color: #10b981;
    margin-bottom: 8px;
  }
</style>
