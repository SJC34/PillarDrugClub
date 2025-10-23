import { Link } from "wouter";
import { Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  const handleDownloadPDF = () => {
    window.open('/api/privacy-policy/pdf', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12" />
            <h1 className="text-4xl font-bold font-display">Notice of Privacy Practices</h1>
          </div>
          <p className="text-center text-primary-foreground/90 max-w-3xl mx-auto">
            HIPAA-Compliant Privacy Policy for Pillar Drug Club
          </p>
          <p className="text-center text-sm text-primary-foreground/80 mt-4">
            Effective Date: October 23, 2025 | Last Updated: October 23, 2025
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8 flex justify-end">
          <Button onClick={handleDownloadPDF} variant="outline" data-testid="button-download-privacy-pdf">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Header Notice */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-lg font-semibold text-foreground mb-4">
              THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.
            </p>
            <p className="text-muted-foreground">
              Pillar Drug Club is committed to protecting your health information. This Notice of Privacy Practices describes our legal duties and privacy practices with respect to your protected health information (PHI) under the Health Insurance Portability and Accountability Act (HIPAA).
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Who We Are */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">1. Who We Are & Our Commitment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Pillar Drug Club is a HIPAA-covered entity operating as an online wholesale prescription pharmacy platform. We are required by federal and state law to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain the privacy and security of your protected health information (PHI)</li>
              <li>Provide you with this Notice of our legal duties and privacy practices</li>
              <li>Follow the terms of the Notice currently in effect</li>
              <li>Notify you if we are unable to agree to a requested restriction on how we use or disclose your PHI</li>
              <li>Accommodate reasonable requests to communicate health information by alternative means or at alternative locations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 2: What is Protected Health Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">2. What is Protected Health Information (PHI)?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Protected Health Information (PHI) is information about you, including demographic information, that may identify you and relates to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your past, present, or future physical or mental health condition</li>
              <li>The provision of healthcare services to you</li>
              <li>Past, present, or future payment for healthcare services</li>
              <li>Prescription information and medication history</li>
              <li>Insurance information and billing records</li>
              <li>Communication with your healthcare providers</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 3: How We Use and Disclose PHI */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">3. How We May Use and Disclose Your Health Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">A. Uses and Disclosures for Treatment, Payment, and Healthcare Operations</h3>
              <p className="mb-4">
                We may use and disclose your PHI without your written authorization for the following purposes:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-base mb-2">Treatment</h4>
                  <p className="text-muted-foreground mb-2">
                    We may use and disclose your PHI to coordinate your pharmacy services, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                    <li>Communicating with your prescribing physicians and other healthcare providers</li>
                    <li>Providing medication counseling and drug interaction warnings</li>
                    <li>Coordinating prescription refills and medication therapy management</li>
                    <li>Conducting medication adherence monitoring</li>
                    <li>Sharing information about potential drug allergies or adverse reactions</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">Payment</h4>
                  <p className="text-muted-foreground mb-2">
                    We may use and disclose your PHI to obtain payment for services, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                    <li>Processing membership subscription payments through Stripe</li>
                    <li>Billing for prescription medications dispensed</li>
                    <li>Verifying insurance coverage and benefits</li>
                    <li>Submitting claims to insurance companies or benefit plans</li>
                    <li>Collecting payment and conducting collection activities</li>
                    <li>Coordinating with third-party payment processors</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">Healthcare Operations</h4>
                  <p className="text-muted-foreground mb-2">
                    We may use and disclose your PHI for our business operations, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                    <li>Quality assessment and improvement activities</li>
                    <li>Training pharmacy staff and healthcare professionals</li>
                    <li>Conducting internal audits and compliance reviews</li>
                    <li>Business planning and development</li>
                    <li>Customer service and support activities</li>
                    <li>Managing referral programs and membership benefits</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">B. Other Permitted Uses and Disclosures</h3>
              <p className="mb-4">
                We may also use or disclose your PHI without your authorization for the following purposes:
              </p>
              
              <ul className="list-disc list-inside space-y-3 ml-4 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Appointment Reminders:</strong> To contact you with prescription refill reminders via email, SMS, or phone
                </li>
                <li>
                  <strong className="text-foreground">Health-Related Benefits and Services:</strong> To inform you about treatment alternatives, drug recalls, or health-related benefits and services that may be of interest
                </li>
                <li>
                  <strong className="text-foreground">As Required by Law:</strong> When federal, state, or local law requires disclosure
                </li>
                <li>
                  <strong className="text-foreground">Public Health Activities:</strong> To public health authorities for disease prevention and control
                </li>
                <li>
                  <strong className="text-foreground">Health Oversight Activities:</strong> To health oversight agencies for audits, investigations, and inspections
                </li>
                <li>
                  <strong className="text-foreground">Judicial and Administrative Proceedings:</strong> In response to court orders, subpoenas, or discovery requests
                </li>
                <li>
                  <strong className="text-foreground">Law Enforcement:</strong> To law enforcement officials as required or permitted by law
                </li>
                <li>
                  <strong className="text-foreground">Coroners, Medical Examiners, and Funeral Directors:</strong> For identification purposes and to determine cause of death
                </li>
                <li>
                  <strong className="text-foreground">Serious Threats:</strong> To avert a serious threat to health or safety
                </li>
                <li>
                  <strong className="text-foreground">Prescription Drug Monitoring Program (PDMP):</strong> Reporting to state PDMP databases as required by law
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">C. Uses and Disclosures Requiring Your Written Authorization</h3>
              <p className="mb-4">
                We will obtain your written authorization before using or disclosing your PHI for purposes other than treatment, payment, healthcare operations, or as otherwise permitted by law. This includes:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                <li>Marketing communications (except appointment reminders and health-related information)</li>
                <li>Sale of PHI (we do not sell your health information)</li>
                <li>Psychotherapy notes (if applicable)</li>
                <li>Uses and disclosures not described in this Notice</li>
              </ul>
              
              <p className="mt-4 text-muted-foreground">
                You may revoke your authorization at any time by submitting a written request to our Privacy Officer. The revocation will not affect any disclosures already made in reliance on your authorization.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">4. Your Rights Regarding Your Health Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              You have the following rights regarding your protected health information:
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base mb-2">Right to Access and Obtain Copies</h4>
                <p className="text-muted-foreground mb-2">
                  You have the right to inspect and obtain copies of your PHI maintained by Pillar Drug Club. To request access:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Submit a written request to our Privacy Officer</li>
                  <li>We will respond within 30 days (or notify you of a 30-day extension)</li>
                  <li>We may charge a reasonable fee for copying and mailing costs</li>
                  <li>We may deny access in limited circumstances as permitted by law</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Right to Request Amendments</h4>
                <p className="text-muted-foreground mb-2">
                  You may request that we amend your PHI if you believe it is incorrect or incomplete:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Submit a written request with the reason for the amendment</li>
                  <li>We may deny your request if the information was not created by us, is not part of our records, or is accurate and complete</li>
                  <li>You may submit a statement of disagreement if your request is denied</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Right to Request Restrictions</h4>
                <p className="text-muted-foreground mb-2">
                  You may request restrictions on how we use or disclose your PHI:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>We are not required to agree to your request</li>
                  <li>If we do agree, we will comply with your request unless the information is needed for emergency treatment</li>
                  <li><strong className="text-foreground">Special Right:</strong> If you pay for a prescription out-of-pocket in full, you can request that we not share information about that prescription with your health plan, and we must agree</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Right to Request Confidential Communications</h4>
                <p className="text-muted-foreground mb-2">
                  You may request that we communicate with you by alternative means or at alternative locations:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Request must be in writing and specify how or where you wish to be contacted</li>
                  <li>We will accommodate all reasonable requests</li>
                  <li>You do not need to provide a reason for your request</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Right to an Accounting of Disclosures</h4>
                <p className="text-muted-foreground mb-2">
                  You may request a list of certain disclosures of your PHI made by us:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>The accounting covers the six years prior to your request (or shorter period if specified)</li>
                  <li>Does not include disclosures for treatment, payment, healthcare operations, or made to you</li>
                  <li>The first accounting in a 12-month period is free; we may charge a reasonable fee for additional requests</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Right to a Paper Copy of This Notice</h4>
                <p className="text-muted-foreground">
                  You have the right to obtain a paper copy of this Notice at any time, even if you previously agreed to receive it electronically. Contact our Privacy Officer to request a copy.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Right to File a Complaint</h4>
                <p className="text-muted-foreground mb-2">
                  If you believe your privacy rights have been violated, you may file a complaint:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>With Pillar Drug Club's Privacy Officer (contact information below)</li>
                  <li>With the U.S. Department of Health and Human Services Office for Civil Rights</li>
                  <li>You will not be penalized or retaliated against for filing a complaint</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Our Responsibilities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">5. Our Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Pillar Drug Club is required by law to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain the privacy and security of your protected health information</li>
              <li>Notify you following a breach of unsecured PHI</li>
              <li>Follow the duties and privacy practices described in this Notice</li>
              <li>Not use or disclose your PHI other than as described in this Notice without your written authorization</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 6: Security Measures */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">6. How We Protect Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We implement comprehensive security measures to protect your PHI, including:
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-base mb-2">Technical Safeguards</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication with multi-factor authentication support</li>
                  <li>Automated session timeouts</li>
                  <li>Audit controls tracking access to PHI</li>
                  <li>Regular security testing and vulnerability assessments</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Physical Safeguards</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Secure facilities with access controls</li>
                  <li>Workstation security policies</li>
                  <li>Secure disposal of PHI (shredding, data destruction)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base mb-2">Administrative Safeguards</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                  <li>Designated Privacy and Security Officers</li>
                  <li>Regular workforce training on HIPAA compliance</li>
                  <li>Business Associate Agreements with all vendors handling PHI</li>
                  <li>Incident response and breach notification procedures</li>
                  <li>Regular risk assessments and audits</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Breach Notification */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">7. Breach Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              In the event of a breach of your unsecured protected health information, we will notify you as required by law. Notification will include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Description of what happened and when</li>
              <li>Types of information involved</li>
              <li>Steps you should take to protect yourself</li>
              <li>What we are doing in response to the breach</li>
              <li>Contact information for questions</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 8: Changes to Notice */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">8. Changes to This Notice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We reserve the right to change this Notice and make the new provisions effective for all PHI we maintain. If we make material changes to our privacy practices, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Post the revised Notice on our website</li>
              <li>Make the revised Notice available upon request</li>
              <li>Include the effective date on the revised Notice</li>
            </ul>
            <p className="mt-4">
              You may obtain a copy of the current Notice at any time from our website at <Link href="/privacy-policy" className="text-primary hover:underline">pillardrugclub.com/privacy-policy</Link> or by contacting our Privacy Officer.
            </p>
          </CardContent>
        </Card>

        {/* Section 9: Contact Information */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl">9. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold">
              For questions about this Notice or to exercise your rights, contact our Privacy Officer:
            </p>
            
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <p><strong>Privacy Officer</strong></p>
              <p>Pillar Drug Club</p>
              <p>Email: <a href="mailto:privacy@pillardrugclub.com" className="text-primary hover:underline">privacy@pillardrugclub.com</a></p>
              <p>Phone: <a href="tel:1-800-PILLAR1" className="text-primary hover:underline">1-800-PILLAR1 (1-800-745-5271)</a></p>
              <p>Address: Pillar Drug Club Privacy Office, [Address to be provided]</p>
            </div>

            <div className="mt-6">
              <p className="font-semibold mb-2">
                To file a complaint with the U.S. Department of Health and Human Services:
              </p>
              <div className="bg-muted p-6 rounded-lg space-y-2">
                <p>Office for Civil Rights</p>
                <p>U.S. Department of Health and Human Services</p>
                <p>200 Independence Avenue, S.W.</p>
                <p>Washington, D.C. 20201</p>
                <p>Phone: 1-877-696-6775</p>
                <p>Website: <a href="https://www.hhs.gov/ocr/privacy/hipaa/complaints/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.hhs.gov/ocr/privacy/hipaa/complaints</a></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Acknowledgment */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground italic">
              This Notice of Privacy Practices complies with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule (45 CFR Part 160 and Part 164, Subparts A and E) and applicable state privacy laws. We are committed to protecting your privacy and maintaining the confidentiality of your health information.
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
