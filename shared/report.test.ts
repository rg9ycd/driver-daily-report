import { describe, expect, it } from "vitest";
import { formatVehicleNumber, PRE_OPERATION_INSPECTION_LABEL } from "./report";

describe("shared report labels", () => {
  it("adds 号車 after the entered vehicle number", () => {
    expect(formatVehicleNumber("12")).toBe("12号車");
    expect(formatVehicleNumber(" 12 ")).toBe("12号車");
    expect(formatVehicleNumber("")).toBe("");
  });

  it("uses the requested inspection English label", () => {
    expect(PRE_OPERATION_INSPECTION_LABEL).toBe("Pre-operation inspection");
  });
});
