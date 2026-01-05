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

  async function updateTheme(theme: 'light' | 'dark' | 'system') {
    if (!settings) return;
    settings.uiTheme = theme;
    await storage.setSettings({ uiTheme: theme });
  }
</script>

<div class="max-w-2xl mx-auto p-12">
  <header class="mb-12">
    <h1 class="text-4xl font-bold mb-2">FocusFlow Settings</h1>
    <p class="text-text-muted">Configure your focus sessions and block list.</p>
  </header>

  <section class="card mb-8">
    <h2 class="text-xl font-semibold mb-6">Blocked Domains</h2>
    
    <div class="flex gap-2 mb-6">
      <input 
        type="text" 
        bind:value={newDomain} 
        placeholder="e.g. youtube.com" 
        class="flex-1"
        on:keydown={(e) => e.key === 'Enter' && addDomain()}
      />
      <button on:click={addDomain} class="btn-primary">Add Domain</button>
    </div>
    
    {#if error}
      <p class="text-accent text-sm mb-4">{error}</p>
    {/if}

    <div class="space-y-2">
      {#each settings?.blockedDomains || [] as domain}
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg group">
          <span>{domain}</span>
          <button 
            on:click={() => removeDomain(domain)}
            class="text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      {/each}
    </div>
  </section>

  <section class="card">
    <h2 class="text-xl font-semibold mb-6">Appearance</h2>
    <div class="flex gap-4">
      <button 
        class="btn-secondary flex-1 {settings?.uiTheme === 'light' ? 'border-indigo-500' : ''}"
        on:click={() => updateTheme('light')}
      >
        Light
      </button>
      <button 
        class="btn-secondary flex-1 {settings?.uiTheme === 'dark' ? 'border-indigo-500' : ''}"
        on:click={() => updateTheme('dark')}
      >
        Dark
      </button>
      <button 
        class="btn-secondary flex-1 {settings?.uiTheme === 'system' ? 'border-indigo-500' : ''}"
        on:click={() => updateTheme('system')}
      >
        System
      </button>
    </div>
  </section>
</div>

<style>
  :global(body) {
    background: var(--bg);
    min-height: 100vh;
  }
  
  .max-w-2xl { max-width: 42rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .p-12 { padding: 3rem; }
  .mb-12 { margin-bottom: 3rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .flex-1 { flex: 1 1 0%; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 0.5rem; }
  .gap-4 { gap: 1rem; }
  .text-4xl { font-size: 2.25rem; font-weight: 700; }
  .text-xl { font-size: 1.25rem; font-weight: 600; }
  .text-sm { font-size: 0.875rem; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }

  /* Utility classes added here because I'm not using Tailwind but want the same feel */
  .bg-white\/5 { background-color: rgba(255, 255, 255, 0.05); }
  .rounded-lg { border-radius: 0.5rem; }
  .group:hover .opacity-100 { opacity: 1; }
  .opacity-0 { opacity: 0; }
  .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
</style>
