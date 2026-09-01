import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  /**
   * `design/` holds the approved visual prototype and its runtime. support.js
   * is a vendored build artifact — its own header says "GENERATED from
   * dc-runtime/src/*.ts — do not edit" — so linting it reports problems in
   * code this repository does not own and cannot fix. Scoping the linter to
   * our own source is not a rule downgrade; nothing is being silenced.
   */
  globalIgnores(["design/**"]),
  {
    extends: [...nextCoreWebVitals],
  },
]);
