import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";

window.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../context/HouseholdContext", () => ({
  useHousehold: jest.fn(),
}));

jest.mock("../../hooks/useTable", () => ({
  useTable: jest.fn(),
}));

jest.mock("../../hooks/useHouseholdCollaboration", () => ({
  roleCanManage: jest.fn(() => true),
}));

const { Pool, buildRecommendationSummary } = require("./Pool");
const { useHousehold } = require("../../context/HouseholdContext");
const { useTable } = require("../../hooks/useTable");
const { roleCanManage } = require("../../hooks/useHouseholdCollaboration");

function clickByText(container, text) {
  const button = [...container.querySelectorAll("button")].find(item => item.textContent.includes(text));
  if (!button) throw new Error(`Button not found: ${text}`);
  act(() => Simulate.click(button));
  return button;
}

function table(data = [], overrides = {}) {
  return {
    data,
    loading: false,
    insert: jest.fn().mockResolvedValue({ id: "new-reading" }),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    reload: jest.fn(),
    ...overrides,
  };
}

describe("Pool Test persistence UI", () => {
  let container;
  let root;
  let tables;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    tables = {
      pool_readings: table([]),
      pool_treatments: table([]),
      pool_maintenance: table([]),
      pool_schedule: table([]),
      pool_equipment: table([]),
      pool_action_audits: table([]),
    };

    useHousehold.mockReturnValue({
      householdId: "household-1",
      user: { id: "user-1" },
      membership: { role: "owner" },
    });
    roleCanManage.mockReturnValue(true);
    useTable.mockImplementation(tableName => tables[tableName] || table([]));
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  test("displays a fetched Pool Test after reload/navigation to history", () => {
    tables.pool_readings = table([
      {
        id: "reading-1",
        date: "2026-07-06",
        logged_at: "2026-07-06T13:15:00.000Z",
        test_source: "Manual",
        ph: 7.5,
        free_chlorine: 5.5,
        salt: 3400,
        notes: "Reloaded from Supabase",
      },
    ]);

    act(() => root.render(React.createElement(Pool)));
    clickByText(container, "History");

    expect(container.textContent).toContain("pH 7.5 FC 5.5 Salt 3400");
    expect(container.textContent).toContain("Reloaded from Supabase");
    expect(container.querySelector('button[aria-label="Edit Reading entry"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Delete Reading entry"]')).not.toBeNull();
  });

  test("removes Pool Test creation from the Pool page and keeps results collapsed", () => {
    tables.pool_readings=table([{id:"reading-1",date:"2026-07-12",logged_at:"2026-07-12T13:00:00Z",ph:7.4,free_chlorine:5}]);
    act(() => root.render(React.createElement(Pool)));
    expect([...container.querySelectorAll("button")].some(button=>button.textContent.includes("Log Test"))).toBe(false);
    const results=[...container.querySelectorAll("button")].find(button=>button.textContent.includes("Water Test Results"));
    expect(results?.getAttribute("aria-expanded")).toBe("false");
  });

  test("recommendation starts collapsed with an operational summary and expands to structured guidance", () => {
    tables.pool_readings=table([{id:"reading-high-ph",date:"2026-07-12",logged_at:"2026-07-12T13:00:00Z",ph:8.0,alkalinity:100,free_chlorine:5,cya:70,salt:3400}]);
    act(()=>root.render(React.createElement(Pool)));
    const disclosure=[...container.querySelectorAll("button")].find(button=>button.textContent.includes("Recommended Next Step"));
    expect(disclosure?.getAttribute("aria-expanded")).toBe("false");
    expect(disclosure.textContent).toMatch(/Add .* oz muriatic acid.*Retest/i);
    act(()=>Simulate.click(disclosure));
    expect(container.textContent).toContain("Current condition");
    expect(container.textContent).toContain("How to apply");
    expect(container.textContent).toContain("Swimming guidance");
  });

  test("fetched partial Pool Test appears in history and updates current status after reload", () => {
    tables.pool_readings = table([
      {
        id: "reading-2",
        date: "2026-07-07",
        logged_at: "2026-07-07T14:00:00.000Z",
        test_source: "Manual",
        ph: null,
        free_chlorine: null,
        cc: 0.5,
        salt: null,
        recent_heavy_usage: true,
        recent_weather_notes: "Rain",
        notes: "Partial test after party",
      },
      {
        id: "reading-1",
        date: "2026-07-06",
        logged_at: "2026-07-06T13:15:00.000Z",
        test_source: "Manual",
        ph: 7.5,
        free_chlorine: 5.5,
        salt: 3400,
      },
    ]);

    act(() => root.render(React.createElement(Pool)));
    clickByText(container, "History");

    expect(container.textContent).toContain("pH -- FC -- Salt --");
    expect(container.textContent).toContain("Partial test after party");
    expect(container.textContent).toContain("Heavy use");
    expect(container.querySelectorAll('button[aria-label="Edit Reading entry"]')).toHaveLength(2);
  });

});

test("recommendation summary never invents a missing quantity",()=>{
  expect(buildRecommendationSummary({action:"Retest CYA before adding stabilizer.",amount:"",retest:"Repeat CYA with a reliable test."})).toBe("Retest CYA before adding stabilizer. Repeat CYA with a reliable test.");
});
