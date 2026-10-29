import { Sidebar } from '@beyond-js/ui/react';
export const view = <Sidebar product="Conduict" rail={{ panel: 'conversations', open: true, onChange: open => console.log(open), order: ['home', 'conversations'] }} groups={[{ items: [{ key: 'home', label: 'Home', glyph: 'home', href: '/home' }] }, { kind: 'object', key: 'conversations', heading: 'Conversations', href: '/conversations', current: true, glyph: 'chat', groups: [] }]} />;

void <Sidebar product="Conduict" navigation={{ key: 'conduict', onChange: collapsed => void collapsed }} />;
