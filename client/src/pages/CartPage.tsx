import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2, ShoppingCart, Plus, Minus, Package } from "lucide-react";
import { Link, useLocation } from "wouter";

interface CartItem {
  id: string;
  userId: string;
  medicationId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
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

export default function CartPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: [`/api/users/${user?.id}/cart`],
    enabled: !!user?.id,
  });

  // Fetch medications details for all cart items
  const medicationIds = cartItems.map(item => item.medicationId);
  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ['/api/medications/batch', medicationIds],
    queryFn: async () => {
      if (medicationIds.length === 0) return [];
      
      // Fetch each medication
      const medPromises = medicationIds.map(id => 
        fetch(`/api/medications/${id}`, { credentials: 'include' }).then(res => res.json())
      );
      return Promise.all(medPromises);
    },
    enabled: medicationIds.length > 0,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return apiRequest('PUT', `/api/cart/item/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/cart`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest('DELETE', `/api/cart/item/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/cart`] });
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/cart/user/${user?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/cart`] });
      toast({
        title: "Success",
        description: "Cart cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Please log in to view your cart</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to add items to your cart.</p>
            <Button asChild data-testid="button-login">
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading cart...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add medications to get started</p>
            <Button asChild data-testid="button-browse-medications">
              <Link href="/medications">Browse Medications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const med = getMedicationDetails(item.medicationId);
            if (!med) return null;

            return (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid={`medication-name-${item.id}`}>
                        {med.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {med.genericName} • {med.strength} • {med.dosageForm}
                      </p>
                      <p className="text-lg font-bold mt-2" data-testid={`price-${item.id}`}>
                        ${parseFloat(med.wholesalePrice).toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 });
                            }
                          }}
                          disabled={item.quantity <= 1}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium" data-testid={`quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="text-sm text-muted-foreground">Subtotal: </span>
                    <span className="font-semibold" data-testid={`item-subtotal-${item.id}`}>
                      ${(parseFloat(med.wholesalePrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={() => clearCartMutation.mutate()}
            disabled={clearCartMutation.isPending}
            data-testid="button-clear-cart"
          >
            Clear Cart
          </Button>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium" data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium" data-testid="text-shipping">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span data-testid="text-total">${total.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setLocation('/checkout')}
                data-testid="button-checkout"
              >
                Proceed to Checkout
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                asChild
                data-testid="button-continue-shopping"
              >
                <Link href="/medications">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
