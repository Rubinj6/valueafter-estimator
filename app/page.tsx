"use client";

import { useMemo, useState } from "react";
import { calculateEstimate, estimateVehicleValue, formatMoney, jurisdictionForZip, vehicleCatalog, type ClaimType, type EstimateInput, type VehicleMake } from "../lib/diminished-value";

const samples: Array<{ label: string; description: string; values: EstimateInput }> = [
  { label: "2022 Audi Q5", description: "Premium · moderate", values: { vehicleValue: 38200, mileage: 28400, repairCost: 9600, vehicleAge: 4, vehicleClass: "premium", severity: "moderate", priorHistory: "none" } },
  { label: "2020 Toyota Camry", description: "Average · major", values: { vehicleValue: 22400, mileage: 61750, repairCost: 11200, vehicleAge: 6, vehicleClass: "average", severity: "major", priorHistory: "none" } },
  { label: "2018 Honda CR-V", description: "Average · cosmetic", values: { vehicleValue: 18600, mileage: 88400, repairCost: 3400, vehicleAge: 8, vehicleClass: "average", severity: "cosmetic", priorHistory: "one" } },
];

const years = Array.from({ length: 11 }, (_, index) => 2026 - index);
const premiumMakes = new Set(["Audi", "BMW", "Lexus", "Tesla"]);

function MoneyInput({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
  return <div className="input-wrap money-input"><span aria-hidden="true">$</span><input id={id} inputMode="decimal" min="0" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

export default function Home() {
  const [values, setValues] = useState<EstimateInput>(samples[0].values);
  const [vehicle, setVehicle] = useState({ year: "2022", make: "Audi", model: "Q5" });
  const [zip, setZip] = useState("30303");
  const [claimType, setClaimType] = useState<ClaimType>("first-party");
  const [valueSource, setValueSource] = useState<"catalog" | "manual">("catalog");
  const [showMethod, setShowMethod] = useState(false);
  const estimate = useMemo(() => calculateEstimate(values), [values]);
  const jurisdiction = useMemo(() => jurisdictionForZip(zip), [zip]);
  const update = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => setValues((current) => ({ ...current, [key]: value }));
  const applyCatalogValue = (next = vehicle, mileage = values.mileage, regionFactor = jurisdiction?.regionalFactor ?? 1) => {
    const result = estimateVehicleValue(Number(next.year), next.make, next.model, mileage, 2026, regionFactor);
    if (result) {
      setValues((current) => ({ ...current, vehicleValue: result, vehicleAge: 2026 - Number(next.year), mileage }));
      setValueSource("catalog");
    }
  };
  const selectVehicle = (key: "year" | "make" | "model", choice: string) => {
    const next = { ...vehicle, [key]: choice };
    if (key === "make") next.model = Object.keys(vehicleCatalog[choice as VehicleMake])[0];
    setVehicle(next);
    if (key === "make") update("vehicleClass", premiumMakes.has(choice) ? "premium" : "average");
    applyCatalogValue(next);
  };
  const loadSample = (sample: typeof samples[number]) => {
    const [year, make, ...model] = sample.label.split(" ");
    setVehicle({ year, make, model: model.join(" ") });
    setValues(sample.values);
    setValueSource("catalog");
  };
  const updateZip = (nextZip: string) => {
    const clean = nextZip.replace(/\D/g, "").slice(0, 5);
    setZip(clean);
    const region = jurisdictionForZip(clean);
    if (region) applyCatalogValue(vehicle, values.mileage, region.regionalFactor);
  };

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="ValueAfter home"><span>V</span> ValueAfter</a>
      <nav aria-label="Primary navigation"><a href="#calculator">Calculator</a><a href="#methodology">Methodology</a><a href="#about">About</a></nav>
      <a className="outline-button" href="#methodology">How it works <span aria-hidden="true">→</span></a>
    </header>

    <section className="hero" id="top">
      <div className="eyebrow"><span>◆</span> Independent estimate tool</div>
      <h1>Understand what your car<br />may have <em>lost.</em></h1>
      <p>Get a clear, data-informed estimate of your vehicle’s potential diminished value after an accident—in under two minutes.</p>
      <div className="trust-row"><span><b>✓</b> No signup</span><span><b>✓</b> Transparent calculation</span><span><b>✓</b> Private by design</span></div>
    </section>

    <section className="workspace" id="calculator" aria-label="Diminished value calculator">
      <div className="form-panel">
        <div className="section-heading"><div><span className="step">01</span><h2>Vehicle &amp; damage details</h2></div><p>Choose a supported vehicle to create an illustrative pre-loss value, or edit the value manually.</p></div>

        <div className="vehicle-lookup" aria-label="Vehicle value lookup">
          <div className="lookup-heading"><div><b>Vehicle lookup</b><span>Year, make &amp; model</span></div><small>Illustrative catalog</small></div>
          <div className="lookup-grid">
            <label><span>Year</span><select value={vehicle.year} onChange={(e) => selectVehicle("year", e.target.value)}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
            <label><span>Make</span><select value={vehicle.make} onChange={(e) => selectVehicle("make", e.target.value)}>{Object.keys(vehicleCatalog).map((make) => <option key={make}>{make}</option>)}</select></label>
            <label><span>Model</span><select value={vehicle.model} onChange={(e) => selectVehicle("model", e.target.value)}>{Object.keys(vehicleCatalog[vehicle.make as VehicleMake]).map((model) => <option key={model}>{model}</option>)}</select></label>
          </div>
          <div className="lookup-result"><span><i>✓</i><span><b>{formatMoney(values.vehicleValue)}</b><small>Estimated pre-loss value · mileage adjusted</small></span></span><button type="button" onClick={() => applyCatalogValue()}>Recalculate from vehicle</button></div>
        </div>

        <div className="location-card">
          <div className="location-title"><span className="location-pin" aria-hidden="true">⌖</span><div><b>Claim location</b><small>Sets the regional value proxy and state guidance</small></div></div>
          <div className="location-fields">
            <label htmlFor="zip-code"><span>ZIP code</span><input id="zip-code" inputMode="numeric" pattern="[0-9]*" placeholder="30303" value={zip} onChange={(e) => updateZip(e.target.value)} /></label>
            <label><span>Claim type</span><select value={claimType} onChange={(e) => setClaimType(e.target.value as ClaimType)}><option value="first-party">My own insurer</option><option value="third-party">At-fault driver’s insurer</option></select></label>
          </div>
          {jurisdiction ? <div className="state-confirm"><b>{jurisdiction.name}</b><span>{Math.round((jurisdiction.regionalFactor - 1) * 100) >= 0 ? "+" : ""}{Math.round((jurisdiction.regionalFactor - 1) * 100)}% prototype regional adjustment</span></div> : <p className="zip-help">Enter a ZIP code in Georgia, Alabama, Tennessee, North Carolina, or South Carolina.</p>}
        </div>

        <div className="field-grid">
          <label htmlFor="vehicle-value"><span>Pre-accident market value <small className="source-tag">{valueSource === "catalog" ? "Auto-estimated" : "Manual"}</small></span><MoneyInput id="vehicle-value" value={values.vehicleValue} onChange={(value) => { update("vehicleValue", value); setValueSource("manual"); }} /></label>
          <label><span>Current mileage <small className="source-tag live-tag">Updates value</small></span><div className="input-wrap suffix-input"><input aria-label="Current mileage" inputMode="numeric" min="0" type="number" value={values.mileage} onChange={(e) => applyCatalogValue(vehicle, Number(e.target.value))} /><small>miles</small></div><small className="field-help">Compared with approximately 12,000 miles per vehicle year. Higher mileage lowers the estimated value; lower mileage raises it, capped at ±15%.</small></label>
          <label htmlFor="repair-cost"><span>Repair cost</span><MoneyInput id="repair-cost" value={values.repairCost} onChange={(value) => update("repairCost", value)} /></label>
          <label><span>Vehicle age</span><div className="input-wrap suffix-input"><input aria-label="Vehicle age" inputMode="numeric" min="0" max="40" type="number" value={values.vehicleAge} onChange={(e) => update("vehicleAge", Number(e.target.value))} /><small>years</small></div></label>
        </div>

        <fieldset className="vehicle-class"><legend>Vehicle market class</legend><p>Premium vehicles can experience greater buyer sensitivity after a reported accident. Choose the segment that best matches the vehicle—not its condition.</p><div className="choice-grid class-choices">
          {([["average", "Average vehicle", "Mainstream makes and models", "1.00×"], ["premium", "Premium vehicle", "Luxury, prestige, or high-performance models", "1.20×"]] as const).map(([value, title, detail, multiplier]) =>
            <label className={values.vehicleClass === value ? "choice class-choice selected" : "choice class-choice"} key={value}><input type="radio" name="vehicle-class" checked={values.vehicleClass === value} onChange={() => update("vehicleClass", value)} /><span className="radio-dot" /><span><strong>{title}</strong><small>{detail}</small></span><b>{multiplier}</b></label>)}
        </div></fieldset>

        <fieldset><legend>Damage severity</legend><div className="choice-grid severity-choices">
          {([["cosmetic", "Cosmetic", "Paint, trim, minor panels"], ["moderate", "Moderate", "Multiple panels, bolt-on parts"], ["major", "Major", "Suspension, airbags, major panels"], ["structural", "Structural", "Frame or unibody repair"]] as const).map(([value, title, detail]) =>
            <label className={values.severity === value ? "choice selected" : "choice"} key={value}><input type="radio" name="severity" checked={values.severity === value} onChange={() => update("severity", value)} /><span className="radio-dot" /><strong>{title}</strong><small>{detail}</small></label>)}
        </div></fieldset>

        <fieldset><legend>Prior accident history</legend><div className="choice-grid history-choices">
          {([["none", "None reported"], ["one", "One prior accident"], ["multiple", "Multiple prior accidents"]] as const).map(([value, title]) =>
            <label className={values.priorHistory === value ? "choice selected compact" : "choice compact"} key={value}><input type="radio" name="history" checked={values.priorHistory === value} onChange={() => update("priorHistory", value)} /><span className="radio-dot" /><strong>{title}</strong></label>)}
        </div></fieldset>

        <div className="samples"><span>Try sample data</span><div>{samples.map((sample) => <button type="button" key={sample.label} onClick={() => loadSample(sample)}><strong>{sample.label}</strong><small>{sample.description}</small></button>)}</div></div>
      </div>

      <aside className="result-panel" aria-live="polite">
        <span className="result-label">Estimated diminished value</span>
        <div className="estimate-range"><strong>{formatMoney(estimate.low)}</strong><span>to</span><strong>{formatMoney(estimate.high)}</strong></div>
        <p className="midpoint">Midpoint estimate <b>{formatMoney(estimate.midpoint)}</b></p>
        <div className="meter"><span style={{ width: `${Math.min(100, estimate.lossPercent * 6)}%` }} /></div>
        <p className="loss-copy">Estimated value impact: <b>{estimate.lossPercent.toFixed(1)}%</b> of pre-accident value</p>
        <div className="result-breakdown"><h3>What shaped this estimate</h3>{estimate.factors.map((factor) => <div className="factor" key={factor.label}><span>{factor.label}<small>{factor.detail}</small></span><b>{factor.value}</b></div>)}</div>
        {jurisdiction && <div className="jurisdiction-note"><span>{jurisdiction.code} · {claimType === "first-party" ? "Own insurer" : "Other driver’s insurer"}</span><h3>{jurisdiction.name} claim guidance</h3><p>{claimType === "first-party" ? jurisdiction.firstParty : jurisdiction.thirdParty}</p><a href={jurisdiction.sourceUrl} target="_blank" rel="noreferrer">Read primary source: {jurisdiction.sourceLabel} ↗</a></div>}
        <button className="method-button" type="button" onClick={() => setShowMethod((shown) => !shown)} aria-expanded={showMethod}>{showMethod ? "Hide" : "View"} calculation details <span>{showMethod ? "−" : "+"}</span></button>
        {showMethod && <div className="formula">{formatMoney(values.vehicleValue)} × 10% ceiling × {estimate.multiplierLabel} = <b>{formatMoney(estimate.midpoint)}</b></div>}
        <div className="notice"><span aria-hidden="true">i</span><p><strong>Estimate, not a guarantee</strong>This screening result is not an appraisal, claim valuation, or promise of payment.</p></div>
      </aside>
    </section>

    <section className="methodology" id="methodology">
      <div><span className="step">02</span><h2>A transparent starting point,<br />not a black-box answer.</h2></div>
      <div className="method-copy"><p>ValueAfter uses a configurable heuristic to screen for potential post-repair market loss. It starts with a conservative ceiling of 10% of pre-accident value, then applies five visible adjustments.</p>
          <ol><li><b>Pre-loss value</b><span>Illustrative year, model, age, and mileage estimate</span></li><li><b>Location</b><span>Broad regional price proxy from the entered ZIP</span></li><li><b>Vehicle class</b><span>Average 1.00×; premium 1.20× market-sensitivity factor</span></li><li><b>Damage severity</b><span>Cosmetic through structural impact</span></li><li><b>Mileage</b><span>Lower-mileage vehicles receive greater weight</span></li><li><b>Vehicle age</b><span>Newer vehicles receive greater weight</span></li><li><b>Prior history</b><span>Earlier accidents reduce incremental loss</span></li><li><b>Repair ratio</b><span>Repair cost relative to market value</span></li></ol>
        <p className="fine-print">Catalog and regional values are illustrative proxies based on generalized depreciation, mileage, and broad regional-price assumptions—not live vehicle listings or VIN-specific data. State guidance summarizes selected sources and does not decide coverage, liability, deadlines, eligibility, or recoverability. The displayed range is 85%–115% of the midpoint. A production model should use licensed valuation data, local comparable sales, trim and options, condition, verified repair records, title/history data, and attorney-reviewed jurisdiction rules.</p></div>
    </section>

    <section className="disclaimer" id="about"><h2>Before you rely on an estimate</h2><div><p><b>Educational use only.</b> Results are general estimates based solely on the information entered and a simplified methodology. They are not certified appraisals, offers, legal advice, insurance advice, or guarantees of claim eligibility, settlement, or payment.</p><p>Insurance rules, claim standards, evidence requirements, and recoverability vary by policy and jurisdiction. Consult a qualified independent appraiser and licensed attorney or insurance professional for advice about your circumstances.</p></div></section>
    <footer><a className="brand" href="#top"><span>V</span> ValueAfter</a><p>Know the number. Understand the limits.</p><small>Prototype · Estimates only</small></footer>
  </main>;
}
