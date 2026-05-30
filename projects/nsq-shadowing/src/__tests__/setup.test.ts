import { describe, expect, it } from "vitest";

describe("Project setup", () => {
  it("TypeScript can import path module", async () => {
    const path = await import("path");
    expect(typeof path.resolve).toBe("function");
  });

  it("NODE_ENV is defined", () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
