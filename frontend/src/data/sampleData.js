export const SAMPLE_COMPLAINTS = [
  {
    id: "sample-1",
    title: "Critical Particulate Contamination (Paclitaxel Injection)",
    risk: "Critical",
    badgeClass: "badge-critical",
    product: "Paclitaxel Injection 6mg/mL",
    batch: "AZ-9041",
    customer: "St. Jude Children's Research Hospital",
    type: "Quality Defect",
    text: `COMPLAINT REPORT: St. Jude Children's Research Hospital reported visible dark particulate matter inside a sealed sterile glass vial of Paclitaxel Injection 6mg/mL (Batch #AZ-9041, NDC 0781-2241-50) during cleanroom admixture. Inspection confirmed 1-2 mm fiber specks. Vial quarantined immediately prior to patient administration.`
  },
  {
    id: "sample-2",
    title: "High Risk Potency Out-of-Specification (Amoxicillin Capsules)",
    risk: "High",
    badgeClass: "badge-high",
    product: "Amoxicillin 500mg Capsules",
    batch: "TB-4412",
    customer: "CVS Health Pharmacy Store #4812",
    type: "Quality Defect",
    text: `OUT OF SPECIFICATION ASSAY REPORT: CVS Health Pharmacy submitted a customer complaint regarding Amoxicillin 500mg Capsules (Batch #TB-4412). Patient reported lack of therapeutic efficacy after 5 days. Stability testing revealed active assay at 82.4% of label claim (USP specification required: 90.0% - 110.0%).`
  },
  {
    id: "sample-3",
    title: "Medium Risk Blister Foil Packaging Defect (Metformin ER)",
    risk: "Medium",
    badgeClass: "badge-medium",
    product: "Metformin ER 500mg Tablets",
    batch: "PK-8810",
    customer: "Apex Pharma Distributors",
    type: "Packaging",
    text: `PACKAGING DEFECT: Apex Pharma Distributors reported incomplete heat sealing on push-through aluminium blister foil strips for Metformin ER 500mg Tablets (Batch #PK-8810). Unsealed margins resulted in minor tablet surface moisture discoloration. No patient exposure.`
  },
  {
    id: "sample-4",
    title: "Low Risk Secondary Carton Label Smudge (Paracetamol Syrup)",
    risk: "Low",
    badgeClass: "badge-low",
    product: "Paracetamol Pediatric Syrup 120mg/5mL",
    batch: "LB-1002",
    customer: "Direct Care Pharmacy",
    type: "Packaging",
    text: `LABEL COSMETIC DEFECT: Direct Care Pharmacy reported light ink smudging on secondary outer carton box for Paracetamol Pediatric Syrup 120mg/5mL (Batch #LB-1002). Expiration date and lot number remain fully legible. Primary bottle label intact.`
  }
];
