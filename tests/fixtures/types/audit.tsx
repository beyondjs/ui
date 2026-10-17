import { FamilyBar, Unavailable, Callout } from '@beyond-js/ui/react';

export const bar = <FamilyBar product="accounts" brand={{ src: '/w.svg', href: '/' }} descriptor={{ context: 'none' }} projects={false} bound={20000} />;
export const missing = <Unavailable title="Unreachable" reason="No answer." kind="outage" details={{ request: 'req_1', time: '2026-10-17T10:00:00Z' }} />;
export const failure = <Callout tone="danger" title="Failed" details={{ request: 'req_1' }} />;
