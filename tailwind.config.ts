import type { Config } from 'tailwindcss';

export const config: Config = {
	content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				brand: 'hsl(var(--color-brand) / <alpha-value>)',
				background: 'hsl(var(--color-background) / <alpha-value>)',
				text: 'hsl(var(--color-text) / <alpha-value>)',
			},
		},
	},
	plugins: [],
	darkMode: 'class',
};
