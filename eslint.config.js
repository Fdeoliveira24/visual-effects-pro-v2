import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/vendor/**",
      "**/lib/three.js",
      "**/lib/**",
    ],
  },

  // Base recommended rules
  js.configs.recommended,

  // Global configuration for all JS files
  {
    files: ["effects-pro/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script", // Using IIFE pattern, not modules
      globals: {
        ...globals.browser,
        // Add any custom globals your project uses
        effectsPro: "writable",
        TDV: "readonly",
      },
    },
    rules: {
      // Possible Problems (bug prevention)
      "no-await-in-loop": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-constant-binary-expression": "error",
      "no-duplicate-imports": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "warn",
      "no-unmodified-loop-condition": "error",
      "no-unreachable-loop": "error",
      "no-use-before-define": ["error", { functions: false, classes: true }],

      // Suggestions (code quality)
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-else-return": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-lonely-if": "warn",
      "no-multi-assign": "warn",
      "no-nested-ternary": "warn",
      "no-param-reassign": ["warn", { props: false }],
      "no-return-assign": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unneeded-ternary": "warn",
      "no-unused-expressions": "error",
      "no-useless-computed-key": "warn",
      "no-useless-concat": "warn",
      "no-useless-return": "warn",
      "no-var": "error",
      "prefer-const": "warn",
      "prefer-template": "warn",
      "require-await": "warn",
      yoda: "warn",

      // Stylistic (readability)
      camelcase: ["warn", { properties: "never", ignoreDestructuring: true }],
      "max-depth": ["warn", 4],
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],
      "max-nested-callbacks": ["warn", 3],
      "max-params": ["warn", 6],
      "no-array-constructor": "warn",
      "no-mixed-operators": "warn",
      "spaced-comment": ["warn", "always", { markers: ["/"] }],

      // Best practices for browser code
      "no-alert": "warn",
      "no-restricted-globals": [
        "error",
        { name: "event", message: "Use local event parameter instead." },
      ],
    },
  },

  // Disable style rules that conflict with Prettier
  eslintConfigPrettier,
];
