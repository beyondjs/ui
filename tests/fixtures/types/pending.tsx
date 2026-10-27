import { createRef } from 'react';
import { PageHeader, Reserved, Section, SectionPart, Arrival, Button } from '@beyond-js/ui/react';

// The React forms of what a page holds while its object's first read runs (0.44.0, LOAD-01, D185).
const heading = createRef<HTMLHeadingElement>();
export const pending = (
	<>
		<Arrival product="Beyond Projects" href={null} />
		<PageHeader title={null} waiting headingRef={heading} labels={{ loading: 'Cargando…' }} actions={<Reserved><Button label="Restore" /></Reserved>} />
		<Section title="Devices">
			<button type="button">Sign out of other devices</button>
			<SectionPart waiting={{ rows: 2 }}>{null}</SectionPart>
		</Section>
	</>
);
// @ts-expect-error SectionPart's wait is true or a shape
export const wrong = <SectionPart waiting="soon" />;
