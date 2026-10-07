/**
 * The copy of `Session` in English and Spanish (`Session.labels`). `{name}` is the first name of the
 * person who was signed in; without one, `signin` is offered instead of `continue`.
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
		unavailable: 'Beyond Accounts is not answering',
		unavailable_body: 'Your session could not be renewed yet. This page tries again by itself, and what you were doing stays here.',
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
		unavailable: 'Beyond Accounts no responde',
		unavailable_body: 'Aún no se pudo renovar tu sesión. Esta página lo vuelve a intentar sola, y lo que estabas haciendo sigue aquí.',
		retry: 'Intentar de nuevo',
		retrying: 'Intentando de nuevo…',
		unsent: 'No se envió mientras no tenías sesión. Vuelve a intentarlo.'
	})
});
