// A product page with a session that can end (`?id=` names its state on the acceptance server's stand-in
// product): the family bar, a page with an action, and one Session whose dialog cannot be dismissed. window.fixture
// exposes `lost(replay)`, which records what the held request resolved with, a log and the session.
import '@beyond-js/ui/tokens.css';
import '@beyond-js/ui/styles.css';
import '@beyond-js/ui/fonts.css';
import { FamilyBar, Session } from '@beyond-js/ui';

const id = new URLSearchParams(location.search).get('id') ?? 'default';
const log = [];
const root = document.getElementById('root');
const bar = new FamilyBar({ product: 'conduict', brand: { src: '../brand/wordmark.svg', href: '/' }, fallback: { person: { name: 'Ada Lovelace', email: 'ada@example.com' }, organization: 'BeyondJS', project: 'My first project' }, account: { signout: () => log.push('signout') } }).mount(root);
const main = root.appendChild(Object.assign(document.createElement('main'), { className: 'bui-page-main' }));
main.innerHTML = '<h1>Environments</h1><p>My first VM · Ready</p><button type="button" id="act" class="bui-button bui-button-primary">Create environment</button>';
main.querySelector('#act').addEventListener('click', () => log.push('acted'));
const read = async () => (await fetch(`/product/session?id=${encodeURIComponent(id)}`)).json();
const session = new Session({
	product: 'demo',
	person: { id: 'acc_ada', name: 'Ada Lovelace', email: 'ada@example.com' },
	read,
	start: mode => `/product/start?id=${encodeURIComponent(id)}&mode=${mode}`,
	accounts: '/fixtures/signin.html',
	other: () => log.push('other'),
	onrenewed: () => log.push('renewed')
});
session.subscribe(event => log.push(`${event.type}:${event.state}:${session.kind}`));
addEventListener('message', event => event.data?.type === 'beyond-session' && log.push(`landed:${event.data.outcome}:${event.data.ended}`));
window.fixture = {
	ready: true,
	log,
	session,
	bar,
	lost: replay => session.lost({ replay }).then(sent => log.push(`${replay}:${sent}`))
};
