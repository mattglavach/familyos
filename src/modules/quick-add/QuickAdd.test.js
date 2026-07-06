import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { QuickAdd } from "./QuickAdd";
import { buildPoolReadingRow, validatePoolTestForm } from "../pool/poolTestForm";
import { useHousehold } from "../../context/HouseholdContext";
import { useTable } from "../../hooks/useTable";

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

function clickByText(container, text) {
  const button = [...container.querySelectorAll("button")].find(item => item.textContent.includes(text));
  if (!button) throw new Error(`Button not found: ${text}`);
  act(() => Simulate.click(button));
  return button;
}

function changeInput(input, value) {
  act(() => Simulate.change(input, { target: { value } }));
}

describe("QuickAdd Pool Test", () => {
  let container;
  let root;
  let poolReadings;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    poolReadings = { data: [], loading: false, insert: jest.fn().mockResolvedValue({ id: "reading-1" }) };

    useHousehold.mockReturnValue({
      householdId: "household-1",
      user: { id: "user-1" },
      membership: { role: "owner" },
    });

    useTable.mockImplementation(table => {
      if (table === "pool_readings") return poolReadings;
      return { data: [], loading: false, insert: jest.fn(), update: jest.fn(), remove: jest.fn(), reload: jest.fn() };
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  test("renders the pH field in the Pool Test form", () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");

    expect(container.textContent).toContain("pH *");
    expect(container.querySelector('input[aria-label="pH"]')).not.toBeNull();
  });

  test("blocks Pool Test creation when pH is missing", async () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");
    changeInput(container.querySelector('input[aria-label="FC ppm"]'), "5.5");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Required today: pH.");
  });

  test("creates a Pool Test with numeric pH and FC values", async () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");
    changeInput(container.querySelector('input[aria-label="FC ppm"]'), "5.5");
    changeInput(container.querySelector('input[aria-label="pH"]'), "7.5");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).toHaveBeenCalledWith(expect.objectContaining({
      free_chlorine: 5.5,
      ph: 7.5,
      test_source: "Manual",
    }));
  });

  test("keeps the Pool Test form open and shows an error when insert fails", async () => {
    const onNavigate = jest.fn();
    poolReadings.insert.mockRejectedValue(new Error("row-level security violation"));
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate })));
    clickByText(container, "Pool Test");
    changeInput(container.querySelector('input[aria-label="FC ppm"]'), "5.5");
    changeInput(container.querySelector('input[aria-label="pH"]'), "7.5");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(container.textContent).toContain("You do not have permission to do that in this household.");
    expect(container.textContent).toContain("Save Reading");
  });
});

describe("Pool Test form helpers", () => {
  test("validatePoolTestForm requires both FC and pH", () => {
    expect(validatePoolTestForm({ free_chlorine: "5.5" })).toEqual({
      valid: false,
      message: "Required today: pH.",
      fields: ["ph"],
    });
  });

  test("buildPoolReadingRow preserves submitted pH", () => {
    const row = buildPoolReadingRow({ date: "2026-07-06", time: "09:15", free_chlorine: "5.5", ph: "7.5" });

    expect(row).toEqual(expect.objectContaining({
      date: "2026-07-06",
      free_chlorine: 5.5,
      ph: 7.5,
    }));
    expect(Number.isNaN(Date.parse(row.logged_at))).toBe(false);
  });
});
