/** Declarations of 0.32.0's React Form (D183). */
import { createRef } from 'react';
import { Form, Required, Quiet, Button, SecretField } from '@beyond-js/ui/react';

const ref = createRef<HTMLFormElement>();
export const view = (
	<Form ref={ref} id="invite" className="invite" onSubmit={event => void event.currentTarget.elements}>
		<input name="email" type="email" required aria-label="Email" />
		<div data-missing="">Choose people</div>
		<SecretField label="Supabase access" credential="access token" required />
		<button type="submit">Invite</button>
	</Form>
);
export const waiting = <Button label="Add" waiting place={() => document.querySelector('input')} onClick={() => undefined} />;
export const empty: boolean = Required.empty(null);
export const kind: typeof Quiet = Quiet;
