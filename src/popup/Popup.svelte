<script lang="ts">
  import { onMount } from 'svelte';
  import { storage, type SessionState, type Settings } from '../lib/storage';

  let session: SessionState | null = null;
  let settings: Settings | null = null;
  let selectedDuration = 25;
  let remainingTime = '';
  let timerInterval: number;
  let progress = 100;

  onMount(async () => {
    session = await storage.getSession();
    settings = await storage.getSettings();

    if (session?.active) {
      startTimer();
    }

    const unsubscribe = storage.onChanged((changes, area) => {
      if (area === 'local' && changes.session) {
        session = changes.session.newValue;
        if (session?.active) {
          startTimer();
        } else {
          stopTimer();
        }
      }
    });

    return () => {
      unsubscribe();
      stopTimer();
    };
  });

  function startTimer() {
    updateRemainingTime();
    timerInterval = window.setInterval(updateRemainingTime, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function updateRemainingTime() {
    if (!session?.endsAtEpochMs) return;
    const now = Date.now();
    const diff = session.endsAtEpochMs - now;

    if (diff <= 0) {
      remainingTime = '00:00';
      progress = 0;
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Progress calculation
    progress = Math.max(0, Math.min(100, (diff / (selectedDuration * 60 * 1000)) * 100));
  }

  async function handleStart() {
    await chrome.runtime.sendMessage({ type: 'START_SESSION', durationMinutes: selectedDuration });
    session = await storage.getSession();
  }

  async function handleStop() {
    await chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
    session = await storage.getSession();
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }
</script>

<main>
  <div class="header">
    <h1 class="logo">FocusFlow</h1>
    <button on:click={openOptions} class="icon-btn" aria-label="Settings">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
  </div>

  {#if session?.active}
    <div class="session-active">
      <div class="timer-container">
        <svg viewBox="0 0 200 200" class="timer-svg">
          <circle cx="100" cy="100" r="90" class="timer-bg" />
          <circle 
            cx="100" 
            cy="100" 
            r="90" 
            class="timer-progress" 
            style="stroke-dashoffset: {565.48 * (1 - progress / 100)}" 
            stroke-dasharray="565.48"
          />
        </svg>
        <div class="timer-text">{remainingTime}</div>
      </div>
      <p class="status-text">Focusing...</p>
      <button on:click={handleStop} class="btn-primary stop-btn">
        Stop Session
      </button>
    </div>
  {:else}
    <div class="setup">
      <div class="field">
        <label for="duration">Duration (minutes)</label>
        <div class="presets">
          {#each settings?.durationPresets || [25, 45, 60, 90] as preset}
            <button 
              class="btn-secondary {selectedDuration === preset ? 'active' : ''}"
              on:click={() => selectedDuration = preset}
            >
              {preset}m
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <label for="custom">Custom Minutes</label>
        <input id="custom" type="number" bind:value={selectedDuration} min="1" max="1440" />
      </div>

      <button on:click={handleStart} class="btn-primary start-btn">
        Start Focus
      </button>
    </div>
  {/if}
</main>

<style>
  main {
    width: 320px;
    padding: 24px;
    background: var(--bg);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .logo {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(to right, #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;
  }

  .icon-btn:hover {
    color: var(--text);
  }

  .session-active {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
  }

  .timer-container {
    position: relative;
    width: 180px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  .timer-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .timer-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 8;
  }

  .timer-progress {
    fill: none;
    stroke: var(--primary);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }

  .timer-text {
    font-size: 32px;
    font-weight: 700;
    font-family: monospace;
  }

  .status-text {
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 24px;
  }

  .setup {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .presets {
    display: grid;
    grid-cols: 2; /* CSS grid-template-columns */
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .btn-secondary.active {
    border-color: var(--primary);
    color: var(--primary);
    background: rgba(99, 102, 241, 0.1);
  }

  input {
    width: 100%;
    box-sizing: border-box;
  }

  .stop-btn {
    background: var(--accent);
    width: 100%;
  }

  .stop-btn:hover {
    background: #e11d48;
  }

  .start-btn {
    width: 100%;
    margin-top: 8px;
  }
</style>
