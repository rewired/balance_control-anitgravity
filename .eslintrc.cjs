module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    ignorePatterns: [
        '**/dist/**',
        '**/node_modules/**',
        'coverage/**',
        '**/*.d.ts'
    ],
    overrides: [
        {
            files: ['packages/client-web/src/**/*.{ts,tsx}'],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: ['**/dispatchIntent'],
                                message: 'Do not import dispatchIntent; use controller.confirmDraft().'
                            }
                        ]
                    }
                ]
            }
        },
        {
            files: ['packages/client-web/src/ui/interaction/useGameInteractionController.ts'],
            rules: {
                'no-restricted-imports': 'off'
            }
        }
    ]
};
