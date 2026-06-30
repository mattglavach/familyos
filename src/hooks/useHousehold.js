import { useContext } from "react";
import { HouseholdContext } from "../context/HouseholdContext";

export function useHousehold() {
  return useContext(HouseholdContext);
}
