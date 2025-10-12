import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Package, CreditCard, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CartItem {
  id: string;
  userId: string;
  medicationId: string;
  quantity: number;
}

interface Medication {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  price: string;
  wholesalePrice: string;
}

const shippingSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 digits"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      street: (user?.userAddress as any)?.street || "",
      city: (user?.userAddress as any)?.city || "",
      state: (user?.userAddress as any)?.state || "",
      zipCode: (user?.userAddress as any)?.zipCode || "",
    },
  });

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: [`/api/users/${user?.id}/cart`],
    enabled: !!user?.id,
  });

  const medicationIds = cartItems.map(item => item.medicationId);
  const { data: medications = [], isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ['/api/medications/batch', medicationIds],
    queryFn: async () => {
      if (medicationIds.length === 0) return [];
      const medPromises = medicationIds.map(id => 
        fetch(`/api/medications/${id}`, { credentials: 'include' }).then(res => res.json())
      );
      return Promise.all(medPromises);
    },
    enabled: medicationIds.length > 0,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (shippingAddress: ShippingFormValues) => {
      // Validate all medications before creating order
      const invalidItems = cartItems.filter(item => {
        const med = medications.find(m => m.id === item.medicationId);
        return !med || !med.wholesalePrice || parseFloat(med.wholesalePrice) <= 0;
      });

      if (invalidItems.length > 0) {
        throw new Error("Some medications are missing price information. Please refresh and try again.");
      }

      const orderItems = cartItems.map(item => {
        const med = medications.find(m => m.id === item.medicationId);
        const price = parseFloat(med!.wholesalePrice);
        return {
          type: "prescription" as const,
          medicationId: item.medicationId,
          quantity: item.quantity,
          price,
          totalPrice: price * item.quantity,
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      if (subtotal <= 0) {
        throw new Error("Order total must be greater than $0");
      }

      const shippingCost = 4.99;
      const tax = 0;
      const total = subtotal + shippingCost + tax;

      const orderData = {
        userId: user?.id,
        status: "pending" as const,
        items: orderItems,
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
        tax: tax.toString(),
        total: total.toString(),
        shippingAddress: {
          ...shippingAddress,
          country: "US",
        },
        paymentMethod: {
          type: "credit_card" as const,
          last4: "****",
          brand: "Pending",
        },
      };

      const res = await apiRequest('POST', '/api/orders', orderData);
      return res.json();
    },
    onSuccess: async (order) => {
      // Clear cart after successful order
      await apiRequest('DELETE', `/api/cart/user/${user?.id}`);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/cart`] });
      
      toast({
        title: "Order Created",
        description: `Order ${order.orderNumber} has been created successfully`,
      });
      
      setLocation(`/orders/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const getMedicationDetails = (medicationId: string) => {
    return medications.find(m => m.id === medicationId);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const med = getMedicationDetails(item.medicationId);
      if (!med) return total;
      return total + (parseFloat(med.wholesalePrice) * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = subtotal > 0 ? 4.99 : 0;
  const total = subtotal + shippingCost;

  // Check if all medications are loaded and have valid prices
  const isDataReady = !medicationsLoading && 
    cartItems.length > 0 && 
    cartItems.every(item => {
      const med = getMedicationDetails(item.medicationId);
      return med && parseFloat(med.wholesalePrice) > 0;
    });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Please log in to checkout</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add items to your cart before checking out</p>
            <Button onClick={() => setLocation('/medications')} data-testid="button-browse-medications">
              Browse Medications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: ShippingFormValues) => {
    // Validate that all medications are loaded with valid prices
    const allMedicationsValid = cartItems.every(item => {
      const med = getMedicationDetails(item.medicationId);
      return med && parseFloat(med.wholesalePrice) > 0;
    });

    if (!allMedicationsValid) {
      toast({
        title: "Error",
        description: "Unable to load medication prices. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main St" data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City" data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CA" maxLength={2} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345" data-testid="input-zipcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
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
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Payment processing will be handled through Stripe integration.
                  This is a placeholder for the payment integration point.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map((item) => {
                  const med = getMedicationDetails(item.medicationId);
                  if (!med) return null;

                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {med.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(parseFloat(med.wholesalePrice) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium" data-testid="text-shipping">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-total">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createOrderMutation.isPending || !isDataReady}
                data-testid="button-place-order"
              >
                {medicationsLoading ? "Loading..." : createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
              </Button>
              {!isDataReady && !medicationsLoading && (
                <p className="text-sm text-destructive text-center">
                  Unable to load medication prices. Please refresh the page.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
