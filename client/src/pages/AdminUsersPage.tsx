import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  Package,
  Ban,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  UserX,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

interface User {
  id: string;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  subscriptionStatus: string | null;
  isActive: string | null;
  createdAt: Date | null;
  lastActive?: string;
}

interface UserDetail extends User {
  phoneNumber: string | null;
  deletedAt?: string | null;
  deletionReason?: string | null;
  stats?: {
    activePrescriptionsCount: number;
    ordersCount: number;
    totalSpent: string;
  };
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    createdAt: string;
  }>;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const limit = 20;

  // Fetch users list
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/admin/users", searchQuery, roleFilter, statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch user details
  const { data: userDetail, isLoading: detailLoading } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      const response = await fetch(`/api/admin/users/${selectedUser}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      return response.json();
    },
    enabled: !!selectedUser,
  });

  // Suspend user mutation
  const suspendMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ is_active: isActive }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated successfully" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    },
  });

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User account deactivated successfully" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to deactivate user", variant: "destructive" });
    },
  });

  // Reactivate user mutation
  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/users/${userId}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User account reactivated successfully" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to reactivate user", variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/delete`, {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User account deleted successfully. Can be recovered within 30 days." });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  // Recover user mutation
  const recoverMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/users/${userId}/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User account recovered successfully" });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Failed to recover user", variant: "destructive" });
    },
  });

  const users = usersData?.users || [];
  const totalPages = usersData?.totalPages || 1;

  const getRoleBadge = (role: string | null) => {
    const roleColors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      client: "bg-blue-100 text-blue-800",
      broker: "bg-green-100 text-green-800",
      company: "bg-orange-100 text-orange-800",
    };
    return roleColors[role || "client"] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      canceled: "bg-red-100 text-red-800",
      past_due: "bg-orange-100 text-orange-800",
      incomplete: "bg-yellow-100 text-yellow-800",
    };
    return statusColors[status || ""] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label>Search Users</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger className="mt-2" data-testid="select-role-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger className="mt-2" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
              <Badge variant="secondary" className="ml-2">
                {usersData?.total || 0} total
              </Badge>
            </CardTitle>
            <CardDescription>View and manage all user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <>
                <div className="space-y-3">
                  {users.map((user: User) => (
                    <Card
                      key={user.id}
                      className="hover-elevate cursor-pointer transition-all"
                      onClick={() => setSelectedUser(user.id)}
                      data-testid={`card-user-${user.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <UserCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground">
                                  {user.firstName} {user.lastName}
                                </p>
                                <Badge className={getRoleBadge(user.role)}>
                                  {user.role || "client"}
                                </Badge>
                                {user.isActive === "false" && (
                                  <Badge className="bg-red-100 text-red-800">
                                    Suspended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge className={getStatusBadge(user.subscriptionStatus)}>
                                {user.subscriptionStatus || "none"}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCircle className="h-6 w-6" />
                User Details
              </DialogTitle>
              <DialogDescription>
                View and manage user information
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading user details...</div>
            ) : userDetail ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-semibold mt-1">{userDetail.firstName} {userDetail.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-semibold mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {userDetail.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-semibold mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {userDetail.phoneNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Role</Label>
                    <Badge className={`mt-1 ${getRoleBadge(userDetail.role)}`}>
                      {userDetail.role || "client"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Subscription</Label>
                    <Badge className={`mt-1 ${getStatusBadge(userDetail.subscriptionStatus)}`}>
                      {userDetail.subscriptionStatus || "none"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Member Since</Label>
                    <p className="font-semibold mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {userDetail.createdAt ? new Date(userDetail.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                {userDetail.stats && (
                  <div>
                    <h3 className="font-semibold mb-3">Account Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-2xl font-bold">{userDetail.stats.activePrescriptionsCount}</p>
                              <p className="text-xs text-muted-foreground">Active Prescriptions</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-2xl font-bold">{userDetail.stats.ordersCount}</p>
                              <p className="text-xs text-muted-foreground">Total Orders</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-teal-600" />
                            <div>
                              <p className="text-2xl font-bold">${parseFloat(userDetail.stats.totalSpent || "0").toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Total Spent</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Recent Orders */}
                {userDetail.recentOrders && userDetail.recentOrders.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Orders</h3>
                    <div className="space-y-2">
                      {userDetail.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                            <span className="font-semibold text-sm">${parseFloat(order.total).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Alert */}
                {userDetail.deletedAt && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900">Account Deleted</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Deleted on {new Date(userDetail.deletedAt).toLocaleDateString()}
                      </p>
                      {userDetail.deletionReason && (
                        <p className="text-sm text-red-700 mt-1">
                          Reason: {userDetail.deletionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!userDetail.deletedAt && userDetail.isActive === "false" && userDetail.deletionReason && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900">Account Deactivated</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Reason: {userDetail.deletionReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm text-muted-foreground">Account Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Deactivate/Reactivate */}
                    {userDetail.isActive === "true" && !userDetail.deletedAt ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Reason for deactivation (optional):");
                          if (reason !== null) {
                            deactivateMutation.mutate({ userId: userDetail.id, reason: reason || undefined });
                          }
                        }}
                        disabled={deactivateMutation.isPending}
                        data-testid="button-deactivate-user"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    ) : !userDetail.deletedAt ? (
                      <Button
                        variant="outline"
                        onClick={() => reactivateMutation.mutate(userDetail.id)}
                        disabled={reactivateMutation.isPending}
                        data-testid="button-reactivate-user"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                    ) : null}

                    {/* Suspend/Activate */}
                    {!userDetail.deletedAt && userDetail.isActive === "true" ? (
                      <Button
                        variant="outline"
                        onClick={() => suspendMutation.mutate({ userId: userDetail.id, isActive: false })}
                        disabled={suspendMutation.isPending}
                        data-testid="button-suspend-user"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    ) : !userDetail.deletedAt ? (
                      <Button
                        variant="default"
                        onClick={() => suspendMutation.mutate({ userId: userDetail.id, isActive: true })}
                        disabled={suspendMutation.isPending}
                        data-testid="button-activate-user"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    ) : null}

                    {/* Delete/Recover */}
                    {userDetail.deletedAt ? (
                      <Button
                        variant="default"
                        className="col-span-2"
                        onClick={() => recoverMutation.mutate(userDetail.id)}
                        disabled={recoverMutation.isPending}
                        data-testid="button-recover-user"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Recover Account
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        className="col-span-2"
                        onClick={() => {
                          const confirmed = confirm(
                            "Are you sure you want to delete this account? It can be recovered within 30 days."
                          );
                          if (confirmed) {
                            const reason = prompt("Reason for deletion (optional):");
                            if (reason !== null) {
                              deleteMutation.mutate({ userId: userDetail.id, reason: reason || undefined });
                            }
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid="button-delete-user"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
