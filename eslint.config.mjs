import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
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
        ...react.configs.flat.recommended,
        plugins: {
            react,
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
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...prettierConfig.rules,
            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
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
                    "selector": "AssignmentExpression[left.type='MemberExpression'][left.object.type='MemberExpression'][left.object.property.name='style']",
                    "message": "Avoid setting styles directly via element.style. Use CSS classes in global.css for better theming and maintainability."
                }
            ],
            "react/forbid-dom-props": "off",
        },
    }
]);
