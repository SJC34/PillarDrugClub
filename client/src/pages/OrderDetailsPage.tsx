import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, CreditCard, CheckCircle2, Clock, Truck } from "lucide-react";
import { Link } from "wouter";

interface OrderItem {
  type: string;
  medicationId: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  items: OrderItem[];
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4?: string;
    brand?: string;
  };
  createdAt: string;
}

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "bg-yellow-500" },
  processing: { icon: Package, label: "Processing", color: "bg-blue-500" },
  awaiting_verification: { icon: Clock, label: "Awaiting Verification", color: "bg-orange-500" },
  ready_to_ship: { icon: Package, label: "Ready to Ship", color: "bg-purple-500" },
  shipped: { icon: Truck, label: "Shipped", color: "bg-green-500" },
  delivered: { icon: CheckCircle2, label: "Delivered", color: "bg-green-600" },
  cancelled: { icon: Package, label: "Cancelled", color: "bg-red-500" },
  returned: { icon: Package, label: "Returned", color: "bg-gray-500" },
};

type Shipment = {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  shippedDate: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
};

export default function OrderDetailsPage() {
  const [, params] = useRoute("/orders/:id");
  const orderId = params?.id;

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  const { data: shipment } = useQuery<Shipment>({
    queryKey: [`/api/shipments/order/${orderId}`],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-order-number">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={`${statusInfo.color} text-white`} data-testid="badge-status">
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start" data-testid={`order-item-${index}`}>
                  <div>
                    <p className="font-medium">Medication ID: {item.medicationId}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="text-subtotal">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span data-testid="text-shipping">${parseFloat(order.shippingCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span data-testid="text-tax">${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-total">${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1" data-testid="shipping-address">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div data-testid="payment-method">
                <p className="font-medium">{order.paymentMethod.brand || "Payment"}</p>
                {order.paymentMethod.last4 && (
                  <p className="text-sm text-muted-foreground">
                    •••• {order.paymentMethod.last4}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {shipment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                    <p className="font-medium" data-testid="text-tracking-number">
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Carrier</p>
                    <p className="font-medium" data-testid="text-carrier">
                      {shipment.carrier}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="font-medium capitalize" data-testid="text-shipment-status">
                      {shipment.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <Link href={`/tracking/${shipment.trackingNumber}`}>
                    <Button variant="outline" size="sm" data-testid="button-track-shipment">
                      <Truck className="h-4 w-4 mr-2" />
                      Track Shipment
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button asChild data-testid="button-continue-shopping">
            <Link href="/medications">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-dashboard">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
