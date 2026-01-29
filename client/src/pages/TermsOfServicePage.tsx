import { Link } from "wouter";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  const handleDownloadPDF = () => {
    window.open('/api/terms-of-service/pdf', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-12 w-12" />
            <h1 className="text-4xl font-bold font-display">Terms of Service</h1>
          </div>
          <p className="text-center text-primary-foreground/90 max-w-3xl mx-auto">
            Legal Agreement for Pillar Drug Club Services
          </p>
          <p className="text-center text-sm text-primary-foreground/80 mt-4">
            Effective Date: October 23, 2025 | Last Updated: October 23, 2025
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8 flex justify-end">
          <Button onClick={handleDownloadPDF} variant="outline" data-testid="button-download-terms-pdf">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Introduction */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-lg font-semibold text-foreground mb-4">
              PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE USING PILLAR DRUG CLUB'S SERVICES.
            </p>
            <p className="text-muted-foreground">
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("Member," "you," or "your") and Pillar Drug Club ("Pillar," "we," "us," or "our") governing your use of our wholesale prescription pharmacy platform and related services. By accessing or using our website, mobile application, or services, you agree to be bound by these Terms and our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Acceptance of Terms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By creating an account, subscribing to a membership plan, or using any of Pillar Drug Club's services, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and our Refund Policy.
            </p>
            <p className="font-semibold">
              IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE OUR SERVICES.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of our services after changes constitutes acceptance of the modified Terms.
            </p>
          </CardContent>
        </Card>

        {/* Section 2: Eligibility */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">2. Eligibility Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              To use Pillar Drug Club services, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be at least 18 years of age</li>
              <li>Be a resident of the United States</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not be prohibited from using our services under applicable laws</li>
            </ul>
            <p>
              By using our services, you represent and warrant that you meet all eligibility requirements.
            </p>
          </CardContent>
        </Card>

        {/* Section 3: Service Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">3. Description of Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">What Pillar Drug Club Provides</h3>
              <p className="mb-3">
                Pillar Drug Club is a membership-based wholesale prescription pharmacy platform offering:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Wholesale pricing on prescription medications for chronic conditions</li>
                <li>Year-supply (6-month and 12-month) prescription fulfillment</li>
                <li>Prescription management and refill coordination</li>
                <li>Healthcare provider coordination services</li>
                <li>Medication information and drug safety resources</li>
                <li>Member support and customer service</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">What Pillar Drug Club Is NOT</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>We are NOT health insurance and do not replace health insurance</li>
                <li>We are NOT a telemedicine service and do not provide medical diagnoses or prescriptions</li>
                <li>We do NOT prescribe medications; all prescriptions must come from your licensed healthcare provider</li>
                <li>We are NOT an emergency pharmacy; allow 5-10 business days for prescription fulfillment</li>
                <li>We do NOT guarantee availability of all medications at all times</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Membership Plans</h3>
              <p className="mb-3">
                Pillar Drug Club offers three membership tiers:
              </p>
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Foundation (Free) - $0/year</p>
                  <p className="text-muted-foreground">Best for trying Pillar before committing. Up to 90-day supply with $30 fulfillment per order.</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Gold – 6 Month - $59/year</p>
                  <p className="text-muted-foreground">Best for most people on stable medications. Up to 6-month supply with $10 fulfillment per shipment.</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Gold – 12 Month - $99/year</p>
                  <p className="text-muted-foreground">Best for maximum convenience and zero refills. Up to 12-month supply with $10 fulfillment per shipment.</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Both plans are billed annually. See Section 5 for detailed payment terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Account Responsibilities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">4. Account Registration and Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-base mb-2">Account Creation</h3>
              <p className="text-muted-foreground mb-2">
                To access our services, you must create an account by providing:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Full legal name</li>
                <li>Valid email address</li>
                <li>Current mailing address</li>
                <li>Date of birth</li>
                <li>Payment information</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Your Responsibilities</h3>
              <p className="text-muted-foreground mb-2">
                You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password confidential and secure</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Not share your account with others</li>
                <li>Not create multiple accounts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Account Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or for any other reason at our sole discretion. You may terminate your account subject to the cancellation terms in our Refund Policy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Payment and Billing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">5. Payment Terms and Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Membership Fees</h3>
              <p className="mb-3">
                All memberships are billed annually:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Foundation (Free): $0/year with $30 fulfillment per order</li>
                <li>Gold – 6 Month: $59/year with $10 fulfillment per shipment</li>
                <li>Gold – 12 Month: $99/year with $10 fulfillment per shipment</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Annual Billing</h3>
              <p className="text-muted-foreground mb-2">
                By subscribing, you authorize Pillar Drug Club to charge your payment method:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Annually on your subscription start date</li>
                <li>Automatically until you cancel (annual memberships are non-refundable)</li>
                <li>For any applicable prescription medication costs</li>
                <li>For any other fees associated with our services</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Prescription Medication Costs</h3>
              <p className="text-muted-foreground mb-2">
                In addition to membership fees, you pay wholesale prices for prescription medications:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Medication prices are separate from membership fees</li>
                <li>Prices are displayed before you confirm your order</li>
                <li>We partner with HealthWarehouse to fulfill prescriptions at wholesale pricing</li>
                <li>Payment for medications is required before shipping</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Payment Methods</h3>
              <p className="text-muted-foreground">
                We accept major credit cards and debit cards processed through Stripe. You must maintain a valid payment method on file at all times during your membership.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Failed Payments</h3>
              <p className="text-muted-foreground mb-2">
                If your payment fails:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>We will attempt to charge your payment method multiple times</li>
                <li>You will receive email notifications about failed payments</li>
                <li>Your account may be suspended until payment is resolved</li>
                <li>We may charge late fees as permitted by law</li>
                <li>Continued non-payment may result in account termination and collection efforts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Price Changes</h3>
              <p className="text-muted-foreground">
                We reserve the right to change membership fees or medication prices at any time. We will provide at least 30 days' notice before any price increase takes effect. Continued use of our services after a price change constitutes acceptance of the new pricing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Prescription Services */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">6. Prescription Services and Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Valid Prescriptions Required</h3>
              <p className="text-muted-foreground mb-2">
                All prescription medications require a valid prescription from a licensed healthcare provider:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>We do NOT provide medical consultations or prescriptions</li>
                <li>You must have an established relationship with a licensed physician, nurse practitioner, or physician assistant</li>
                <li>Your prescriber must authorize year-supply (6-month or 12-month) prescriptions</li>
                <li>Prescriptions must comply with federal and state laws</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Prescription Verification</h3>
              <p className="text-muted-foreground mb-2">
                Before dispensing medications, we will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Verify prescription authenticity with your healthcare provider</li>
                <li>Confirm your identity and prescription details</li>
                <li>Check for drug interactions and contraindications</li>
                <li>Verify DEA registration for controlled substances</li>
                <li>Report controlled substances to state Prescription Drug Monitoring Programs (PDMPs)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Controlled Substances</h3>
              <p className="text-muted-foreground mb-2">
                For Schedule II-V controlled substances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Prescriptions must comply with the Ryan Haight Online Pharmacy Consumer Protection Act</li>
                <li>As of December 31, 2025, DEA telemedicine flexibilities may expire; additional requirements may apply</li>
                <li>We reserve the right to refuse controlled substance prescriptions that cannot be properly verified</li>
                <li>State-specific restrictions may apply</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Pharmacist Professional Judgment</h3>
              <p className="text-muted-foreground mb-2">
                Our licensed pharmacists have the right and obligation to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Refuse to fill any prescription that raises safety concerns</li>
                <li>Contact your prescriber to clarify or verify prescriptions</li>
                <li>Counsel you on proper medication use</li>
                <li>Report suspected fraud or diversion to authorities</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Fulfillment Timeline</h3>
              <p className="text-muted-foreground">
                Allow 5-10 business days for prescription fulfillment after verification. Shipping times vary by location. We are not responsible for delays caused by prescription verification, out-of-stock medications, or shipping carrier delays.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Refund and Cancellation Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">7. Refund and Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Our complete Refund and Cancellation Policy is available at <Link href="/refund-policy" className="text-primary hover:underline">pillardrugclub.com/refund-policy</Link>. Key points include:
            </p>

            <div>
              <h3 className="font-semibold text-base mb-2">7-Day Grace Period</h3>
              <p className="text-muted-foreground">
                You may cancel for a full refund within 7 days of enrollment if you have not received your first prescription.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">After First Prescription</h3>
              <p className="text-muted-foreground mb-2">
                Due to pharmacy regulations, memberships are non-refundable once you receive your first prescription. Under federal and state pharmacy law, prescription medications cannot be returned or refunded once dispensed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Refund Policy</h3>
              <p className="text-muted-foreground mb-2">
                Annual memberships are non-refundable once activated:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Gold – 6 Month ($59/year): No refunds after activation</li>
                <li>Gold – 12 Month ($99/year): No refunds after activation</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">How to Cancel</h3>
              <p className="text-muted-foreground">
                To cancel your membership, contact our customer service at <a href="mailto:support@pillardrugclub.com" className="text-primary hover:underline">support@pillardrugclub.com</a> or call 1-800-PILLAR1.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: Privacy and Data Protection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">8. Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your privacy is important to us. Our use and protection of your personal health information is governed by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The Health Insurance Portability and Accountability Act (HIPAA)</li>
              <li>Our HIPAA Notice of Privacy Practices (available at <Link href="/privacy-policy" className="text-primary hover:underline">pillardrugclub.com/privacy-policy</Link>)</li>
              <li>Applicable state privacy laws</li>
            </ul>
            <p>
              By using our services, you consent to our collection, use, and disclosure of your information as described in our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Section 9: Intellectual Property */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">9. Intellectual Property Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              All content on Pillar Drug Club's website, mobile application, and services, including but not limited to text, graphics, logos, images, software, and trademarks, is the property of Pillar Drug Club or its licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="font-semibold">
              You may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Copy, reproduce, distribute, or create derivative works from our content</li>
              <li>Use our trademarks or branding without written permission</li>
              <li>Reverse engineer or decompile our software</li>
              <li>Use automated systems to access our services (scraping, bots, etc.)</li>
              <li>Frame or mirror our website on other servers</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 10: Prohibited Uses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">10. Prohibited Uses and Conduct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Provide false or misleading information</li>
              <li>Impersonate any person or entity</li>
              <li>Use our services for any illegal purpose</li>
              <li>Attempt to obtain prescriptions fraudulently</li>
              <li>Resell, distribute, or divert prescription medications</li>
              <li>Violate any federal or state pharmacy laws</li>
              <li>Interfere with or disrupt our services or servers</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Harass, abuse, or threaten our staff or other members</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use our services in a manner that could damage or overburden our infrastructure</li>
            </ul>
            <p className="mt-4">
              Violation of these prohibitions may result in immediate account termination and referral to law enforcement authorities.
            </p>
          </CardContent>
        </Card>

        {/* Section 11: Disclaimers */}
        <Card className="mb-6 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-2xl">11. Disclaimers and Limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
              <p className="font-semibold mb-3">IMPORTANT DISCLAIMERS</p>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">NOT MEDICAL ADVICE</p>
                  <p className="text-muted-foreground">
                    Pillar Drug Club does not provide medical advice, diagnosis, or treatment. Information on our platform is for informational purposes only and does not replace consultation with a licensed healthcare provider.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">NO WARRANTIES</p>
                  <p className="text-muted-foreground">
                    OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">NO GUARANTEE OF RESULTS</p>
                  <p className="text-muted-foreground">
                    We do not guarantee any specific health outcomes or medication effectiveness. Results vary by individual and medical condition.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">AVAILABILITY</p>
                  <p className="text-muted-foreground">
                    We do not guarantee uninterrupted or error-free service. Medication availability may vary. We reserve the right to modify or discontinue services at any time.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">THIRD-PARTY SERVICES</p>
                  <p className="text-muted-foreground">
                    We partner with third-party providers (HealthWarehouse, Stripe, etc.). We are not responsible for their actions, omissions, or service failures.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 12: Limitation of Liability */}
        <Card className="mb-6 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-2xl">12. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <p className="font-semibold mb-3">LIMITATION OF LIABILITY</p>
              
              <p className="text-sm mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PILLAR DRUG CLUB, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR:
              </p>

              <ul className="list-disc list-inside space-y-2 ml-4 text-sm text-muted-foreground">
                <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                <li>LOSS OF PROFITS, REVENUE, DATA, OR USE</li>
                <li>MEDICAL COMPLICATIONS OR ADVERSE DRUG REACTIONS</li>
                <li>DELAYS IN PRESCRIPTION FULFILLMENT</li>
                <li>ACTS OR OMISSIONS OF THIRD-PARTY SERVICE PROVIDERS</li>
                <li>ERRORS, MISTAKES, OR INACCURACIES IN CONTENT</li>
                <li>UNAUTHORIZED ACCESS TO YOUR ACCOUNT OR DATA</li>
                <li>INTERRUPTION OR CESSATION OF SERVICES</li>
              </ul>

              <p className="text-sm mt-4">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION EXCEED THE AMOUNT YOU PAID TO PILLAR DRUG CLUB IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>

              <p className="text-sm mt-4">
                SOME JURISDICTIONS DO NOT ALLOW LIMITATION OF IMPLIED WARRANTIES OR LIMITATION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY SHALL BE LIMITED TO THE GREATEST EXTENT PERMITTED BY LAW.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 13: Indemnification */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">13. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              You agree to indemnify, defend, and hold harmless Pillar Drug Club, its officers, directors, employees, agents, licensors, and suppliers from and against all claims, losses, expenses, damages, and costs, including reasonable attorneys' fees, arising out of or relating to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Your violation of these Terms</li>
              <li>Your use or misuse of our services</li>
              <li>Your violation of any law or regulation</li>
              <li>Your violation of any third-party rights</li>
              <li>Any false or misleading information you provide</li>
              <li>Your fraudulent activities or prescription drug diversion</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 14: Dispute Resolution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">14. Dispute Resolution and Arbitration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-2">Informal Resolution</h3>
              <p className="text-muted-foreground">
                Before filing any formal dispute, you agree to contact us at <a href="mailto:support@pillardrugclub.com" className="text-primary hover:underline">support@pillardrugclub.com</a> to attempt to resolve the matter informally.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Binding Arbitration</h3>
              <p className="text-muted-foreground mb-2">
                If informal resolution fails, any dispute arising from these Terms or our services shall be resolved through binding arbitration in accordance with the American Arbitration Association's Commercial Arbitration Rules.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground text-sm">
                <li>Arbitration shall be conducted in [State/Location]</li>
                <li>The arbitrator's decision is final and binding</li>
                <li>Each party bears its own arbitration costs</li>
                <li>Class action lawsuits are prohibited</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Exceptions</h3>
              <p className="text-muted-foreground">
                Either party may seek injunctive relief in court for intellectual property disputes or other matters requiring immediate relief.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 15: Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">15. Governing Law and Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [State], without regard to its conflict of law principles.
            </p>
            <p>
              Subject to the arbitration agreement above, you agree to submit to the exclusive jurisdiction of the state and federal courts located in [County, State] for resolution of any disputes.
            </p>
          </CardContent>
        </Card>

        {/* Section 16: Miscellaneous */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">16. Miscellaneous Provisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-2">Entire Agreement</h3>
              <p className="text-muted-foreground">
                These Terms, together with our Privacy Policy and Refund Policy, constitute the entire agreement between you and Pillar Drug Club.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Severability</h3>
              <p className="text-muted-foreground">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Waiver</h3>
              <p className="text-muted-foreground">
                Our failure to enforce any right or provision of these Terms does not constitute a waiver of such right or provision.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Assignment</h3>
              <p className="text-muted-foreground">
                You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms without restriction.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">No Agency</h3>
              <p className="text-muted-foreground">
                No agency, partnership, joint venture, or employment relationship is created as a result of these Terms.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Force Majeure</h3>
              <p className="text-muted-foreground">
                We are not liable for any delay or failure to perform resulting from causes outside our reasonable control, including acts of God, natural disasters, war, terrorism, riots, embargoes, government actions, or failure of third-party providers.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Modifications to Terms</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by email or by posting a notice on our website. Continued use of our services after changes constitutes acceptance of the modified Terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 17: Contact Information */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl">17. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold">
              For questions about these Terms of Service, please contact us:
            </p>
            
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <p><strong>Pillar Drug Club</strong></p>
              <p>Email: <a href="mailto:support@pillardrugclub.com" className="text-primary hover:underline">support@pillardrugclub.com</a></p>
              <p>Legal Email: <a href="mailto:legal@pillardrugclub.com" className="text-primary hover:underline">legal@pillardrugclub.com</a></p>
              <p>Phone: <a href="tel:1-800-PILLAR1" className="text-primary hover:underline">1-800-PILLAR1 (1-800-745-5271)</a></p>
              <p>Address: Pillar Drug Club Legal Department, [Address to be provided]</p>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground italic">
              BY CREATING AN ACCOUNT OR USING PILLAR DRUG CLUB'S SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Effective Date:</strong> October 23, 2025<br />
              <strong>Version:</strong> 1.0
            </p>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
