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
      margins: { top: 40, bottom: 40, left: 50, right: 50 }
    });
    
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20)
       .fillColor('#0d9488')
       .text('Pillar Drug Club', { align: 'center' });
    
    doc.fontSize(16)
       .fillColor('#111827')
       .text('Prescription Request Form', { align: 'center' });
    
    doc.moveDown(1);
    
    // Introduction
    doc.fontSize(10)
       .fillColor('#374151')
       .text('To have your prescriptions filled, please complete the information below and share this form', 50, doc.y, { align: 'left' })
       .text('with your healthcare provider to complete Step 4.', 50, doc.y, { align: 'left' });
    
    doc.moveDown(1.5);

    // Patient Information Box
    doc.rect(50, doc.y, 512, 60)
       .fillAndStroke('#f0fdfa', '#0d9488');
    
    const patientBoxY = doc.y + 10;
    doc.fontSize(11)
       .fillColor('#0d9488')
       .text('Patient Information (Completed)', 60, patientBoxY, { underline: true });
    
    doc.fontSize(9)
       .fillColor('#111827')
       .text(`Name: ${data.patientName}`, 60, patientBoxY + 18)
       .text(`Date of Birth: ${data.dateOfBirth}`, 60, patientBoxY + 32);
    
    if (data.patientEmail) {
      doc.text(`Email: ${data.patientEmail}`, 300, patientBoxY + 18);
    }
    
    doc.moveDown(3);

    // Step 1 & 2 - Medication Information
    doc.fontSize(11)
       .fillColor('#0d9488')
       .text('Step 1 & 2: Requested Medication (Completed)', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#111827')
       .text(`Medication: ${data.medicationName}`)
       .text(`Dosage: ${data.dosage}`)
       .text(`Quantity: ${data.quantity}`);
    
    if (data.specialInstructions) {
      doc.moveDown(0.3);
      doc.fontSize(9)
         .fillColor('#6b7280')
         .text(`Special Instructions: ${data.specialInstructions}`, { width: 500 });
    }
    
    doc.moveDown(1.5);

    // Step 3 - Doctor Information
    doc.fontSize(11)
       .fillColor('#0d9488')
       .text('Step 3: Prescriber Information (Completed)', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#111827')
       .text(`Doctor Name: ${data.doctorName}`)
       .text(`Phone: ${data.doctorPhone}`);
    
    if (data.doctorFax) {
      doc.text(`Fax: ${data.doctorFax}`);
    }
    
    if (data.doctorAddress) {
      doc.text(`Address: ${data.doctorAddress}`);
    }
    
    doc.moveDown(2);

    // Step 4 - Provider Instructions (Critical Section)
    doc.rect(50, doc.y, 512, 150)
       .fillAndStroke('#fef3c7', '#f59e0b');
    
    const providerBoxY = doc.y + 12;
    doc.fontSize(12)
       .fillColor('#f59e0b')
       .text('Step 4: Healthcare Providers - Please Submit Electronic Prescription to:', 60, providerBoxY, { underline: true, width: 480 });
    
    doc.moveDown(1.5);
    doc.fontSize(10)
       .fillColor('#111827')
       .text('Perform pharmacy search for:', 60, doc.y)
       .fontSize(11)
       .fillColor('#0d9488')
       .text('"Pillar Drug Club"', 60, doc.y);
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#111827')
       .text('NCPDP ID: ', 60, doc.y, { continued: true })
       .fontSize(11)
       .fillColor('#0d9488')
       .text('[To be provided - Contact Pillar Drug Club]');
    
    doc.moveDown(1);
    doc.fontSize(10)
       .fillColor('#dc2626')
       .text('IMPORTANT: Providers MUST INCLUDE THE PATIENT\'S EMAIL ADDRESS', 60, doc.y, { width: 480 })
       .fontSize(9)
       .fillColor('#374151')
       .text(`(${data.patientEmail || 'Patient email required'})`, 60, doc.y, { width: 480 })
       .text('Our pharmacy system requires an email address to match new prescriptions with patients.', 60, doc.y, { width: 480 });
    
    doc.moveDown(2.5);

    // Privacy Disclaimer Box
    const disclaimerBoxY = doc.y;
    doc.rect(350, disclaimerBoxY, 212, 100)
       .fillAndStroke('#f9fafb', '#d1d5db');
    
    doc.fontSize(7)
       .fillColor('#6b7280')
       .text('This document contains information that is', 360, disclaimerBoxY + 8, { width: 192, align: 'left' })
       .text('privileged, confidential and/or may contain', 360, doc.y, { width: 192, align: 'left' })
       .text('protected health information (PHI). We are', 360, doc.y, { width: 192, align: 'left' })
       .text('required to safeguard PHI by applicable law.', 360, doc.y, { width: 192, align: 'left' })
       .text('The information in this document is for the', 360, doc.y, { width: 192, align: 'left' })
       .text('sole use of the person(s) or company named', 360, doc.y, { width: 192, align: 'left' })
       .text('above. Proper consent to disclose PHI', 360, doc.y, { width: 192, align: 'left' })
       .text('between these parties has been obtained.', 360, doc.y, { width: 192, align: 'left' });

    // Footer
    doc.fontSize(8)
       .fillColor('#6b7280')
       .text(`Request Date: ${data.requestDate}`, 50, 740, { align: 'left' })
       .text('Pillar Drug Club - Wholesale Prescription Pharmacy', 50, 752, { align: 'center' });

    doc.end();
  });
}

export function generateMessageTemplate(data: PrescriptionRequestData): string {
  return `Dear Dr. ${data.doctorName.split(' ').pop()},

I am a member of Pillar Drug Club, a wholesale prescription pharmacy service. I would like to request that you send my prescription to my pharmacy.

Patient Information:
- Name: ${data.patientName}
- Date of Birth: ${data.dateOfBirth}

Prescription Requested:
- Medication: ${data.medicationName}
- Dosage: ${data.dosage}
- Quantity: ${data.quantity}
${data.specialInstructions ? `- Special Instructions: ${data.specialInstructions}` : ''}

Please send this prescription to:
Pillar Drug Club (my wholesale pharmacy)
Via: Surescripts eRx Network or fax

I have attached a detailed prescription request form for your review.

Thank you for your assistance.

Best regards,
${data.patientName}`;
}
