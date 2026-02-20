import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Users
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data for message history
const mockMessages = [
  {
    id: "1",
    type: "email",
    subject: "Prescription Ready for Pickup",
    recipient: "john.doe@example.com",
    status: "delivered",
    sentAt: "2024-10-12T10:30:00Z"
  },
  {
    id: "2",
    type: "sms",
    subject: "Refill Reminder",
    recipient: "+1234567890",
    status: "delivered",
    sentAt: "2024-10-12T09:15:00Z"
  },
  {
    id: "3",
    type: "email",
    subject: "Order Shipped",
    recipient: "jane.smith@example.com",
    status: "pending",
    sentAt: "2024-10-12T08:45:00Z"
  }
];

export default function AdminCommunicationsPage() {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [recipient, setRecipient] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-8 space-y-6" data-testid="page-admin-communications">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communication Center</h1>
          <p className="text-muted-foreground">Manage email and SMS communications</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold" data-testid="metric-total-sent">
                  324
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Emails Sent</p>
                <p className="text-2xl font-bold" data-testid="metric-emails-sent">
                  198
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">SMS Sent</p>
                <p className="text-2xl font-bold" data-testid="metric-sms-sent">
                  126
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold" data-testid="metric-delivery-rate">
                  98.5%
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-teal-700 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send" data-testid="tab-send">Send Messages</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Message History</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
        </TabsList>

        {/* Send Messages Tab */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Send Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-recipient">Recipient</Label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger data-testid="select-email-recipient">
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active Subscribers</SelectItem>
                      <SelectItem value="pastdue">Past Due</SelectItem>
                      <SelectItem value="custom">Custom Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    data-testid="input-email-subject"
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Message</Label>
                  <Textarea
                    id="email-body"
                    data-testid="textarea-email-body"
                    placeholder="Enter your message..."
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Twilio/Resend integration will be configured in production
                  </p>
                </div>

                <Button className="w-full" data-testid="button-send-email">
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>

            {/* Send SMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-recipient">Recipient</Label>
                  <Select>
                    <SelectTrigger data-testid="select-sms-recipient">
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users (SMS Consent)</SelectItem>
                      <SelectItem value="active">Active Subscribers</SelectItem>
                      <SelectItem value="refills">Pending Refills</SelectItem>
                      <SelectItem value="custom">Custom Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms-message">Message</Label>
                  <Textarea
                    id="sms-message"
                    data-testid="textarea-sms-message"
                    placeholder="Enter SMS message (160 characters max)..."
                    rows={4}
                    maxLength={160}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {smsMessage.length}/160 characters
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Twilio integration will be configured in production
                  </p>
                </div>

                <Button className="w-full" data-testid="button-send-sms">
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Message History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject/Message</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMessages.map((message) => (
                    <TableRow key={message.id} data-testid={`message-${message.id}`}>
                      <TableCell>
                        {message.type === "email" ? (
                          <Mail className="h-4 w-4 text-purple-600" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{message.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {message.recipient}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(message.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(message.status)}
                            {message.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(message.sentAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Prescription Ready</h4>
                        <p className="text-sm text-muted-foreground">
                          Notify patients when their prescription is ready for pickup
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Refill Reminder</h4>
                        <p className="text-sm text-muted-foreground">
                          Remind patients about upcoming refills
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Order Shipped</h4>
                        <p className="text-sm text-muted-foreground">
                          Confirm order shipment with tracking info
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Welcome Email</h4>
                        <p className="text-sm text-muted-foreground">
                          Welcome new members to Pharmacy Autopilot
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" data-testid="button-create-template">
                  <Send className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
