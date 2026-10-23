import { Section, Waiting } from '@beyond-js/ui/react';

// The React wait and a section whose body waits (0.23.0, LOAD-01).
export const wait = <Waiting rows={2} language="es" />;
export const shaped = <Section title="Recent" waiting={{ rows: 3 }} />;
export const plain = <Section title="Working" waiting />;
