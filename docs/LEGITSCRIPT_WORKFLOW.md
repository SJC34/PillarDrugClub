# LegitScript Certification — Workflow Documentation
## Pharmacy Autopilot — pharmacyautopilot.com

**Last Updated:** February 2026  
**Prepared By:** Seth Collins, Pharm.D.  
**Certification Type:** Online Pharmacy (Tier 1 / Internet Pharmacy)

---

## 1. Overview

This document describes the operational workflows for Pharmacy Autopilot's online pharmacy platform to support LegitScript certification. LegitScript certification demonstrates that the pharmacy operates legally, requires valid prescriptions, and follows all applicable laws.

---

## 2. Pharmacy Licensing

### 2.1 Dispensing Pharmacy
Pharmacy Autopilot does not dispense medications directly. All dispensing is performed through a licensed partner pharmacy network (mail-order) in compliance with state and federal law.

**Partner Pharmacy Requirements:**
- Licensed in all 50 states (or states where members reside)
- DEA-registered for controlled substances (where applicable)
- State board of pharmacy licensed
- LegitScript certified or equivalent

### 2.2 Pharmacy Ownership
- **Pharmacist-in-Charge:** Seth Collins, Pharm.D.
- **Credentials:** Doctor of Pharmacy (Pharm.D.)
- **State License:** [License number — add before LegitScript submission]
- **DEA Registration:** [If applicable — add before LegitScript submission]

---

## 3. Prescription Requirement Workflow

### 3.1 Prescription Validation Process

All medications dispensed through Pharmacy Autopilot require a **valid, current prescription** from a licensed prescriber. The platform enforces this at every step:

**Step 1: Member Intake**
- Member provides physician/prescriber information during registration
- NPI number verified against NLM Clinical Tables NPI database in real-time
- Member selects medications they are currently prescribed

**Step 2: Prescription Request**
- Member submits prescription request via member dashboard
- System generates a branded Prescription Request Form (PDF)
- PDF includes: member information, medication, dosage, prescriber info, pharmacy contact details (SureScripts)

**Step 3: Prescriber Verification**
- Prescription Request Form sent to prescriber via:
  - Email (primary method)
  - SMS with secure link
  - Fax (manual process)
- Prescriber confirms/transmits prescription to partner pharmacy via SureScripts network

**Step 4: Pharmacist Review**
- Partner pharmacy pharmacist reviews prescription for:
  - Completeness and validity
  - Drug interactions (automated + pharmacist review)
  - Dosage appropriateness
  - Allergy check (cross-referenced with member drug allergy list)

**Step 5: Dispensing**
- Partner pharmacy dispenses and ships medication
- Tracking information provided to member

### 3.2 No Prescription? No Medication.
Pharmacy Autopilot does NOT:
- Allow members to order medications without a valid prescription
- Provide "online consultations" that result in prescription issuance for controlled substances
- Offer prescription-only medications over-the-counter
- Fill prescriptions for Schedule II controlled substances via mail-order

---

## 4. Drug Interaction & Safety Workflow

### 4.1 Drug-Drug Interaction Checking
- Member maintains a Personal Medication List in the member dashboard
- FDA-powered drug interaction checker runs pairwise analysis on all medications
- Severity levels: **Major** (contraindicated), **Moderate** (use with caution), **Minor** (monitor)
- Major interactions trigger a warning and recommend prescriber consultation

### 4.2 Drug Allergy Checking
- Member drug allergies captured at registration
- Stored in encrypted `drug_allergies` field
- Allergy cross-check performed before any prescription request is submitted
- Conflict flagged with mandatory acknowledgment

### 4.3 Side Effect Information
- FDA-sourced adverse reaction data displayed for all medications
- Likelihood scoring: High (>10%), Moderate (1-10%), Low (<1%)
- Data sourced from FDA Drug Label API (real-time)

---

## 5. Website Content Standards

### 5.1 Drug Advertising Compliance
- All medication listings display generic names alongside brand names
- Pricing is for generic medications only (cost-pass-through model)
- No unsubstantiated efficacy claims
- FDA-required safety information linked for each medication class

### 5.2 Prohibited Content
Pharmacy Autopilot's website does NOT contain:
- Testimonials claiming cure of specific diseases
- Deceptive pricing (all fees disclosed upfront: $99/year + $10/fill dispensing)
- Offers to prescribe controlled substances online
- Content promoting off-label use without disclosure

### 5.3 Required Disclosures
The following are displayed on all relevant pages:
- "A valid prescription is required for all prescription medications"
- Pharmacy contact information and licensed pharmacist name
- NABP accreditation information (pending)
- Money-back policy (annual memberships are non-refundable once activated — per Refund Policy page)

---

## 6. Privacy & Data Protection

### 6.1 PHI Protection
- Full HIPAA compliance (see `docs/HIPAA_COMPLIANCE.md`)
- SSL/TLS encryption on all connections
- PHI encrypted at rest (AES-256-CBC)
- 30-minute session timeout
- No PHI shared with third parties without member consent or legal requirement

### 6.2 Member Data Rights
- Members can download their data
- Prescriptions and medical history accessible in member dashboard
- Account deletion with data erasure available upon request

---

## 7. Refund & Cancellation Policy

Full policy available at `/refund-policy` and as downloadable PDF.

**Key Terms:**
- $99 annual membership is non-refundable once activated
- Dispensing fees ($10/fill) are non-refundable once dispensed
- Shipping fees non-refundable
- 12-month commitment — early termination fee applies if canceled before 12 months
- Hardship exemptions reviewed case-by-case by pharmacist

---

## 8. Controlled Substances Policy

Pharmacy Autopilot **does not** offer mail-order dispensing of:
- Schedule II controlled substances (e.g., opioids, stimulants, benzodiazepines in Schedule II)
- Any medication requiring special handling under the Ryan Haight Act

Members requiring controlled substances are referred to their local pharmacy.

---

## 9. Emergency & Crisis Resources

All pages include footer links to:
- **Poison Control:** 1-800-222-1222
- **Emergency Services:** 911
- **SAMHSA Helpline:** 1-800-662-4357

---

## 10. Contact Information for LegitScript

| Role | Name | Contact |
|------|------|---------|
| Pharmacist-in-Charge | Seth Collins, Pharm.D. | seth@pharmacyautopilot.com |
| Pharmacy Phone | — | [Add phone number] |
| Physical Address | — | [Add physical address] |
| Website | — | https://pharmacyautopilot.com |
| NABP e-Profile | — | [Add NABP number] |

---

## 11. LegitScript Application Checklist

- [ ] State pharmacy license (all states where dispensing)
- [ ] DEA registration (if dispensing controlled substances)
- [ ] NABP e-Profile created and submitted
- [ ] Privacy policy published at /privacy-policy
- [ ] Terms of service published at /terms
- [ ] Refund policy published at /refund-policy
- [ ] Notice of Privacy Practices published
- [ ] Prescription requirement statement on website
- [ ] Physical address of dispensing pharmacy disclosed
- [ ] Pharmacist name and license number displayed
- [ ] Contact phone number (toll-free preferred) listed
- [ ] Emergency contact information on site
- [ ] LegitScript seal placed on website upon certification
- [ ] BAAs signed with all PHI-processing vendors
- [ ] HIPAA compliance documentation complete

---

*This document should be reviewed and updated before each annual LegitScript certification renewal.*
