/**
 * The copy of `Session` in English and Spanish (`Session.labels`). `{name}` is the first name of the
 * person who was signed in; without one, `signin` is offered instead of `continue`. `{product}` is who did
 * not answer, by its name in the family's catalog of causes (0.33.0: Beyond Accounts unless the product
 * names another), and offline the dialog says `offline` instead.
 */
export const words = Object.freeze({
	en: Object.freeze({
		title: 'Sign in again to continue',
		kept: 'What you were doing stays here.',
		continue: 'Continue as {name}',
		signin: 'Sign in',
		other: 'Use another account',
		waiting: 'Finish signing in in the Beyond Accounts window. This page continues by itself.',
		reopen: 'Show the window',
		cancel: 'Cancel',
		blocked: 'Your browser blocked the sign-in window.',
		tab: 'Continue in this tab',
		again: 'Try the window again',
		revoked: 'You were signed out of Beyond',
		revoked_body: 'Your session was ended from this or another tab or device.',
		suspended: 'Your Beyond account is suspended',
		suspended_body: 'Signing in again does not change this.',
		accounts: 'Open Beyond Accounts',
		unavailable: '{product} did not answer',
		unavailable_body: 'Your session could not be renewed. This page retries automatically. Your work stays here.',
		offline: 'You’re offline',
		offline_body: 'Your session is renewed as soon as you’re back online. Your work stays here.',
		retry: 'Try again',
		retrying: 'Trying again…',
		unsent: 'Not sent while you were signed out. Try it again.'
	}),
	es: Object.freeze({
		title: 'Vuelve a iniciar sesión para continuar',
		kept: 'Lo que estabas haciendo sigue aquí.',
		continue: 'Continuar como {name}',
		signin: 'Iniciar sesión',
		other: 'Usar otra cuenta',
		waiting: 'Termina de iniciar sesión en la ventana de Beyond Accounts. Esta página continúa sola.',
		reopen: 'Mostrar la ventana',
		cancel: 'Cancelar',
		blocked: 'Tu navegador bloqueó la ventana de inicio de sesión.',
		tab: 'Continuar en esta pestaña',
		again: 'Probar la ventana otra vez',
		revoked: 'Se cerró tu sesión en Beyond',
		revoked_body: 'Se cerró desde esta u otra pestaña o dispositivo.',
		suspended: 'Tu cuenta de Beyond está suspendida',
		suspended_body: 'Volver a iniciar sesión no lo cambia.',
		accounts: 'Abrir Beyond Accounts',
		unavailable: '{product} no respondió',
		unavailable_body: 'No se pudo renovar tu sesión. Esta página reintenta automáticamente. Tu trabajo sigue aquí.',
		offline: 'Estás sin conexión',
		offline_body: 'Tu sesión se renueva en cuanto vuelvas a tener conexión. Tu trabajo sigue aquí.',
		retry: 'Reintentar',
		retrying: 'Reintentando…',
		unsent: 'No se envió mientras no tenías sesión. Vuelve a intentarlo.'
	})
});
