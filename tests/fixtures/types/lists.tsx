import { EndLine, NotificationInbox, useRowKeys, type NotificationAdapter } from '@beyond-js/ui/react';

declare const adapter: NotificationAdapter;
const outlet = document.createElement('div');

export function Inbox() {
	return <NotificationInbox adapter={adapter} tools="external" toolsTarget={outlet} />;
}

export function Devices({ names }: { names: string[] }) {
	const keys = useRowKeys();
	return (
		<>
			<ul className="bui-rows" ref={keys}>
				{names.map(name => (
					<li key={name}>{name}</li>
				))}
			</ul>
			<EndLine keys={names.length > 1} labels={EndLine.labels.es} />
		</>
	);
}

// @ts-expect-error The outlet is a DOM container, not a React element.
const invalid = <NotificationInbox adapter={adapter} tools="external" toolsTarget={<div />} />;
void invalid;
