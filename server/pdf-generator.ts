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
  doctorFax?: string;
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
       .text('PILLAR DRUG CLUB', { align: 'center' });
    
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
    
    if (data.doctorFax) {
      doc.text(`Fax: ${data.doctorFax}`, leftColX, doc.y, { width: colWidth });
    }
    
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
       .text('Pillar Wholesale: ', rightColX + 10, twoColumnY + 56, { continued: true })
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
    const rxExampleBoxHeight = 65;
    doc.roundedRect(rightColX, rxExampleY, colWidth, rxExampleBoxHeight, 4)
       .lineWidth(2)
       .fillAndStroke(BRAND_LIGHT_BG, BRAND_SECONDARY);
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(BRAND_SECONDARY)
       .text('HOW TO WRITE THE RX:', rightColX + 10, rxExampleY + 10, { width: colWidth - 20 });
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('#365', rightColX + 10, rxExampleY + 30, { width: colWidth - 20 });
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(BRAND_PRIMARY)
       .text('REFILLS: 0', rightColX + 10, rxExampleY + 48, { width: colWidth - 20 });
    
    // Right column ends at bottom of second box
    // savingsBoxHeight (90) + gap (15) + rxExampleBoxHeight (65) = 170
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
       .text('PILLAR DRUG CLUB', 60, 745, { align: 'center' })
       .fontSize(7)
       .fillColor(BRAND_MUTED)
       .text('Wholesale Prescription Pharmacy', 60, 756, { align: 'center' });

    doc.end();
  });
}

export function generateMessageTemplate(data: PrescriptionRequestData): string {
  return `Dear Dr. ${data.doctorName.split(' ').pop()},

I am a member of Pillar Drug Club, a wholesale prescription pharmacy service. I would like to request that you send my prescription to my pharmacy.

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
