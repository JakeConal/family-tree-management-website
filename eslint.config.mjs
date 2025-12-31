import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-plugin-prettier/recommended';

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	prettier,
	// importPlugin.flatConfigs.recommended,
	{
		rules: {
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
