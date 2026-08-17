import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/.open-next/**",
      "**/next-env.d.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaVersion: 2022, sourceType: "module" }
    },
    rules: {
      // Unused values are usually a mistake; a leading underscore is the escape.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }
      ],
      // `any` erases exactly the guarantees this codebase relies on.
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-restricted-syntax": [
        "error",
        {
          // The one that actually matters: a secret compiled into the browser.
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/SECRET|SERVICE_ROLE|PRIVATE_KEY|API_KEY|PEPPER/]:not([object.property.name='env'][property.name=/^NEXT_PUBLIC_/])",
          message:
            "Read secrets through lib/env.ts, which is server-only, rather than process.env directly."
        }
      ]
    }
  },
  {
    // Tests deliberately construct malformed values to prove they are rejected.
    files: ["**/*.test.ts", "**/*.test.tsx", "**/tests/**"],
    rules: { "@typescript-eslint/no-explicit-any": "off" }
  }
);
