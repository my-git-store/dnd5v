import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/src/assets/**",
      "**/.pnpm-store/**",
      "**/coverage/**",
      "features modules/**",
    ],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...eslintPluginVue.configs["flat/recommended"],
  eslintConfigPrettier,
  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: typescriptEslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      "no-console": "warn",
      "vue/multi-word-component-names": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "function",
        },
        {
          blankLine: "always",
          prev: "function",
          next: ["const", "let", "var"],
        },
      ],
    },
  },
  {
    files: ["**/*.{mjs,cjs,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
);
