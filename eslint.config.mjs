import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: ["**/dist/", "**/typings/", "**/node_modules/", "**/coverage/"]
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        extends: [eslintReact.configs["recommended-typescript"], reactHooks.configs.flat.recommended],
        languageOptions: {
            globals: { ...globals.browser }
        },
        rules: {
            curly: "error",
            eqeqeq: ["error", "smart"],
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "prefer-const": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            // eslint-plugin-react-hooks covers these; keep one report per problem.
            "@eslint-react/exhaustive-deps": "off",
            "@eslint-react/rules-of-hooks": "off",
            "@eslint-react/set-state-in-effect": "off",
            "@eslint-react/naming-convention-ref-name": "off"
        }
    },
    {
        files: ["**/*.spec.{ts,tsx}", "**/__tests__/**"],
        languageOptions: {
            globals: { ...globals.jest, ...globals.node }
        }
    },
    {
        files: ["**/*.{js,cjs,mjs}"],
        languageOptions: {
            globals: { ...globals.node }
        }
    },
    prettier
);
