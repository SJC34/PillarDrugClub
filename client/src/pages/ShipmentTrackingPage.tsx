import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Package, Truck, CheckCircle2, AlertCircle, Clock, ArrowLeft } from "lucide-react";

type Shipment = {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  shippedDate: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  trackingEvents: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
  createdAt: string;
};

const statusIcons: Record<string, any> = {
  preparing: Package,
  shipped: Truck,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  exception: AlertCircle,
  returned: AlertCircle,
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  preparing: "secondary",
  shipped: "default",
  in_transit: "default",
  out_for_delivery: "default",
  delivered: "default",
  exception: "destructive",
  returned: "destructive",
};

const statusLabels: Record<string, string> = {
  preparing: "Preparing",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  exception: "Exception",
  returned: "Returned",
};

export default function ShipmentTrackingPage() {
  const [, params] = useRoute("/tracking/:trackingNumber");
  const trackingNumber = params?.trackingNumber;

  const { data: shipment, isLoading, error } = useQuery<Shipment>({
    queryKey: [`/api/shipments/tracking/${trackingNumber}`],
    enabled: !!trackingNumber,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Tracking information not found</p>
            <p className="text-sm text-muted-foreground">
              We couldn't find tracking information for tracking number: {trackingNumber}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusIcons[shipment.status] || Clock;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href={`/orders/${shipment.orderId}`}>
          <Button variant="ghost" size="sm" data-testid="button-back-to-order">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Tracking Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Shipment Tracking</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tracking Number: {shipment.trackingNumber}
                </p>
              </div>
              <Badge 
                variant={statusColors[shipment.status] || "default"}
                className="text-sm"
                data-testid="badge-shipment-status"
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusLabels[shipment.status] || shipment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Carrier</p>
                <p className="font-medium" data-testid="text-carrier">{shipment.carrier}</p>
              </div>
              {shipment.shippedDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Shipped Date</p>
                  <p className="font-medium" data-testid="text-shipped-date">
                    {new Date(shipment.shippedDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {shipment.estimatedDeliveryDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {shipment.actualDeliveryDate ? 'Delivered' : 'Estimated Delivery'}
                  </p>
                  <p className="font-medium" data-testid="text-delivery-date">
                    {new Date(
                      shipment.actualDeliveryDate || shipment.estimatedDeliveryDate
                    ).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tracking Events */}
        {shipment.trackingEvents && shipment.trackingEvents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tracking History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipment.trackingEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                    data-testid={`tracking-event-${index}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      {index < shipment.trackingEvents.length - 1 && (
                        <div className="h-full w-px bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <p className="font-medium">{event.status}</p>
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No tracking events available yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
