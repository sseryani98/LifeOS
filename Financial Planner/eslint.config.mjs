// Life OS standards are shared across every module — the rules live in Standards.
// This re-export exists because flat-config `files` globs resolve relative to the
// config file ESLint loads, not the one that authored the array. Loading from here
// roots `srv/**`, `app/**`, and `test/**` at this module instead of the repo root.
import base from "../Standards (Technical + Linting)/eslint.config.mjs";

export default base;
