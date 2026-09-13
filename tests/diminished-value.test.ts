import test from "node:test";
import assert from "node:assert/strict";
import { ageFactor, calculateEstimate, estimateVehicleValue, jurisdictionForZip, mileageFactor } from "../lib/diminished-value.ts";

test("sample estimate uses all adjustment factors", () => {
  const result = calculateEstimate({ vehicleValue:38200, mileage:28400, repairCost:9600, vehicleAge:4, vehicleClass:"premium", severity:"moderate", priorHistory:"none" });
  assert.equal(result.midpoint, 1550); assert.equal(result.low, 1325); assert.equal(result.high, 1775);
});
test("zero market value produces a safe zero result", () => {
  const result = calculateEstimate({ vehicleValue:0, mileage:0, repairCost:5000, vehicleAge:1, vehicleClass:"average", severity:"structural", priorHistory:"none" });
  assert.equal(result.midpoint, 0); assert.equal(result.lossPercent, 0);
});
test("premium class applies the documented 1.20 multiplier", () => {
  const base = { vehicleValue:30000, mileage:30000, repairCost:9000, vehicleAge:3, severity:"major" as const, priorHistory:"none" as const };
  const average = calculateEstimate({ ...base, vehicleClass:"average" });
  const premium = calculateEstimate({ ...base, vehicleClass:"premium" });
  assert.equal(premium.midpoint, Math.round((average.midpoint * 1.2) / 25) * 25);
});
test("mileage and age factors decline at documented thresholds", () => {
  assert.equal(mileageFactor(19_999), 1); assert.equal(mileageFactor(100_000), .1); assert.equal(ageFactor(2), 1); assert.equal(ageFactor(9), .45);
});
test("vehicle lookup adjusts a supported model for age and mileage", () => {
  assert.equal(estimateVehicleValue(2022, "Audi", "Q5", 28_400), 31_400);
  assert.equal(estimateVehicleValue(2022, "Audi", "Q5", 28_400, 2026, 1.03), 32_400);
  assert.equal(estimateVehicleValue(2022, "Unknown", "Q5", 28_400), null);
});
test("higher mileage lowers the pre-loss vehicle value", () => {
  const lowMileage = estimateVehicleValue(2022, "Toyota", "Camry", 20_000);
  const highMileage = estimateVehicleValue(2022, "Toyota", "Camry", 80_000);
  assert.ok(lowMileage !== null && highMileage !== null);
  assert.ok(lowMileage > highMileage);
});
test("ZIP lookup resolves all five supported states", () => {
  assert.equal(jurisdictionForZip("30303")?.code, "GA");
  assert.equal(jurisdictionForZip("35203")?.code, "AL");
  assert.equal(jurisdictionForZip("37201")?.code, "TN");
  assert.equal(jurisdictionForZip("27601")?.code, "NC");
  assert.equal(jurisdictionForZip("29201")?.code, "SC");
  assert.equal(jurisdictionForZip("10001"), null);
});
