import { describe, expect, it } from "vitest";
import { isWalletTopup, validTopupAmount, walletTopupReference } from "./wallet";

describe("wallet request classification", () => {
  it("recognizes wallet topups without treating subscriptions as topups", () => {
    expect(isWalletTopup(walletTopupReference(50, "TXN-1"))).toBe(true);
    expect(isWalletTopup("subscription renewal")).toBe(false);
    expect(isWalletTopup(null)).toBe(false);
  });
  it("accepts finite amounts of at least 10 LYD with at most two decimals", () => {
    expect(validTopupAmount("10")).toBe(true);
    expect(validTopupAmount("50")).toBe(true);
    expect(validTopupAmount("9")).toBe(false);
    expect(validTopupAmount("Infinity")).toBe(false);
    expect(validTopupAmount("10.001")).toBe(false);
  });
});