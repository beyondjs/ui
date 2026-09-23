/**
 * WCAG 2.2 contrast between two sRGB colors.
 *
 * The foundations declare which semantic pairs carry text or meaningful graphics, and the tests use
 * this calculator to hold every pair to its required ratio in both themes. It is a stateless, pure
 * operation over values, so it lives beside the tokens and depends on nothing.
 */
export class Contrast {
	/** Normal text needs 4.5:1; large text and user-interface graphics need 3:1. */
	static required = { text: 4.5, large: 3, graphic: 3 };

	/** Relative luminance of a `#rrggbb` color, as WCAG defines it. */
	static luminance(hex) {
		const value = hex.replace('#', '');
		const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
		const [r, g, b] = channels.map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}

	/** The contrast ratio between two colors, from 1 to 21. */
	static ratio(first, second) {
		const [light, dark] = [Contrast.luminance(first), Contrast.luminance(second)].sort((a, b) => b - a);
		return (light + 0.05) / (dark + 0.05);
	}
}
