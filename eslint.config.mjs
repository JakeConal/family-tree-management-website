import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import formatjs from 'eslint-plugin-formatjs';
import prettier from 'eslint-plugin-prettier/recommended';

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	prettier,
	// importPlugin.flatConfigs.recommended,
	{
		plugins: {
			formatjs,
		},
		rules: {
			// Recommended formatjs rules
			'formatjs/no-offset': 'error',
			'formatjs/enforce-id': 'error', // Require message IDs
			'formatjs/no-literal-string-in-jsx': 'warn', // Warn about hardcoded strings in JSX
			'formatjs/enforce-plural-rules': 'error', // Enforce proper plural syntax
			'formatjs/no-multiple-whitespaces': 'error', // Clean up extra whitespace
			'formatjs/no-complex-selectors': 'error', // Avoid overly complex ICU selectors
			'formatjs/enforce-placeholders': 'error', // Ensure placeholders are used correctly
			'formatjs/prefer-formatted-message': 'error', // Prefer <FormattedMessage> over other components
			'import/order': [
				'error',
				{
					groups: [
						// Imports of builtins are first
						['builtin', 'external'],
						// Then internal imports
						'internal',
						// Then sibling and parent imports. They can be mingled together
						['sibling', 'parent'],
						// Then index file imports
						'index',
						// Then any arcane TypeScript imports
						'object',
						// Then the omitted imports: internal, external, type, unknown
					],
					'newlines-between': 'always',
					alphabetize: { order: 'asc', caseInsensitive: true },
				},
			],
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
	]),
]);

export default eslintConfig;
