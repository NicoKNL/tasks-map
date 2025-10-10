import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { fixupPluginRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    js.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
        ...react.configs.flat.recommended,
        plugins: {
            react,
            "react-hooks": fixupPluginRules(reactHooks),
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
            "react/forbid-dom-props": ["error", {
                "forbid": [
                    {
                        "propName": "style",
                        "message": "Inline styles are not allowed. Use CSS classes in global.css instead."
                    }
                ]
            }],
        },
    }
]);