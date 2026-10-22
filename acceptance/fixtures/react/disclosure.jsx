import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Disclosure, Help } from '@beyond-js/ui/react';
const root = document.getElementById('root');
createRoot(root).render(<React.StrictMode>
 <button id="action" onClick={() => { root.dataset.opened = 'true'; }}>Open branch</button>
 <section id="section"><Disclosure label="Development" outside={false}><input aria-label="Command" /></Disclosure></section>
 <Disclosure label="Menu"><button>Menu action</button></Disclosure>
<Help topic="Command" text="Choose a command." />
</React.StrictMode>);

window.fixture = { ready: true };
