import { describe, expect, it } from "vitest";
import { buildSlotsForDate, buildOccupiedByDate, findFirstAvailableSlot } from "./doctors.service";

describe("buildSlotsForDate", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("builds 30-minute slots from 08:00 to 17:30", () => {
    const slots = buildSlotsForDate("2026-01-01", new Set(), now);
    expect(slots).toHaveLength(20);
    expect(slots[0]).toEqual({ time: "08:00", available: true, label: "8:00 AM" });
    expect(slots[slots.length - 1].time).toBe("17:30");
    expect(slots[slots.length - 1].label).toBe("5:30 PM");
  });

  it("marks occupied times unavailable", () => {
    const slots = buildSlotsForDate("2026-01-01", new Set(["09:00", "09:30"]), now);
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "09:30")?.available).toBe(false);
    expect(slots.find((s) => s.time === "08:30")?.available).toBe(true);
  });

  it("marks past slots unavailable", () => {
    const later = new Date("2026-01-01T12:00:00.000Z");
    const slots = buildSlotsForDate("2026-01-01", new Set(), later);
    expect(slots.find((s) => s.time === "08:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "13:00")?.available).toBe(true);
  });
});

describe("buildOccupiedByDate", () => {
  it("maps scheduled_at to day-keyed occupied times", () => {
    const appointments = [
      { scheduled_at: new Date("2026-01-01T09:00:00.000Z"), duration_minutes: 30 }
    ];
    const map = buildOccupiedByDate(appointments);
    expect(map.get("2026-01-01")).toEqual(new Set(["09:00"]));
  });

  it("marks every 30-minute chunk of a longer appointment", () => {
    const appointments = [
      { scheduled_at: new Date("2026-01-02T10:00:00.000Z"), duration_minutes: 60 }
    ];
    const map = buildOccupiedByDate(appointments);
    expect(map.get("2026-01-02")).toEqual(new Set(["10:00", "10:30"]));
  });
});

describe("findFirstAvailableSlot", () => {
  const today = new Date("2026-01-01T00:00:00.000Z");
  const allDay = () => {
    const times = new Set<string>();
    for (let hour = 8; hour < 18; hour++) {
      times.add(`${String(hour).padStart(2, "0")}:00`);
      times.add(`${String(hour).padStart(2, "0")}:30`);
    }
    return times;
  };

  it("returns the first free slot today", () => {
    const occupied = new Map<string, Set<string>>([["2026-01-01", new Set(["08:00"])]]);
    expect(findFirstAvailableSlot(today, 7, occupied)).toBe("2026-01-01T08:30:00.000Z");
  });

  it("skips to tomorrow when today is fully booked", () => {
    const occupied = new Map<string, Set<string>>([["2026-01-01", allDay()]]);
    expect(findFirstAvailableSlot(today, 7, occupied)).toBe("2026-01-02T08:00:00.000Z");
  });

  it("returns null when nothing is free within the lookahead", () => {
    const occupied = new Map<string, Set<string>>();
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() + i);
      occupied.set(day.toISOString().slice(0, 10), allDay());
    }
    expect(findFirstAvailableSlot(today, 7, occupied)).toBeNull();
  });
});