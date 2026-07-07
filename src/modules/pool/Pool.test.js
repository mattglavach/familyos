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

const { Pool } = require("./Pool");
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
    clickByText(container, "history");

    expect(container.textContent).toContain("pH 7.5 FC 5.5 Salt 3400");
    expect(container.textContent).toContain("Reloaded from Supabase");
    expect(container.textContent).toContain("FC 5.5 / pH 7.5");
  });

  test("renders the shared partial Pool Test form with CC after FC and context fields", () => {
    act(() => root.render(React.createElement(Pool)));
    clickByText(container, "Log Test");

    const text = container.textContent;
    const fcInput = container.querySelector('input[aria-label="FC ppm"]');
    const phInput = container.querySelector('input[aria-label="pH"]');
    const ccInput = [...container.querySelectorAll("input")].find(input => input.getAttribute("min") === "0" && input.getAttribute("max") === "20");
    expect(text).toContain("Chemistry");
    expect(text).toContain("Party");
    expect(text).toContain("Rain");
    expect(text).not.toContain("FC ppm *");
    expect(text).not.toContain("pH *");
    expect(fcInput.compareDocumentPosition(ccInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ccInput.compareDocumentPosition(phInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("saves a partial Pool Test without pH or FC", async () => {
    act(() => root.render(React.createElement(Pool)));
    clickByText(container, "Log Test");

    const ccInput = [...container.querySelectorAll("input")].find(input => input.closest("label")?.textContent?.includes("CC ppm"))
      || [...container.querySelectorAll("input")].find(input => input.getAttribute("min") === "0" && input.getAttribute("max") === "20");
    act(() => Simulate.change(ccInput, { target: { value: "0.5" } }));

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Test")));
    });

    expect(tables.pool_readings.insert).toHaveBeenCalledWith(expect.objectContaining({
      free_chlorine: null,
      ph: null,
      cc: 0.5,
    }));
  });

  test("blocks empty Pool module Pool Test saves", async () => {
    act(() => root.render(React.createElement(Pool)));
    clickByText(container, "Log Test");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Test")));
    });

    expect(tables.pool_readings.insert).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Add at least one test result");
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
    clickByText(container, "history");

    expect(container.textContent).toContain("pH -- FC -- Salt --");
    expect(container.textContent).toContain("Partial test after party");
    expect(container.textContent).toContain("Heavy use");
    expect(container.textContent).toContain("FC 5.5 / pH 7.5");
  });

});
