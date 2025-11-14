import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Gift,
  Copy,
  CheckCircle,
  QrCode,
  Mail,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";

export default function ReferralsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "referral-code"],
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["/api/users", user?.id, "referral-stats"],
    enabled: !!user?.id,
  });

  const { data: history, isLoading: historyLoading, isError: historyError } = useQuery({
    queryKey: ["/api/users", user?.id, "referral-history"],
    enabled: !!user?.id,
  });

  const { data: credits, isLoading: creditsLoading, isError: creditsError } = useQuery({
    queryKey: ["/api/users", user?.id, "referral-credits"],
    enabled: !!user?.id,
  });

  if (codeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading referral dashboard...</div>
        </div>
      </div>
    );
  }

  const referralLink = referralCode?.code 
    ? `${window.location.origin}/register?ref=${referralCode.code}`
    : "";

  const handleCopyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCopiedCode(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-muted-foreground">
          Share Pillar Drug Club with friends and family. Both of you get <strong>1 month free</strong> when they sign up!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card data-testid="card-total-referrals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : statsError ? (
              <div className="text-sm text-destructive">Error loading stats</div>
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-referrals">
                  {stats?.totalReferrals || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully referred members
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-credits-earned">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : statsError ? (
              <div className="text-sm text-destructive">Error loading stats</div>
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-credits-earned">
                  {stats?.creditsEarned || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Free months earned
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-credits-redeemed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Redeemed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : statsError ? (
              <div className="text-sm text-destructive">Error loading stats</div>
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-credits-redeemed">
                  {stats?.creditsRedeemed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Free months used
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & QR Code */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card data-testid="card-referral-code">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>
              Share this code or link with friends and family
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code Display */}
            <div>
              <label className="text-sm font-medium mb-2 block">Referral Code</label>
              <div className="flex gap-2">
                <Input
                  value={referralCode?.code || ""}
                  readOnly
                  className="font-mono text-lg"
                  data-testid="input-referral-code"
                />
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  size="icon"
                  data-testid="button-copy-code"
                >
                  {copiedCode ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium mb-2 block">Shareable Link</label>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-sm"
                  data-testid="input-referral-link"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  data-testid="button-copy-link"
                >
                  {copiedLink ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `mailto:?subject=Join%20Pillar%20Drug%20Club&body=I%20wanted%20to%20share%20Pillar%20Drug%20Club%20with%20you!%20Get%20affordable%20medications%20at%20wholesale%20prices.%20Use%20my%20referral%20code:%20${referralCode?.code}%0A%0A${referralLink}`,
                    "_blank"
                  );
                }}
                data-testid="button-share-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Share via Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-qr-code">
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>
              Scan to share with others in person
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {referralLink && (
              <div className="bg-white p-4 rounded-lg" data-testid="qr-code-container">
                <QRCodeSVG
                  value={referralLink}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Show this QR code to friends to make signup easy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      <Card data-testid="card-referral-history">
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            People you've referred to Pillar Drug Club
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-sm">Loading referral history...</div>
            </div>
          ) : historyError ? (
            <div className="text-center py-8 text-destructive">
              <div className="text-sm">Error loading referral history</div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm mt-2">
                Share your referral code to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  data-testid={`referral-item-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium" data-testid={`text-referee-name-${index}`}>
                        {item.refereeName}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-referee-email-${index}`}>
                        {item.refereeEmail}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <Badge
                      variant={
                        item.status === "credited" ? "default" :
                        item.status === "completed" ? "secondary" :
                        "outline"
                      }
                      data-testid={`badge-status-${index}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits */}
      {creditsLoading ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-muted-foreground">
            <div className="text-sm">Loading credits...</div>
          </CardContent>
        </Card>
      ) : creditsError ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-destructive">
            <div className="text-sm">Error loading credits</div>
          </CardContent>
        </Card>
      ) : credits && credits.length > 0 && (
        <Card className="mt-8" data-testid="card-credits">
          <CardHeader>
            <CardTitle>Your Credits</CardTitle>
            <CardDescription>
              Free months earned from referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {credits.map((credit: any, index: number) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`credit-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">
                        {credit.monthsFree} Month Free
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {credit.creditType === "referrer_bonus" ? "Referral Bonus" : "Sign-up Bonus"}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      credit.status === "redeemed" ? "default" :
                      credit.status === "applied" ? "secondary" :
                      "outline"
                    }
                    data-testid={`badge-credit-status-${index}`}
                  >
                    {credit.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
