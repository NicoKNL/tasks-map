import { defineConfig } from "eslint/config";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
    js.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
        plugins: {
            "@eslint-react": eslintReact,
            "react-hooks": reactHooks,
            "@typescript-eslint": tseslint,
        },
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
                activeDocument: "readonly", // Obsidian global (active document context)
            },
        },
        rules: {
            ...prettierConfig.rules,
            ...eslintReact.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react-hooks/set-state-in-effect": "warn",
            "@typescript-eslint/no-explicit-any": "error",
            "no-unused-vars": ["error", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],
            "no-restricted-syntax": ["error",
                {
                    "selector": "CallExpression[callee.property.name='createElement'][arguments.0.value='style']",
                    "message": "Do not create <style> elements dynamically. Use styles.css instead, which Obsidian loads automatically."
                },
                {
                    "selector": "JSXAttribute[name.name='style']",
                    "message": "Inline styles are not allowed. Use CSS classes in global.css instead."
                }
            ],
        },
    }
]);
