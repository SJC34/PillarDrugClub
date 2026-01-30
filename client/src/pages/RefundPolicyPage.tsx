import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, AlertCircle, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RefundPolicyPage() {
  const handleDownloadPDF = () => {
    window.open('/api/refund-policy-pdf', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Refund & Cancellation Policy</h1>
              <p className="text-sm text-muted-foreground">Effective: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <Button onClick={handleDownloadPDF} data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Overview
            </CardTitle>
            <CardDescription>
              Pillar Drug Club is a wholesale prescription pharmacy service operating under strict federal and state pharmacy regulations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              This policy outlines our refund and cancellation terms, which are designed to comply with pharmaceutical industry requirements while maintaining transparency with our members.
            </p>
          </CardContent>
        </Card>

        {/* Annual Commitment */}
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  1. Annual Membership Commitment
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-primary border-primary">Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              All memberships are billed <strong>annually</strong> from the date of subscription activation. Annual memberships are non-refundable once activated.
            </p>
          </CardContent>
        </Card>

        {/* No Refund Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              2. No Refund Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">2.1 Medications</h4>
              <p className="text-muted-foreground leading-relaxed">
                Due to federal and state pharmacy regulations governing the dispensing of prescription medications, all medication sales are final. Once a prescription is received and processed by our partner pharmacy (HealthWarehouse), <strong>no refunds, returns, or exchanges are permitted</strong> under any circumstances.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">2.2 Membership Fees</h4>
              <p className="text-muted-foreground leading-relaxed">
                Annual membership fees are <strong>non-refundable once activated</strong>. This policy ensures compliance with pharmacy regulations and protects the integrity of our wholesale pricing model.
              </p>
            </div>

            <div className="bg-accent/30 p-4 rounded-lg border border-accent">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent-foreground" />
                2.3 Pre-Prescription Grace Period
              </h4>
              <p className="text-foreground leading-relaxed">
                Members may request a <strong>full refund of membership fees within 7 days</strong> of initial subscription if no prescriptions have been transmitted to our partner pharmacy. After this period or once any prescription is received, all fees become non-refundable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Annual Membership - No Refunds */}
        <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-5 w-5" />
              3. Annual Membership - No Refunds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-amber-900 dark:text-amber-100 leading-relaxed">
              Annual memberships are non-refundable once activated:
            </p>

            <div className="space-y-2 pl-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-900 dark:text-amber-100">•</span>
                <div>
                  <strong className="text-amber-900 dark:text-amber-100">Gold – 6 Month ($59/year):</strong>
                  <span className="text-amber-900 dark:text-amber-100"> No refunds for annual memberships once activated</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-900 dark:text-amber-100">•</span>
                <div>
                  <strong className="text-amber-900 dark:text-amber-100">Platinum ($99/year):</strong>
                  <span className="text-amber-900 dark:text-amber-100"> No refunds for annual memberships once activated</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-amber-800 dark:text-amber-200 italic">
              This fee compensates for administrative costs, pharmacy network setup, and wholesale pricing arrangements made on your behalf.
            </p>
          </CardContent>
        </Card>

        {/* Cancellation Process */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              4. Cancellation Process
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">To cancel your membership:</p>

            <ol className="space-y-2 pl-6 list-decimal text-foreground">
              <li>Log into your account at pillardrugclub.com</li>
              <li>Navigate to Account Settings → Cancel Membership</li>
              <li>Review your membership status</li>
              <li>Confirm cancellation request</li>
              <li>Receive email confirmation with final billing details</li>
            </ol>

            <p className="text-muted-foreground italic leading-relaxed">
              Cancellation is as easy as signing up - we comply with all consumer protection laws regarding subscription cancellation procedures.
            </p>
          </CardContent>
        </Card>

        {/* Regulatory Compliance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              5. Regulatory Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-3">This policy is designed to comply with:</p>
            <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
              <li>Federal pharmacy regulations governing prescription medication dispensing</li>
              <li>State pharmacy board requirements in all 50 states</li>
              <li>FTC regulations regarding subscription services (ROSCA)</li>
              <li>California Automatic Renewal Law (effective July 1, 2025)</li>
              <li>Consumer protection laws in all jurisdictions we serve</li>
            </ul>
          </CardContent>
        </Card>

        {/* Member Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Your Rights as a Member</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-3">You have the right to:</p>
            <ul className="space-y-2 pl-6 list-disc text-muted-foreground">
              <li>Receive clear disclosure of all fees and cancellation policies</li>
              <li>Cancel your membership at any time (annual memberships are non-refundable)</li>
              <li>Access this policy at any time on our website</li>
              <li>Contact customer support with questions about fees or cancellation</li>
              <li>File complaints with state pharmacy boards or consumer protection agencies if you believe this policy violates applicable regulations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6 bg-primary/5 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              7. Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-foreground">For questions about this refund policy or to request cancellation:</p>
            <div className="space-y-1 text-muted-foreground">
              <p><strong>Email:</strong> support@pillardrugclub.com</p>
              <p><strong>Website:</strong> www.pillardrugclub.com/refund-policy</p>
              <p><strong>Response Time:</strong> Within 2 business days</p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              IMPORTANT NOTICE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground text-sm leading-relaxed">
              By subscribing to Pillar Drug Club, you acknowledge that you have read, understood, and agree to this Refund & Cancellation Policy. You understand that:
            </p>
            <ul className="space-y-1 pl-6 list-disc text-foreground text-sm">
              <li>All prescription medication sales are final under pharmacy regulations</li>
              <li>Annual memberships are non-refundable once activated</li>
              <li>Membership fees are non-refundable after prescriptions are received</li>
            </ul>
          </CardContent>
        </Card>

        {/* Download CTA */}
        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleDownloadPDF} data-testid="button-download-pdf-footer">
            <Download className="h-5 w-5 mr-2" />
            Download Complete Policy as PDF
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
