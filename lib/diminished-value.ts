export type Severity = "cosmetic" | "moderate" | "major" | "structural";
export type PriorHistory = "none" | "one" | "multiple";
export type VehicleClass = "average" | "premium";
export type EstimateInput = { vehicleValue: number; mileage: number; repairCost: number; vehicleAge: number; vehicleClass: VehicleClass; severity: Severity; priorHistory: PriorHistory };

export const vehicleCatalog = {
  Audi: { "Q5": 49800, "A4": 43400, "Q7": 61200 },
  BMW: { "3 Series": 47600, "X3": 51500, "X5": 70200 },
  Chevrolet: { "Equinox": 31200, "Malibu": 26400, "Silverado 1500": 46200 },
  Ford: { "Escape": 30900, "Explorer": 41200, "F-150": 45100 },
  Honda: { "Accord": 30200, "Civic": 26800, "CR-V": 33100 },
  Hyundai: { "Elantra": 23500, "Santa Fe": 35000, "Tucson": 29700 },
  Lexus: { "ES": 45200, "NX": 46800, "RX": 51500 },
  Nissan: { "Altima": 27600, "Rogue": 30500, "Sentra": 22700 },
  Subaru: { "Forester": 31900, "Outback": 34200, "Crosstrek": 28500 },
  Tesla: { "Model 3": 39900, "Model Y": 44900 },
  Toyota: { "Camry": 29400, "Corolla": 24100, "RAV4": 32400 },
} as const;

export type VehicleMake = keyof typeof vehicleCatalog;

export type ClaimType = "first-party" | "third-party";
export type SupportedState = "GA" | "AL" | "TN" | "NC" | "SC";
export const jurisdictions: Record<SupportedState, {
  name: string; regionalFactor: number; firstParty: string; thirdParty: string; sourceLabel: string; sourceUrl: string;
}> = {
  GA: { name:"Georgia", regionalFactor:1.03, firstParty:"Georgia case law recognizes diminished value as a potential element of covered first-party physical-damage loss. Policy language and evidence still control.", thirdParty:"A third-party property claim may include proven residual loss in market value. Document pre-loss and post-repair value with market evidence.", sourceLabel:"State Farm v. Mabry (Ga. 2001)", sourceUrl:"https://law.justia.com/cases/georgia/supreme-court/2001/s01a0982-1.html" },
  AL: { name:"Alabama", regionalFactor:.97, firstParty:"Alabama’s claims rule says repair obligations do not themselves create a duty to pay alleged diminution in value. Review the policy and obtain claim-specific advice.", thirdParty:"Third-party recovery is fact-specific. Use repair records and independent market evidence; this estimator does not determine legal entitlement.", sourceLabel:"Ala. Admin. Code r. 482-1-125-.08", sourceUrl:"https://admincode.legislature.state.al.us/administrative-code/482-1-125-.08" },
  TN: { name:"Tennessee", regionalFactor:1, firstParty:"Coverage depends heavily on policy language. Tennessee decisions commonly distinguish repair cost from diminution measures, so claim-specific review is important.", thirdParty:"For repairable property, Tennessee courts often look first to reasonable repair cost; residual value loss requires appropriate proof and legal review.", sourceLabel:"Wilhoit v. Rogers (Tenn. Ct. App.)", sourceUrl:"https://www.tncourts.gov/sites/default/files/wilhoit.opn_-_final.pdf" },
  NC: { name:"North Carolina", regionalFactor:1, firstParty:"Coverage and eligibility depend on the policy and claim posture. North Carolina provides a statutory appraisal process for certain disputed motor-vehicle value losses.", thirdParty:"If liability is not disputed and estimates differ by more than $2,000 or 25% of pre-loss retail value, whichever is less, a written appraisal-demand process may apply.", sourceLabel:"N.C. Gen. Stat. § 20-279.21(d1)", sourceUrl:"https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_20/GS_20-279.21.html" },
  SC: { name:"South Carolina", regionalFactor:1, firstParty:"Policy language is central. In Schulmeyer, the state supreme court found no additional first-party diminished-value obligation under the specific repair-or-replace policy after adequate repair.", thirdParty:"Third-party damages and proof remain fact-specific. Use market evidence and do not treat the first-party Schulmeyer decision as a universal claim outcome.", sourceLabel:"Schulmeyer v. State Farm (S.C. 2003)", sourceUrl:"https://www.sccourts.org/media/opinions/HTMLFiles/SC/25612.htm" },
};

export function jurisdictionForZip(zip: string) {
  if (!/^\d{5}$/.test(zip)) return null;
  const prefix = Number(zip.slice(0, 3));
  const code: SupportedState | null = prefix >= 300 && prefix <= 319 || prefix === 398 || prefix === 399 ? "GA"
    : prefix >= 350 && prefix <= 369 ? "AL"
    : prefix >= 370 && prefix <= 385 ? "TN"
    : prefix >= 270 && prefix <= 289 ? "NC"
    : prefix >= 290 && prefix <= 299 ? "SC" : null;
  return code ? { code, ...jurisdictions[code] } : null;
}

export function estimateVehicleValue(year: number, make: string, model: string, mileage: number, currentYear = 2026, regionalFactor = 1) {
  const models = vehicleCatalog[make as VehicleMake] as Record<string, number> | undefined;
  const benchmark = models?.[model];
  if (!benchmark || !year) return null;
  const age = Math.max(0, currentYear - year);
  const ageAdjusted = benchmark * Math.max(0.25, Math.pow(0.88, age));
  const expectedMiles = Math.max(6_000, age * 12_000);
  const mileageDelta = expectedMiles - Math.max(0, mileage || 0);
  const mileageAdjustment = Math.max(-ageAdjusted * 0.15, Math.min(ageAdjusted * 0.15, mileageDelta * 0.08));
  return Math.max(1_000, Math.round(((ageAdjusted + mileageAdjustment) * regionalFactor) / 100) * 100);
}

const severityFactors: Record<Severity, number> = { cosmetic: 0.25, moderate: 0.5, major: 0.75, structural: 1 };
const historyFactors: Record<PriorHistory, number> = { none: 1, one: 0.75, multiple: 0.55 };
const classFactors: Record<VehicleClass, number> = { average: 1, premium: 1.2 };

export function mileageFactor(mileage: number) {
  if (mileage < 20_000) return 1; if (mileage < 40_000) return 0.8; if (mileage < 60_000) return 0.6; if (mileage < 80_000) return 0.4; if (mileage < 100_000) return 0.2; return 0.1;
}
export function ageFactor(age: number) { if (age <= 2) return 1; if (age <= 5) return 0.85; if (age <= 8) return 0.65; return 0.45; }

export function calculateEstimate(input: EstimateInput) {
  const value = Math.max(0, input.vehicleValue || 0); const repairs = Math.max(0, input.repairCost || 0);
  const severity = severityFactors[input.severity]; const mileage = mileageFactor(Math.max(0, input.mileage || 0)); const age = ageFactor(Math.max(0, input.vehicleAge || 0)); const history = historyFactors[input.priorHistory];
  const vehicleClass = classFactors[input.vehicleClass];
  const repairRatio = value ? repairs / value : 0; const repair = Math.min(1, Math.max(0.45, repairRatio / 0.15));
  const raw = value * 0.1 * severity * mileage * age * history * repair * vehicleClass; const midpoint = Math.min(value, Math.round(raw / 25) * 25); const low = Math.round((midpoint * 0.85) / 25) * 25; const high = Math.min(value, Math.round((midpoint * 1.15) / 25) * 25); const percent = (n: number) => `${Math.round(n * 100)}%`;
  return { midpoint, low, high, lossPercent: value ? midpoint / value * 100 : 0, multiplierLabel: [severity, mileage, age, history, repair, vehicleClass].map((n) => n.toFixed(2)).join(" × "), factors: [
    { label: "Vehicle class", detail: input.vehicleClass === "premium" ? "Premium market sensitivity" : "Average market segment", value: `${vehicleClass.toFixed(2)}×` },
    { label: "Damage", detail: `${input.severity[0].toUpperCase()}${input.severity.slice(1)} severity`, value: percent(severity) },
    { label: "Mileage", detail: `${Math.round(input.mileage || 0).toLocaleString()} miles`, value: percent(mileage) },
    { label: "Age", detail: `${input.vehicleAge || 0} years old`, value: percent(age) },
    { label: "History", detail: input.priorHistory === "none" ? "No prior accidents" : `${input.priorHistory} prior accident${input.priorHistory === "one" ? "" : "s"}`, value: percent(history) },
    { label: "Repair ratio", detail: `${(repairRatio * 100).toFixed(1)}% of vehicle value`, value: percent(repair) },
  ] };
}
export function formatMoney(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
