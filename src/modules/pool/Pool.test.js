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

});
