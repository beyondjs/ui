/** Requests a collection lists: 23 rows with states and areas. */
export const rows = Array.from({ length: 23 }, (_, index) => ({
	id: `r${index + 1}`,
	title: `Request ${index + 1}`,
	state: ['open', 'accepted', 'released'][index % 3],
	area: index % 2 ? 'Billing' : 'Onboarding',
	votes: index * 2
}));
