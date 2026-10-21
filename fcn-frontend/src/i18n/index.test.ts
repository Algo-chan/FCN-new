import { describe, expect, it } from "vitest";
import { translate } from "./index";
import en from "./translations/en";
import am from "./translations/am";
import om from "./translations/om";
import so from "./translations/so";

describe("i18n translate", () => {
  it("returns the key when the translation is missing", () => {
    expect(translate("en", "missing.key")).toBe("missing.key");
  });

  it("interpolates named parameters", () => {
    expect(translate("en", "doctors.showingMany", { count: 3, total: 40 })).toBe(
      "Showing 3 doctors (40 total)"
    );
  });

  it("falls back to English-compatible translations in Amharic", () => {
    expect(translate("am", "doctors.pageTitle")).toBe(am["doctors.pageTitle"]);
    expect(translate("am", "doctors.pageTitle")).not.toBe(en["doctors.pageTitle"]);
  });

  it("every English key exists in the Amharic dictionary", () => {
    const enKeys = Object.keys(en);
    const amKeys = new Set(Object.keys(am));
    const missing = enKeys.filter((key) => !amKeys.has(key));
    expect(missing).toEqual([]);
  });

  it("every English key exists in the Oromo dictionary", () => {
    const enKeys = Object.keys(en);
    const omKeys = new Set(Object.keys(om));
    const missing = enKeys.filter((key) => !omKeys.has(key));
    expect(missing).toEqual([]);
  });

  it("every English key exists in the Somali dictionary", () => {
    const enKeys = Object.keys(en);
    const soKeys = new Set(Object.keys(so));
    const missing = enKeys.filter((key) => !soKeys.has(key));
    expect(missing).toEqual([]);
  });
});
