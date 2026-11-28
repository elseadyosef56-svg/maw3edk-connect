import { describe, expect, it } from "vitest";
import { getSubscriptionPlan } from "./plans";

describe("approved monthly prices in LYD", () => {
  it("charges 75 for Basic", () => expect(getSubscriptionPlan("basic")?.price).toBe(75));
  it("charges 110 for Pro", () => expect(getSubscriptionPlan("pro")?.price).toBe(110));
  it("charges 200 for Premium", () => expect(getSubscriptionPlan("premium")?.price).toBe(200));
});