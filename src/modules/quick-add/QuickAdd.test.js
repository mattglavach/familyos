import React, { act } from "react";
import { Simulate } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import { QuickAdd } from "./QuickAdd";
import { buildPoolReadingRow, setRainContext, validatePoolTestForm } from "../pool/poolTestForm";
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

  test("renders optional pH and FC fields in the Pool Test form", () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");

    expect(container.textContent).toContain("FC ppm");
    expect(container.textContent).toContain("CC ppm");
    expect(container.textContent).toContain("pH");
    expect(container.textContent).not.toContain("pH *");
    expect(container.querySelector('input[aria-label="pH"]')).not.toBeNull();
  });

  test("offers the seven Release 2.2 quick capture targets", () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    ["Task", "Calendar Event", "Pool Test", "Maintenance", "Shopping Item", "Life Item", "Note"].forEach(label => {
      expect([...container.querySelectorAll("button")].some(button => button.textContent.includes(label))).toBe(true);
    });
  });

  test("renders CC directly after FC before pH", () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");

    const text = container.textContent;
    expect(text.indexOf("FC ppm")).toBeLessThan(text.indexOf("CC ppm"));
    expect(text.indexOf("CC ppm")).toBeLessThan(text.indexOf("pH"));
  });

  test("blocks Pool Test creation when no measurement is provided", async () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Add at least one chemistry or water measurement");
  });

  test("creates a partial Pool Test without pH or FC", async () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");
    changeInput([...container.querySelectorAll("input")].find(input => input.previousSibling?.textContent === "CC ppm") || container.querySelector('input[placeholder="0"]'), "0.5");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).toHaveBeenCalledWith(expect.objectContaining({
      free_chlorine: null,
      ph: null,
      cc: 0.5,
    }));
  });

  test("validates provided pH and FC ranges", async () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");
    changeInput(container.querySelector('input[aria-label="FC ppm"]'), "51");
    changeInput(container.querySelector('input[aria-label="pH"]'), "10");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Check FC, pH before saving.");
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

  test("saves Party and Rain context fields", async () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));
    clickByText(container, "Pool Test");
    changeInput(container.querySelector('input[aria-label="pH"]'), "7.4");
    clickByText(container, "Party");
    clickByText(container, "Rain");

    await act(async () => {
      Simulate.click([...container.querySelectorAll("button")].find(item => item.textContent.includes("Save Reading")));
    });

    expect(poolReadings.insert).toHaveBeenCalledWith(expect.objectContaining({
      recent_heavy_usage: true,
      recent_weather_notes: "Rain",
    }));
  });

  test("close button has an accessible hit target and closes Quick Add", () => {
    act(() => root.render(React.createElement(QuickAdd, { openSignal: 1, onNavigate: jest.fn() })));

    const closeButton = container.querySelector('button[aria-label="Close"]');
    expect(closeButton).not.toBeNull();
    expect(closeButton.className).toContain("h-11");

    act(() => Simulate.click(closeButton));

    expect(container.textContent).not.toContain("Quick Add");
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
  test("validatePoolTestForm allows FC and pH to be omitted when another value is present", () => {
    expect(validatePoolTestForm({ cc: "0.5" })).toEqual({
      valid: true,
      message: "",
      fields: [],
    });
  });

  test("validatePoolTestForm blocks completely empty Pool Tests", () => {
    expect(validatePoolTestForm({})).toEqual({
      valid: false,
      message: "Add at least one chemistry or water measurement before saving.",
      fields: [],
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

  test("setRainContext adds and removes the Rain marker without dropping other weather notes", () => {
    expect(setRainContext({ recent_weather_notes: "Wind" }, true)).toBe("Rain, Wind");
    expect(setRainContext({ recent_weather_notes: "Rain, Wind" }, false)).toBe("Wind");
  });
});
