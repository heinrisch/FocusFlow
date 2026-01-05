import '../styles/main.css';
import Blocked from './Blocked.svelte';

const app = new Blocked({
    target: document.getElementById('app')!,
});

export default app;
