// The organization menu's short names and logos and the shared mark (0.40.0, D195), compiled by `npm run types`.
import { FamilyBar, OrganizationMark, type FamilyDescriptor } from '@beyond-js/ui/dom';

const twins: FamilyDescriptor = {
	organization: { id: 'org_a', name: 'Tienda Willy' },
	organizations: [
		{ id: 'org_a', name: 'Tienda Willy', role: 'owner', slug: 'tienda-willy', logo: 'https://accounts.example.test/v1/logos/k1' },
		{ id: 'org_b', name: 'Tienda Willy', role: 'developer', slug: 'tienda-willy-2' }
	]
};
new FamilyBar({ product: 'accounts', brand: { src: '/brand/wordmark.svg', href: '/' }, descriptor: twins });

const mark: HTMLElement = new OrganizationMark({ name: 'Tienda Willy', picture: null }).element;
const initial: string = OrganizationMark.initial('Tienda Willy');
const shown: boolean = OrganizationMark.shows('data:image/png;base64,AA');
void [mark, initial, shown];

// @ts-expect-error a short name is text
const wrong: FamilyDescriptor = { organizations: [{ id: 'org_c', name: 'C', slug: 3 }] };
// @ts-expect-error a mark needs the organization's name
new OrganizationMark({ picture: null });
void wrong;
