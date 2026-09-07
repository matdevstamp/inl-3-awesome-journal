import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node scripts that intentionally use CommonJS require()
    "prisma/**/*.js",
  ]),
  {
    files: ["e2e/**"],
    rules: {
      // Playwright fixture callbacks are named `use` by convention; this is
      // test-runner code, not React, so the hook rules don't apply here.
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    rules: {
      // Task 07: keep `any` out of the codebase (warn so builds are never blocked).
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // Turn off stylistic rules that conflict with Prettier formatting.
  prettier,
]);

export default eslintConfig;
