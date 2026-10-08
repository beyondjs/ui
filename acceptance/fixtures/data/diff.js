// Fictional changes for the diff pages (0.11.2), as git writes them: `main` holds a modified file with
// three hunks (one with a long run of unchanged lines), a rename with changes, a binary file, a file with
// a long line and an added file of 1,500 lines (over the per-file budget); `many` is twelve small files
// for the list of files. Built here rather than written out so the large file stays readable.
const range = (count, line) => Array.from({ length: count }, (_, at) => line(at + 1));

const checkout = [
	'diff --git a/src/checkout/redirect.js b/src/checkout/redirect.js',
	'index 3b18e51..a9c1f0e 100644',
	'--- a/src/checkout/redirect.js',
	'+++ b/src/checkout/redirect.js',
	'@@ -1,5 +1,6 @@',
	" import { session } from '../session.js';",
	"+import { cart } from '../cart.js';",
	' // Where a payment returns',
	" const success = '/orders';",
	" const failure = '/checkout';",
	' export const routes = { success, failure };',
	'@@ -40,16 +41,16 @@ export function redirect(payment) {',
	'-	if (payment.failed) return failure;',
	'+	if (payment.failed) return `${failure}?cart=${cart.id}`;',
	...range(14, at => ` 	// step ${at + 1} of the redirect`),
	'-	return success;',
	'+	return `${success}/${payment.order}`;',
	'@@ -90,3 +91,4 @@ export function cancel(payment) {',
	' 	payment.cancel();',
	'+	cart.keep();',
	' 	return failure;',
	' }'
].join('\n');

const rename = [
	'diff --git a/src/pay/old-total.js b/src/pay/total.js',
	'similarity index 88%',
	'rename from src/pay/old-total.js',
	'rename to src/pay/total.js',
	'index 1111111..2222222 100644',
	'--- a/src/pay/old-total.js',
	'+++ b/src/pay/total.js',
	'@@ -1,3 +1,3 @@',
	' export function total(items) {',
	'-	return items.reduce((sum, item) => sum + item.price, 0);',
	'+	return items.reduce((sum, item) => sum + item.price * item.quantity, 0);',
	' }'
].join('\n');

const binary = ['diff --git a/public/receipt.png b/public/receipt.png', 'index 1234567..89abcde 100644', 'Binary files a/public/receipt.png and b/public/receipt.png differ'].join('\n');

const wide = `export const messages = { failed: '${range(30, at => `The payment number ${at} could not be completed, so the cart is kept for the person to try again`).join(' ')}' };`;
const long = ['diff --git a/src/i18n/messages.js b/src/i18n/messages.js', 'index 4444444..5555555 100644', '--- a/src/i18n/messages.js', '+++ b/src/i18n/messages.js', '@@ -1,2 +1,2 @@', ' // Messages shown after a payment', `-export const messages = { failed: 'Failed' };`, `+${wide}`].join('\n');

const large = ['diff --git a/fixtures/orders.csv b/fixtures/orders.csv', 'new file mode 100644', 'index 0000000..6666666', '--- /dev/null', '+++ b/fixtures/orders.csv', '@@ -0,0 +1,1500 @@', ...range(1500, at => `+${at},order-${at},${(at * 7) % 100}.00,EUR`)].join('\n');

const many = range(12, at =>
	[`diff --git a/src/parts/part-${at}.js b/src/parts/part-${at}.js`, 'index 7777777..8888888 100644', `--- a/src/parts/part-${at}.js`, `+++ b/src/parts/part-${at}.js`, '@@ -1,3 +1,3 @@', ` export function part${at}() {`, `-	return ${at};`, `+	return ${at * 10};`, ' }'].join('\n')
).join('\n');

/** The patches by name, selected with `?patch=`. */
export const patches = { main: [checkout, rename, binary, long, large].join('\n') + '\n', many: `${many}\n` };
/** The paths a check reaches for. */
export const paths = { first: 'src/checkout/redirect.js', wide: 'src/i18n/messages.js', large: 'fixtures/orders.csv', rename: 'src/pay/total.js' };
