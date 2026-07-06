import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useTable } from "./useTable";
import { supabase } from "../lib/supabase";

window.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../context/HouseholdContext", () => ({
  useHousehold: () => ({
    householdId: "household-1",
    user: { id: "user-1" },
  }),
}));

jest.mock("../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function queryResult(result) {
  const query = {
    select: jest.fn(() => query),
    order: jest.fn(() => query),
    eq: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
}

function tableApi({ selectResults, selectRows, insertResult, insertedRows }) {
  return {
    select: jest.fn(() => queryResult(selectRows ? { data: selectRows.value, error: null } : (selectResults.shift() || { data: [], error: null }))),
    insert: jest.fn(row => {
      insertedRows.push(row);
      if (selectRows && !insertResult.error) selectRows.value = [{ ...row, id: insertResult.data?.id || "reading-1" }];
      return {
        select: () => ({
          single: async () => insertResult,
        }),
      };
    }),
  };
}

function HookProbe({ onSnapshot }) {
  const table = useTable("pool_readings", "logged_at");
  onSnapshot(table);
  return (
    <div>
      <div data-testid="count">{table.data.length}</div>
      <button type="button" onClick={() => table.insert({ date: "2026-07-06", ph: 7.5, free_chlorine: 5.5 })}>Insert</button>
    </div>
  );
}

describe("useTable persistence", () => {
  let container;
  let root;
  let insertedRows;
  let snapshots;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    insertedRows = [];
    snapshots = [];
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  test("throws insert errors and does not add a local-only row", async () => {
    supabase.from.mockReturnValue(tableApi({
      selectResults: [{ data: [], error: null }],
      insertResult: { data: null, error: new Error("insert denied") },
      insertedRows,
    }));

    await act(async () => {
      root.render(React.createElement(HookProbe, { onSnapshot: snapshot => snapshots.push(snapshot) }));
    });

    await expect(snapshots[snapshots.length - 1].insert({ date: "2026-07-06", ph: 7.5, free_chlorine: 5.5 })).rejects.toThrow("insert denied");

    expect(container.querySelector('[data-testid="count"]').textContent).toBe("0");
    expect(insertedRows[0]).toEqual(expect.objectContaining({
      household_id: "household-1",
      user_id: "user-1",
      ph: 7.5,
      free_chlorine: 5.5,
    }));
  });

  test("reloads persisted rows after a successful insert", async () => {
    const selectRows = { value: [] };
    supabase.from.mockReturnValue(tableApi({
      selectRows,
      insertResult: { data: { id: "reading-1" }, error: null },
      insertedRows,
    }));

    await act(async () => {
      root.render(React.createElement(HookProbe, { onSnapshot: snapshot => snapshots.push(snapshot) }));
    });

    await act(async () => {
      await snapshots[snapshots.length - 1].insert({ date: "2026-07-06", ph: 7.5, free_chlorine: 5.5 });
    });
    await act(async () => {});

    expect(container.querySelector('[data-testid="count"]').textContent).toBe("1");
    expect(insertedRows[0]).toEqual(expect.objectContaining({
      household_id: "household-1",
      user_id: "user-1",
      ph: 7.5,
      free_chlorine: 5.5,
    }));
  });
});
