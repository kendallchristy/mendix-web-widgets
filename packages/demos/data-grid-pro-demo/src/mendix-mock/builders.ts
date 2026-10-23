// Stand-in for "mendix/filters/builders": builds plain filter objects that the mock list evaluates.
import type { MockItem } from "./list";

export type Expr =
    | { type: "association"; id: string }
    | { type: "literal"; value: MockItem | MockItem[] | string | number | boolean }
    | { type: "function"; name: "=" | "contains" | "or" | "and"; args: Expr[] };

export const association = (id: string): Expr => ({ type: "association", id });
export const literal = (value: MockItem | MockItem[] | string | number | boolean): Expr => ({ type: "literal", value });
export const equals = (a: Expr, b: Expr): Expr => ({ type: "function", name: "=", args: [a, b] });
export const contains = (a: Expr, b: Expr): Expr => ({ type: "function", name: "contains", args: [a, b] });
export const or = (...args: Expr[]): Expr => ({ type: "function", name: "or", args });
export const and = (...args: Expr[]): Expr => ({ type: "function", name: "and", args });
