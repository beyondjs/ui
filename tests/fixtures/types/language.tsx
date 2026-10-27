import { Unavailable, RetryAction, Loading, Waiting, EndLine } from '@beyond-js/ui/react';

// 0.44.0: React components speak the language in effect, `locale` first, with no words passed.
export function Spoken() {
	return (
		<>
			<Unavailable kind="outage" title="Beyond Projects did not answer" reason="Nothing was changed." locale="es" again={async () => undefined} />
			<RetryAction locale="es" onClick={() => undefined} />
			<Loading />
			<Waiting />
			<EndLine />
		</>
	);
}
