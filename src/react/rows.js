import React from 'react';
import { RowKeys } from '../dom/list/keys.js';
import { EndLine as Line } from '../dom/list/end.js';

const { useCallback, useRef } = React;
const h = React.createElement;

/**
 * The arrow keys of a product's own list of rows (0.39.0, the list rule L7): a callback ref for the element
 * that holds them, `<ul className="bui-rows" ref={useRowKeys()}>`. Up and Down move between the rows' names,
 * Home and End reach the first and the last, as `RowKeys` does in the DOM; the keys are released when the
 * list leaves.
 */
export function useRowKeys() {
	const keys = useRef(null);
	return useCallback(list => {
		keys.current?.destroy();
		keys.current = list ? new RowKeys(list) : null;
	}, []);
}

/**
 * A complete list's end line (0.39.0, the list rule L5), after a product's own `ul.bui-rows`, with the DOM
 * `EndLine`'s markup: `text` (else "Nothing more"), `keys` for the keys that go through the list, and `labels`
 * as `EndLine.labels.es`.
 */
export function EndLine({ text = null, keys = false, labels = {} }) {
	const words = { ...Line.labels.en, ...labels };
	return h('p', { className: 'bui-rows-end' }, h('span', null, text ?? words.end), keys ? h('span', { className: 'bui-keys bui-rows-keys' }, words.keys) : null);
}

EndLine.labels = Line.labels;
