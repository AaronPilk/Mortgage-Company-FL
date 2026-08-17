/**
 * TRACT Vision scenario model.
 *
 * Deterministic finance arithmetic. There is no AI in this package and there
 * must never be: every figure here is arithmetic on numbers the user can see,
 * which is what makes it testable, free, instant, and incapable of leaking a
 * scenario to a third party. A language model may one day write prose about
 * these numbers. It will never produce them.
 */

export * from "./range";
export * from "./assumptions";
export * from "./types";
export * from "./cases";
export * from "./improvement";
export * from "./construction";
export * from "./rental";
export * from "./flip";
export * from "./confidence";
export * from "./unverified";
export * from "./engine";
export * from "./summary";
