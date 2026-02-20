import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Gift, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Search,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useState } from "react";

interface ReferralCode {
  code: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  totalUses: number;
  successfulReferrals: number;
}

interface ReferralCredit {
  id: string;
  userId: string;
  userName: string;
  referralCode: string;
  referredByName: string;
  createdAt: string;
  redeemedAt: string | null;
  status: 'pending' | 'redeemed';
}

interface FraudAlert {
  type: 'multiple_codes_same_user' | 'high_velocity' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high';
  userId: string;
  userName: string;
  details: string;
  affectedCodes: string[];
}

interface ReferralAnalytics {
  totalCodes: number;
  totalReferrals: number;
  pendingCredits: number;
  redeemedCredits: number;
  totalSavings: number;
  averageReferralsPerCode: number;
  topReferrers: Array<{
    code: string;
    ownerName: string;
    uses: number;
  }>;
  recentActivity: Array<{
    action: string;
    userName: string;
    code: string;
    timestamp: string;
  }>;
}

interface AdminReferralData {
  codes: ReferralCode[];
  credits: ReferralCredit[];
  fraudAlerts: FraudAlert[];
  analytics: ReferralAnalytics;
}

export default function AdminReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'redeemed'>('all');

  const { data, isLoading } = useQuery<AdminReferralData>({
    queryKey: ["/api/admin/referrals"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  const analytics = data?.analytics;
  const codes = data?.codes || [];
  const credits = data?.credits || [];
  const fraudAlerts = data?.fraudAlerts || [];

  // Filter credits
  const filteredCredits = credits.filter(credit => {
    const matchesSearch = 
      credit.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credit.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credit.referredByName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'pending' && credit.status === 'pending') ||
      (filterStatus === 'redeemed' && credit.status === 'redeemed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Referral Program Monitoring</h1>
          <p className="text-muted-foreground">Track referral codes, credits, and detect fraud patterns</p>
        </div>

        {/* Fraud Alerts */}
        {fraudAlerts.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Fraud Alerts ({fraudAlerts.length})
              </CardTitle>
              <CardDescription>Suspicious activity detected requiring review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fraudAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}
                    data-testid={`fraud-alert-${idx}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{alert.userName}</p>
                        <p className="text-sm text-muted-foreground mt-1">{alert.details}</p>
                        <div className="flex gap-2 mt-2">
                          {alert.affectedCodes.map(code => (
                            <Badge key={code} variant="outline">{code}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className={
                        alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {alert.severity} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Codes</p>
                  <p className="text-2xl font-bold" data-testid="metric-total-codes">
                    {analytics?.totalCodes || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg {analytics?.averageReferralsPerCode.toFixed(1) || 0} uses/code
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Gift className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold" data-testid="metric-total-referrals">
                    {analytics?.totalReferrals || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.pendingCredits || 0} pending
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Redeemed Credits</p>
                  <p className="text-2xl font-bold" data-testid="metric-redeemed-credits">
                    {analytics?.redeemedCredits || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((analytics?.redeemedCredits || 0) / Math.max(1, analytics?.totalReferrals || 1) * 100).toFixed(0)}% conversion
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
                  <p className="text-2xl font-bold" data-testid="metric-total-savings">
                    ${analytics?.totalSavings || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Given to members</p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Referrers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Referrers
              </CardTitle>
              <CardDescription>Users with the most successful referrals</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topReferrers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referrals yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.topReferrers.map((referrer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`top-referrer-${idx}`}>
                      <div>
                        <p className="font-semibold text-foreground">{referrer.ownerName}</p>
                        <p className="text-xs text-muted-foreground">Code: {referrer.code}</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {referrer.uses} referrals
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest referral actions</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg" data-testid={`activity-${idx}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.userName} • Code: {activity.code}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Referral Codes */}
        <Card>
          <CardHeader>
            <CardTitle>All Referral Codes</CardTitle>
            <CardDescription>Complete list of referral codes and their usage stats</CardDescription>
          </CardHeader>
          <CardContent>
            {codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referral codes generated yet</p>
            ) : (
              <div className="space-y-2">
                {codes.map((code) => (
                  <div key={code.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover-elevate" data-testid={`code-${code.code}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-primary">{code.code}</span>
                        <Badge variant="outline">{code.totalUses} uses</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {code.ownerName} ({code.ownerEmail})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {code.successfulReferrals} successful
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(code.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Credits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Credits</CardTitle>
            <CardDescription>Track all referral credits and their redemption status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-credits"
                />
              </div>
              <div className="flex gap-2">
                <Badge 
                  className={`cursor-pointer ${filterStatus === 'all' ? 'bg-primary' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setFilterStatus('all')}
                  data-testid="filter-all"
                >
                  All ({credits.length})
                </Badge>
                <Badge 
                  className={`cursor-pointer ${filterStatus === 'pending' ? 'bg-primary' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setFilterStatus('pending')}
                  data-testid="filter-pending"
                >
                  Pending ({credits.filter(c => c.status === 'pending').length})
                </Badge>
                <Badge 
                  className={`cursor-pointer ${filterStatus === 'redeemed' ? 'bg-primary' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setFilterStatus('redeemed')}
                  data-testid="filter-redeemed"
                >
                  Redeemed ({credits.filter(c => c.status === 'redeemed').length})
                </Badge>
              </div>
            </div>

            {/* Credits List */}
            {filteredCredits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No credits match your filters</p>
            ) : (
              <div className="space-y-2">
                {filteredCredits.map((credit) => (
                  <div key={credit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`credit-${credit.id}`}>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{credit.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        Referred by {credit.referredByName} • Code: {credit.referralCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(credit.createdAt).toLocaleDateString()}
                        </p>
                        {credit.redeemedAt && (
                          <p className="text-xs text-green-600">
                            Redeemed {new Date(credit.redeemedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className={
                        credit.status === 'redeemed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {credit.status === 'redeemed' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Redeemed</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
