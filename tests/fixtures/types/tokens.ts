import { tokens } from '@beyond-js/ui/tokens';
import { Page, Section } from '@beyond-js/ui';

const version: string = tokens.version;
const page = new Page({ template: 'thread', lane: 'center' });
const section = new Section({ title: 'Machine', raised: true });
export { version, page, section };
