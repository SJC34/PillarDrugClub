import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface PrescriptionRequestData {
  patientName: string;
  patientEmail?: string;
  dateOfBirth: string;
  medicationName: string;
  dosage: string;
  quantity: string;
  doctorName: string;
  doctorPhone: string;
  doctorAddress: string;
  urgency: string;
  specialInstructions?: string;
  requestDate: string;
}

export async function generatePrescriptionRequestPDF(data: PrescriptionRequestData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 60, right: 60 }
    });
    
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Brand Colors (matching website - HSL to RGB conversion)
    const BRAND_PRIMARY = '#2BABA2';      // HSL(177, 65%, 48%) - Teal
    const BRAND_SECONDARY = '#0A736D';    // HSL(177, 85%, 25%) - Dark Teal
    const BRAND_FOREGROUND = '#1C2F2E';   // HSL(177, 25%, 12%) - Very Dark Teal
    const BRAND_LIGHT_BG = '#E5F5F4';     // Light teal background
    const BRAND_MUTED = '#5A7A78';        // Muted teal for secondary text

    // Header with brand styling
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('PHARMACY AUTOPILOT', { align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Prescription Request Form', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(9)
       .fillColor(BRAND_MUTED)
       .text('Wholesale Prescription Pharmacy', { align: 'center' });
    
    doc.moveDown(1.5);
    
    // Introduction with clean styling
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('To have your prescriptions filled, please share this form with your healthcare provider to complete Step 4.', {
         align: 'left',
         width: 492
       });
    
    doc.moveDown(1.5);

    // Patient Information Box (branded)
    const patientBoxY = doc.y;
    doc.roundedRect(60, patientBoxY, 492, 70, 4)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_PRIMARY);
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('PATIENT INFORMATION', 75, patientBoxY + 15);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text(`Name: ${data.patientName}`, 75, patientBoxY + 35)
       .text(`Date of Birth: ${data.dateOfBirth}`, 75, patientBoxY + 50);
    
    if (data.patientEmail) {
      doc.text(`Email: ${data.patientEmail}`, 320, patientBoxY + 35);
    }
    
    doc.moveDown(4);

    // Two-column layout: Medication (left) and Savings (right)
    const twoColumnY = doc.y;
    const leftColX = 60;
    const rightColX = 310;
    const colWidth = 240;

    // Left Column: Step 1 & 2 - Medication Information
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('STEP 1 & 2: REQUESTED MEDICATION', leftColX, twoColumnY, { width: colWidth });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND);
    
    const medY = doc.y;
    doc.text(`Medication: `, leftColX, medY, { width: colWidth, continued: true })
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text(data.medicationName, { width: colWidth });
    
    doc.moveDown(0.3);
    const dosageY = doc.y;
    doc.font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text(`Dosage: `, leftColX, dosageY, { width: colWidth, continued: true })
       .font('Helvetica-Bold')
       .text(data.dosage, { width: colWidth });
    
    doc.moveDown(0.3);
    const qtyY = doc.y;
    doc.font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text(`Quantity: `, leftColX, qtyY, { width: colWidth, continued: true })
       .font('Helvetica-Bold')
       .text(data.quantity, { width: colWidth });
    
    if (data.specialInstructions) {
      doc.moveDown(0.5);
      const instrY = doc.y;
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(BRAND_MUTED)
         .text(`Special Instructions: ${data.specialInstructions}`, leftColX, instrY, { width: colWidth });
    }
    
    // Step 3 - Doctor Information (left column, below medication)
    doc.moveDown(1);
    const step3Y = doc.y;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('STEP 3: PRESCRIBER INFORMATION', leftColX, step3Y, { width: colWidth });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text(`Doctor: ${data.doctorName}`, leftColX, doc.y, { width: colWidth });
    doc.text(`Phone: ${data.doctorPhone}`, leftColX, doc.y, { width: colWidth });
    
    if (data.doctorAddress) {
      doc.text(`Address: ${data.doctorAddress}`, leftColX, doc.y, { width: colWidth });
    }
    
    const leftColEndY = doc.y;

    // Right Column: Savings Information Section (highlighted box)
    const savingsBoxHeight = 90;
    doc.roundedRect(rightColX, twoColumnY, colWidth, savingsBoxHeight, 4)
       .lineWidth(2)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_PRIMARY);
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text("MAXIMIZE YOUR PATIENT'S SAVINGS", rightColX + 10, twoColumnY + 10, { width: colWidth - 20 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(BRAND_FOREGROUND)
       .text('Example: Levothyroxine 25mcg', rightColX + 10, twoColumnY + 30, { width: colWidth - 20 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(BRAND_MUTED)
       .text('Traditional Insurance: ', rightColX + 10, twoColumnY + 43, { continued: true })
       .font('Helvetica')
       .text('$120/year', { width: colWidth - 20 });
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('Pharmacy Autopilot Wholesale: ', rightColX + 10, twoColumnY + 56, { continued: true })
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('$7.30/year', { width: colWidth - 20 });
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('Patient Saves $112.70/year', rightColX + 10, twoColumnY + 71, { width: colWidth - 20 });

    // Right Column: Prescription Writing Example (below savings box)
    const boxGap = 15;
    const rxExampleY = twoColumnY + savingsBoxHeight + boxGap;
    const rxExampleBoxHeight = 90;
    doc.roundedRect(rightColX, rxExampleY, colWidth, rxExampleBoxHeight, 4)
       .lineWidth(2)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_SECONDARY);
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('HOW TO WRITE THE RX:', rightColX + 10, rxExampleY + 8, { width: colWidth - 20 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Jane Smith 1/24/1986', rightColX + 10, rxExampleY + 23, { width: colWidth - 20 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Levothyroxine 100mcg', rightColX + 10, rxExampleY + 36, { width: colWidth - 20 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('TK 1 TAB PO QD', rightColX + 10, rxExampleY + 49, { width: colWidth - 20 });
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('#180 RF:1 or #360 RF:0', rightColX + 10, rxExampleY + 67, { width: colWidth - 20 });
    
    // Right column ends at bottom of second box
    // savingsBoxHeight (90) + gap (15) + rxExampleBoxHeight (90) = 195
    const rightColEndY = twoColumnY + savingsBoxHeight + boxGap + rxExampleBoxHeight;
    
    // Move down past the two-column section (use the taller column)
    doc.y = Math.max(leftColEndY, rightColEndY) + 20;

    // Step 4 - Provider Instructions (Critical Section with teal branding)
    const step4BoxY = doc.y;
    doc.roundedRect(60, step4BoxY, 492, 200, 4)
       .lineWidth(2)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_SECONDARY);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('STEP 4: HEALTHCARE PROVIDER INSTRUCTIONS', 75, step4BoxY + 15, { width: 462 });
    
    doc.moveDown(1.2);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Please submit electronic prescription via Surescripts eRx Network to:', 75, doc.y, { width: 462 });
    
    doc.moveDown(0.8);
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('HealthWarehouse', 75, doc.y);
    
    doc.moveDown(0.6);
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Pharmacy Lookup Information:', 75, doc.y);
    
    doc.moveDown(0.5);
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(BRAND_FOREGROUND)
       .text('NCPDP: ', 75, doc.y, { continued: true })
       .font('Helvetica')
       .text('1832674    ', { continued: true })
       .font('Helvetica-Bold')
       .text('NPI: ', { continued: true })
       .font('Helvetica')
       .text('1619252160    ', { continued: true })
       .font('Helvetica-Bold')
       .text('DEA: ', { continued: true })
       .font('Helvetica')
       .text('FH1427536');
    
    doc.moveDown(0.5);
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(BRAND_FOREGROUND)
       .text('Location: ', 75, doc.y, { continued: true })
       .font('Helvetica')
       .text('Florence, KY 41042');
    
    doc.moveDown(0.5);
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor(BRAND_MUTED)
       .text('Note: Filter by "Retail" or "Mail Order" in your pharmacy directory', 75, doc.y, { width: 462 });
    
    doc.moveDown(1);
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('CRITICAL: Include patient email in prescription', 75, doc.y, { width: 462 });
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text(`Email: ${data.patientEmail || 'REQUIRED'}`, 75, doc.y, { width: 462 })
       .text('Our pharmacy system matches prescriptions to patients via email address.', 75, doc.y, { width: 462 });

    doc.moveDown(2.5);

    // Privacy Disclaimer Box (clean branded style)
    const disclaimerBoxY = doc.y;
    doc.roundedRect(60, disclaimerBoxY, 492, 75, 4)
       .lineWidth(1)
       .strokeColor(BRAND_PRIMARY)
       .fillOpacity(0.05)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_PRIMARY)
       .fillOpacity(1);
    
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('CONFIDENTIAL MEDICAL INFORMATION', 75, disclaimerBoxY + 12, { width: 462 });
    
    doc.fontSize(7.5)
       .font('Helvetica')
       .fillColor(BRAND_MUTED)
       .text('This document contains protected health information (PHI) that is privileged and confidential. ', 75, disclaimerBoxY + 27, { width: 462 })
       .text('The information is for the sole use of the named patient and healthcare provider. We are required ', 75, doc.y, { width: 462 })
       .text('to safeguard PHI by applicable law. Proper consent to disclose PHI has been obtained.', 75, doc.y, { width: 462 });

    // Footer with brand colors
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(BRAND_MUTED)
       .text(`Request Date: ${new Date(data.requestDate).toLocaleDateString()}`, 60, 730, { align: 'left' });
    
    doc.fontSize(8)
       .fillColor(BRAND_PRIMARY)
       .text('PHARMACY AUTOPILOT', 60, 745, { align: 'center' })
       .fontSize(7)
       .fillColor(BRAND_MUTED)
       .text('Wholesale Prescription Pharmacy', 60, 756, { align: 'center' });

    doc.end();
  });
}

export function generateMessageTemplate(data: PrescriptionRequestData): string {
  return `Dear Dr. ${data.doctorName.split(' ').pop()},

I am a member of Pharmacy Autopilot, a wholesale prescription pharmacy service. I would like to request that you send my prescription to my pharmacy.

Patient Information:
- Name: ${data.patientName}
- Date of Birth: ${data.dateOfBirth}
- Email: ${data.patientEmail || 'REQUIRED'}

Prescription Requested:
- Medication: ${data.medicationName}
- Dosage: ${data.dosage}
- Quantity: ${data.quantity}
${data.specialInstructions ? `- Special Instructions: ${data.specialInstructions}` : ''}

Please send this prescription via Surescripts eRx Network to:

HealthWarehouse
NCPDP: 1832674
NPI: 1619252160
DEA: FH1427536
Location: Florence, KY 41042

Note: You may find us under "Retail" or "Mail Order" filter in your pharmacy directory.

IMPORTANT: Please include my email address (${data.patientEmail || 'REQUIRED'}) in the prescription so the pharmacy can match it to my account.

I have attached a detailed prescription request form for your review.

Thank you for your assistance.

Best regards,
${data.patientName}`;
}

export async function generateRefundPolicyPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 60, right: 60 }
    });
    
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Brand Colors
    const BRAND_PRIMARY = '#2BABA2';
    const BRAND_SECONDARY = '#0A736D';
    const BRAND_FOREGROUND = '#1C2F2E';
    const BRAND_LIGHT_BG = '#E5F5F4';
    const BRAND_MUTED = '#5A7A78';
    const BRAND_ACCENT = '#F59E0B';

    // Header
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('PHARMACY AUTOPILOT', { align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(BRAND_FOREGROUND)
       .text('Refund & Cancellation Policy', { align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(9)
       .fillColor(BRAND_MUTED)
       .text(`Effective Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, { align: 'center' });
    
    doc.moveDown(2);

    // Introduction
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Pharmacy Autopilot is a wholesale prescription pharmacy service operating under strict federal and state pharmacy regulations. This policy outlines our refund and cancellation terms, which are designed to comply with pharmaceutical industry requirements while maintaining transparency with our members.', {
         align: 'left',
         lineGap: 4
       });

    doc.moveDown(1.5);

    // Section 1: Annual Commitment Requirement
    const section1Y = doc.y;
    doc.roundedRect(60, section1Y - 10, 492, 50, 4)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_PRIMARY);
    
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('1. ANNUAL MEMBERSHIP COMMITMENT', 75, section1Y);
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('All memberships require a 12-month annual commitment from the date of subscription activation.', 75, doc.y, { width: 462, lineGap: 3 });

    doc.moveDown(2);

    // Section 2: No Refund Policy
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('2. NO REFUND POLICY');
    
    doc.moveDown(0.7);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND);

    const noRefundText = [
      { bold: true, text: '2.1 Medications: ' },
      { bold: false, text: 'Due to federal and state pharmacy regulations governing the dispensing of prescription medications, all medication sales are final. Once a prescription is received and processed by our partner pharmacy (HealthWarehouse), no refunds, returns, or exchanges are permitted under any circumstances.' }
    ];

    let xPos = 60;
    noRefundText.forEach(segment => {
      doc.font(segment.bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(segment.text, xPos, doc.y, { 
           width: 492, 
           continued: segment !== noRefundText[noRefundText.length - 1],
           lineGap: 4
         });
    });

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold')
       .text('2.2 Membership Fees: ', 60, doc.y, { continued: true })
       .font('Helvetica')
       .text('Monthly membership fees are non-refundable once a prescription has been received by our partner pharmacy on your behalf. This policy ensures compliance with pharmacy regulations and protects the integrity of our wholesale pricing model.', { width: 492, lineGap: 4 });

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold')
       .text('2.3 Pre-Prescription Grace Period: ', 60, doc.y, { continued: true })
       .font('Helvetica')
       .text('Members may request a full refund of membership fees within 7 days of initial subscription if no prescriptions have been transmitted to our partner pharmacy. After this period or once any prescription is received, all fees become non-refundable.', { width: 492, lineGap: 4 });

    doc.moveDown(2);

    // Section 3: Early Termination Fee
    const earlyTermY = doc.y;
    doc.roundedRect(60, earlyTermY - 10, 492, 95, 4)
       .fillAndStroke('#FEF3C7', BRAND_ACCENT);
    
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_ACCENT)
       .text('3. EARLY TERMINATION FEE', 75, earlyTermY);
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('Annual memberships are non-refundable once activated:', 75, doc.y, { width: 462, lineGap: 4 });

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold')
       .fillColor(BRAND_FOREGROUND)
       .text('• Pharmacy Autopilot Membership ($99/year):', 85, doc.y, { continued: true })
       .font('Helvetica')
       .text(' No refunds after activation', { width: 452 });

    doc.moveDown(0.5);
    doc.fontSize(9)
       .fillColor(BRAND_MUTED)
       .text('Annual membership fees cover administrative costs, pharmacy network access, and wholesale pricing arrangements made on your behalf.', 75, doc.y, { width: 462, lineGap: 3 });

    doc.moveDown(2);

    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    // Section 4: Cancellation Process
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('4. CANCELLATION PROCESS', 60, doc.y);
    
    doc.moveDown(0.7);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND);

    doc.text('To cancel your membership:', 60, doc.y, { lineGap: 4 });
    doc.moveDown(0.5);
    doc.text('1. Log into your account at pharmacyautopilot.com', 75, doc.y, { width: 477 });
    doc.text('2. Navigate to Account Settings > Cancel Membership', 75, doc.y, { width: 477 });
    doc.text('3. Review your commitment status and applicable termination fees', 75, doc.y, { width: 477 });
    doc.text('4. Confirm cancellation request', 75, doc.y, { width: 477 });
    doc.text('5. Receive email confirmation with final billing details', 75, doc.y, { width: 477 });

    doc.moveDown(0.8);
    doc.text('Cancellation is as easy as signing up - we comply with all consumer protection laws regarding subscription cancellation procedures.', 60, doc.y, { width: 492, lineGap: 4 });

    doc.moveDown(2);

    // Section 5: Regulatory Compliance
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('5. REGULATORY COMPLIANCE', 60, doc.y);
    
    doc.moveDown(0.7);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('This policy is designed to comply with:', 60, doc.y, { lineGap: 4 });

    doc.moveDown(0.5);
    doc.text('• Federal pharmacy regulations governing prescription medication dispensing', 75, doc.y, { width: 477 });
    doc.text('• State pharmacy board requirements in all 50 states', 75, doc.y, { width: 477 });
    doc.text('• FTC regulations regarding subscription services (ROSCA)', 75, doc.y, { width: 477 });
    doc.text('• California Automatic Renewal Law (effective July 1, 2025)', 75, doc.y, { width: 477 });
    doc.text('• Consumer protection laws in all jurisdictions we serve', 75, doc.y, { width: 477 });

    doc.moveDown(2);

    // Section 6: Member Rights
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('6. YOUR RIGHTS AS A MEMBER', 60, doc.y);
    
    doc.moveDown(0.7);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND);

    doc.text('You have the right to:', 60, doc.y, { lineGap: 4 });
    doc.moveDown(0.5);
    doc.text('• Receive clear disclosure of all fees, commitment terms, and cancellation policies', 75, doc.y, { width: 477 });
    doc.text('• Cancel your membership at any time (subject to termination fees if within commitment period)', 75, doc.y, { width: 477 });
    doc.text('• Access this policy at any time on our website', 75, doc.y, { width: 477 });
    doc.text('• Contact customer support with questions about fees or cancellation', 75, doc.y, { width: 477 });
    doc.text('• File complaints with state pharmacy boards or consumer protection agencies if you believe this policy violates applicable regulations', 75, doc.y, { width: 477 });

    doc.moveDown(2);

    // Section 7: Contact Information
    const contactY = doc.y;
    doc.roundedRect(60, contactY - 10, 492, 90, 4)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_PRIMARY);
    
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('7. CONTACT US', 75, contactY);
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('For questions about this refund policy or to request cancellation:', 75, doc.y, { width: 462, lineGap: 4 });

    doc.moveDown(0.5);
    doc.text('Email: support@pharmacyautopilot.com', 75, doc.y, { width: 462 });
    doc.text('Website: www.pharmacyautopilot.com/refund-policy', 75, doc.y, { width: 462 });
    doc.text('Response Time: Within 2 business days', 75, doc.y, { width: 462 });

    // Check if we need a new page for disclaimer
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.moveDown(2);

    // Important Notice Box
    const noticeY = doc.y;
    doc.roundedRect(60, noticeY - 10, 492, 120, 4)
       .fillAndStroke('#FEE2E2', '#DC2626');
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#DC2626')
       .text('IMPORTANT NOTICE', 75, noticeY);
    
    doc.moveDown(0.5);
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(BRAND_FOREGROUND)
       .text('By subscribing to Pharmacy Autopilot, you acknowledge that you have read, understood, and agree to this Refund & Cancellation Policy. You understand that:', 75, doc.y, { width: 462, lineGap: 3 });

    doc.moveDown(0.3);
    doc.text('• All prescription medication sales are final under pharmacy regulations', 80, doc.y, { width: 457 });
    doc.text('• Membership requires a 12-month commitment', 80, doc.y, { width: 457 });
    doc.text('• Early cancellation incurs an 8-month termination fee', 80, doc.y, { width: 457 });
    doc.text('• Membership fees are non-refundable after prescriptions are received', 80, doc.y, { width: 457 });

    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(BRAND_MUTED)
       .text(`Document Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 60, 730, { align: 'left' });
    
    doc.fontSize(9)
       .fillColor(BRAND_PRIMARY)
       .text('PHARMACY AUTOPILOT', 60, 745, { align: 'center' })
       .fontSize(7)
       .fillColor(BRAND_MUTED)
       .text('Wholesale Prescription Pharmacy • Licensed in All 50 States', 60, 756, { align: 'center' });

    doc.end();
  });
}
