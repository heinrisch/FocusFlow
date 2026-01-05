<script lang="ts">
  import { onMount } from 'svelte';
  import { storage, type Settings } from '../lib/storage';

  let settings: Settings | null = null;
  let newDomain = '';
  let error = '';

  onMount(async () => {
    settings = await storage.getSettings();
  });

  async function addDomain() {
    if (!settings) return;
    const domain = newDomain.trim().toLowerCase();
    
    // Basic validation
    if (!domain) return;
    if (settings.blockedDomains.includes(domain)) {
      error = 'Domain already in list';
      return;
    }
    
    // Normalize: remove http/https if present
    const normalized = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    settings.blockedDomains = [...settings.blockedDomains, normalized];
    await storage.setSettings({ blockedDomains: settings.blockedDomains });
    newDomain = '';
    error = '';
  }

  async function removeDomain(domain: string) {
    if (!settings) return;
    settings.blockedDomains = settings.blockedDomains.filter(d => d !== domain);
    await storage.setSettings({ blockedDomains: settings.blockedDomains });
  }
</script>

<div class="options-container">
  <div class="content">
    <header class="header">
      <h1>FocusFlow Settings</h1>
      <p class="subtitle">Configure your focus sessions and block list.</p>
    </header>

    <div class="glass-card">
      <h2 class="section-title">Blocked Domains</h2>
      
      <div class="input-group">
        <input 
          type="text" 
          bind:value={newDomain} 
          placeholder="e.g. youtube.com" 
          class="domain-input"
          on:keydown={(e) => e.key === 'Enter' && addDomain()}
        />
        <button on:click={addDomain} class="btn-primary">Add Domain</button>
      </div>
      
      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <div class="domain-list">
        {#if settings?.blockedDomains && settings.blockedDomains.length > 0}
          {#each settings.blockedDomains as domain}
            <div class="domain-item">
              <span class="domain-name">{domain}</span>
              <button 
                on:click={() => removeDomain(domain)}
                class="remove-btn"
                title="Remove domain"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          {/each}
        {:else}
          <p class="empty-state">No blocked domains yet. Add one above to get started.</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  :global(body, html) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-family: 'Inter', -apple-system, system-ui, sans-serif;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%);
    min-height: 100vh;
  }

  .options-container {
    min-height: 100vh;
    padding: 40px 20px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .content {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 8px;
  }

  .header h1 {
    font-size: 36px;
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
    margin: 0;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(48px);
    -webkit-backdrop-filter: blur(48px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 32px;
    padding: 40px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .section-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 24px 0;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .domain-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    padding: 14px 16px;
    border-radius: 12px;
    font-size: 15px;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .domain-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .domain-input:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  .btn-primary {
    background: #6366f1;
    color: #ffffff;
    border: none;
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    white-space: nowrap;
  }

  .btn-primary:hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .error-message {
    color: #f43f5e;
    font-size: 14px;
    margin: -12px 0 16px 0;
    font-weight: 500;
  }

  .domain-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .domain-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .domain-item:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .domain-name {
    color: #ffffff;
    font-size: 15px;
    font-weight: 500;
  }

  .remove-btn {
    background: transparent;
    border: none;
    color: #cbd5e1;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0.7;
  }

  .remove-btn:hover {
    color: #f43f5e;
    background: rgba(244, 63, 94, 0.1);
    opacity: 1;
  }

  .empty-state {
    color: #cbd5e1;
    font-size: 14px;
    text-align: center;
    padding: 24px;
    font-style: italic;
  }
</style>
