/**
 * Long dialog content for the fixture pages: enough paragraphs to exceed any viewport the checks
 * use, so the dialog body has to scroll while its title and actions stay in view.
 */
export const terms = {
	en: { open: 'Read terms', title: 'Service terms', accept: 'Accept terms', paragraph: index => `Clause ${index}. The service keeps records of each request and each release for the period the organization chose, and removes them afterwards.` },
	es: { open: 'Leer condiciones', title: 'Condiciones del servicio', accept: 'Aceptar condiciones', paragraph: index => `Cláusula ${index}. El servicio conserva los registros de cada pedido y cada versión durante el plazo que eligió la organización y después los elimina.` }
};

/** The numbered clauses of one language. */
export const clauses = language => Array.from({ length: 24 }, (_, index) => terms[language].paragraph(index + 1));
