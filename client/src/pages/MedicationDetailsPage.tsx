import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, AlertTriangle, Info, Package } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  category: string;
  description: string;
  price: number;
  wholesalePrice: number;
  inStock: boolean;
  quantity: number;
  requiresPrescription: boolean;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
}

export default function MedicationDetailsPage() {
  const { id } = useParams();

  const { data: medication, isLoading } = useQuery({
    queryKey: ['/api/medications', id],
    queryFn: async () => {
      const response = await fetch(`/api/medications/${id}`);
      if (!response.ok) throw new Error('Medication not found');
      return response.json();
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Medication Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The medication you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/medications">
            <Button>Browse Medications</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/medications">
            <Button variant="ghost" className="gap-2" data-testid="button-back-to-medications">
              <ArrowLeft className="h-4 w-4" />
              Back to Medications
            </Button>
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl text-foreground mb-2">
                  {medication.name}
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  {medication.genericName}
                  {medication.brandName && ` (${medication.brandName})`}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{medication.category}</Badge>
                  <Badge variant="outline">{medication.strength}</Badge>
                  <Badge variant="outline">{medication.dosageForm}</Badge>
                  {!medication.inStock && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground line-through">
                    Retail: ${medication.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  ${medication.wholesalePrice.toFixed(2)}
                </div>
                <Badge className="bg-primary/10 text-primary border-primary mt-1">
                  Save {Math.round(((medication.price - medication.wholesalePrice) / medication.price) * 100)}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-muted-foreground mb-6">{medication.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Manufacturer:</span>
                  <span className="text-sm font-medium">{medication.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Strength:</span>
                  <span className="text-sm font-medium">{medication.strength}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dosage Form:</span>
                  <span className="text-sm font-medium">{medication.dosageForm}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-sm font-medium">{medication.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stock Status:</span>
                  <span className={`text-sm font-medium ${medication.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {medication.inStock ? `In Stock (${medication.quantity})` : 'Out of Stock'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prescription:</span>
                  <span className="text-sm font-medium">
                    {medication.requiresPrescription ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {medication.requiresPrescription ? (
                <Link 
                  href={`/prescription-transfer?medicationName=${encodeURIComponent(medication.name)}&dosage=${encodeURIComponent(medication.strength)}&quantity=30`} 
                  className="flex-1"
                >
                  <Button 
                    size="lg" 
                    className="w-full"
                    disabled={!medication.inStock}
                    data-testid="button-order-prescription"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Order with Prescription
                  </Button>
                </Link>
              ) : (
                <Link href={`/order/otc/${medication.id}`} className="flex-1">
                  <Button 
                    size="lg" 
                    className="w-full"
                    disabled={!medication.inStock}
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                </Link>
              )}
            </div>

            {medication.requiresPrescription && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  <h3 className="font-medium text-amber-700 dark:text-amber-300">
                    Prescription Required
                  </h3>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This medication requires a valid prescription from a licensed healthcare provider. 
                  Our pharmacy team will verify your prescription before processing your order.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Side Effects */}
          {medication.sideEffects?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Common Side Effects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {medication.sideEffects.map((effect: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      {effect}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {medication.warnings?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Important Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {medication.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Drug Interactions */}
          {medication.interactions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Drug Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {medication.interactions.map((interaction: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      {interaction}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Disclaimer */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              <strong>Important:</strong> This information is for educational purposes only and should not replace 
              professional medical advice. Always consult with your healthcare provider before starting, stopping, 
              or changing any medication. Side effects and drug interactions listed may not be complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}