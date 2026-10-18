/** Declarations of 0.17.1 in React: useAgain, AgainLine and Unavailable's again. */
import { useAgain, AgainLine, Unavailable } from '@beyond-js/ui/react';

export function Place({ failing }: { failing: boolean }) {
	const again = useAgain(failing, async () => fetch('/v1/state'));
	return (
		<>
			<AgainLine moments={again} locale="es" labels={AgainLine.labels.es} />
			<button type="button" onClick={() => void again.now()}>Try again</button>
			<Unavailable title="CDN is not answering" reason="Nothing was lost." kind="outage" again={async () => undefined} locale="en" />
		</>
	);
}
