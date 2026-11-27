import { describe, expect, it } from "vitest";
import { SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_WHATSAPP } from "./support";

describe("official support contact", () => {
  it("uses the owner's specified Libyan number for calls", () => {
    expect(SUPPORT_PHONE).toBe("0915166502");
    expect(SUPPORT_TEL).toBe("tel:+218915166502");
  });
  it("uses the same number for WhatsApp", () => {
    expect(new URL(SUPPORT_WHATSAPP).pathname).toBe("/218915166502");
  });
});