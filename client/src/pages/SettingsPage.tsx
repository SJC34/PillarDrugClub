import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Phone, MapPin, User, Save, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const settingsSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Please enter a valid phone number")
    .regex(/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, "Please enter a valid phone number"),
  smsConsent: z.boolean(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber || "",
      smsConsent: user?.smsConsent === "true",
      street: (user?.userAddress as any)?.street || "",
      city: (user?.userAddress as any)?.city || "",
      state: (user?.userAddress as any)?.state || "",
      zipCode: (user?.userAddress as any)?.zipCode || "",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const userAddress = {
        street: data.street || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
      };

      return apiRequest("PATCH", `/api/users/${user.id}`, {
        phoneNumber: data.phoneNumber,
        smsConsent: data.smsConsent,
        userAddress,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    setIsSubmitting(true);
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <Pill className="h-8 w-8 text-primary" />
            <span className="text-xl md:text-2xl font-bold text-foreground">pillar drug club</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your contact information and preferences
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Phone className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Update your phone number and SMS preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber" className="text-sm md:text-base">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...form.register("phoneNumber")}
                  data-testid="input-phone-number"
                  className="h-10 md:h-11"
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-xs md:text-sm text-destructive mt-1">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Used for prescription notifications and account verification
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsConsent"
                  checked={form.watch("smsConsent")}
                  onCheckedChange={(checked) => form.setValue("smsConsent", checked as boolean)}
                  data-testid="checkbox-sms-consent"
                />
                <Label htmlFor="smsConsent" className="text-sm cursor-pointer">
                  I consent to receive SMS notifications about my prescriptions
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Mailing Address
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Your address for prescription deliveries (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street" className="text-sm md:text-base">
                  Street Address
                </Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  {...form.register("street")}
                  data-testid="input-street"
                  className="h-10 md:h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <Label htmlFor="city" className="text-sm md:text-base">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    {...form.register("city")}
                    data-testid="input-city"
                    className="h-10 md:h-11"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="state" className="text-sm md:text-base">
                    State
                  </Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    {...form.register("state")}
                    data-testid="input-state"
                    className="h-10 md:h-11"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="zipCode" className="text-sm md:text-base">
                    ZIP Code
                  </Label>
                  <Input
                    id="zipCode"
                    placeholder="94102"
                    {...form.register("zipCode")}
                    data-testid="input-zip-code"
                    className="h-10 md:h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-cancel">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              data-testid="button-save-settings"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
