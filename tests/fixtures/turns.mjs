/**
 * A conversation's turns for `TurnIndex` (0.29.0), as Conduict gives them: the person's message as each
 * turn's title, the start of its answer, the facts of its line, one turn that needs the person, one that
 * failed and the last one running, each with its address. `place()` puts a turn element and its opening
 * message on the page at given heights, so a test decides which turn is read.
 */
export const conversation = Object.freeze([
	{ key: 't1', title: 'Make the composer quieter', summary: 'Send is quiet while the field is empty, and a press puts the caret in it.', facts: ['Changed 2 files', '12:01', '1 min 5 s'] },
	{ key: 't2', title: 'Why is the bottom margin smaller than the top one?', summary: 'The field had 12 px above the text and the toolbar 8 px below.', facts: ['12:04', '42 s'] },
	{ key: 't3', title: 'Run the composer tests', state: 'waiting', stateLabel: 'Needs you', summary: 'Claude Code asks to run npm test.', facts: ['12:06'] },
	{ key: 't4', title: 'Benchmark the cache\nwith the large fixture', state: 'failed', summary: 'The benchmark stopped: exit 1.', facts: ['12:09', '3 min 2 s'] },
	{ key: 't5', title: 'Ship it', state: 'running', facts: ['12:15'] }
]);

/** The turns as `TurnIndex.update({ turns })` takes them, with addresses: a fresh copy each time. */
export function turns({ links = true } = {}) {
	return conversation.map(turn => ({ ...turn, facts: [...turn.facts], href: links ? `#/conversations/c1?turn=${turn.key}` : null }));
}

/**
 * Gives each turn an element and an opening message whose boxes stand at the given tops (one per turn,
 * 600 px tall, the message 80 px tall after a 40 px day line), attached to the page.
 */
export function place(list, tops, document) {
	return list.map((turn, index) => {
		const element = document.createElement('li');
		const head = document.createElement('div');
		element.append(head);
		document.body.append(element);
		const top = () => tops[index];
		element.getBoundingClientRect = () => ({ top: top(), bottom: top() + 600, left: 0, right: 800, width: 800, height: 600, x: 0, y: top() });
		head.getBoundingClientRect = () => ({ top: top() + 40, bottom: top() + 120, left: 0, right: 800, width: 800, height: 80, x: 0, y: top() + 40 });
		return { ...turn, element, head };
	});
}
