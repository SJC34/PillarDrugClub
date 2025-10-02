import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface PrescriptionRequestData {
  patientName: string;
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
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header with Pillar Drug Club branding
    doc.fontSize(24)
       .fillColor('#0d9488')
       .text('Pillar Drug Club', { align: 'center' });
    
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Wholesale Prescription Pharmacy', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(18)
       .fillColor('#111827')
       .text('Prescription Request', { align: 'center' });
    
    doc.moveDown(1);
    
    // Divider line
    doc.strokeColor('#0d9488')
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(562, doc.y)
       .stroke();
    
    doc.moveDown(1.5);

    // Request Information
    doc.fontSize(12)
       .fillColor('#111827')
       .text(`Request Date: ${data.requestDate}`, { align: 'right' });
    
    if (data.urgency !== 'routine') {
      doc.moveDown(0.5);
      doc.fontSize(11)
         .fillColor('#dc2626')
         .text(`Urgency: ${data.urgency.toUpperCase()}`, { align: 'right' });
    }
    
    doc.moveDown(1.5);

    // Patient Information Section
    doc.fontSize(14)
       .fillColor('#0d9488')
       .text('Patient Information', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#111827')
       .text(`Name: ${data.patientName}`)
       .text(`Date of Birth: ${data.dateOfBirth}`);
    
    doc.moveDown(1.5);

    // Medication Information Section
    doc.fontSize(14)
       .fillColor('#0d9488')
       .text('Medication Information', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#111827')
       .text(`Medication: ${data.medicationName}`)
       .text(`Dosage: ${data.dosage}`)
       .text(`Quantity: ${data.quantity}`);
    
    if (data.specialInstructions) {
      doc.moveDown(0.5);
      doc.text(`Special Instructions: ${data.specialInstructions}`);
    }
    
    doc.moveDown(1.5);

    // Doctor Information Section
    doc.fontSize(14)
       .fillColor('#0d9488')
       .text('Prescriber Information', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(11)
       .fillColor('#111827')
       .text(`Doctor: ${data.doctorName}`)
       .text(`Phone: ${data.doctorPhone}`);
    
    if (data.doctorFax) {
      doc.text(`Fax: ${data.doctorFax}`);
    }
    
    doc.text(`Address: ${data.doctorAddress}`);
    
    doc.moveDown(2);

    // Important Information Box
    doc.rect(50, doc.y, 512, 100)
       .fillAndStroke('#f0fdfa', '#0d9488');
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .fillColor('#0d9488')
       .text('Request to Prescriber:', 60, doc.y);
    
    doc.moveDown(0.3);
    doc.fontSize(10)
       .fillColor('#111827')
       .text('Please send the above prescription to:', 60, doc.y);
    
    doc.moveDown(0.3);
    doc.fontSize(11)
       .fillColor('#0d9488')
       .text('Pillar Drug Club', 60, doc.y, { continued: true })
       .fillColor('#111827')
       .text(' - Member\'s Wholesale Pharmacy');
    
    doc.moveDown(0.3);
    doc.fontSize(10)
       .text('Via: Surescripts eRx Network or Fax to [PHARMACY FAX]', 60, doc.y);
    
    doc.moveDown(2);

    // Footer
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text('Pillar Drug Club - Affordable Prescription Access', { align: 'center' })
       .text('$10/month membership - Wholesale prices - No insurance needed', { align: 'center' });

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
