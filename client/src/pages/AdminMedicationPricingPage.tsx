import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Download,
  Info
} from "lucide-react";

interface UploadResult {
  success: boolean;
  message: string;
  updatedCount?: number;
  errors?: string[];
}

export default function AdminMedicationPricingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/admin/medications/upload-prices', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      return await res.json() as UploadResult;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      if (data.success) {
        toast({
          title: "Upload successful",
          description: `Updated ${data.updatedCount} medication prices`,
        });
        setSelectedFile(null);
      } else {
        toast({
          title: "Upload failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload error",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "ndc,price,wholesalePrice,annualPrice\n11111111111,10.99,8.50,102.00\n22222222222,25.50,20.00,306.00";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medication_pricing_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Medication Pricing</h1>
          <p className="text-muted-foreground">Upload CSV file to update medication prices in bulk</p>
        </div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              CSV Format Instructions
            </CardTitle>
            <CardDescription>Follow these guidelines for successful price updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 py-0.5 rounded">ndc</code> - National Drug Code (unique identifier)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">price</code> - Retail price (e.g., 10.99)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">wholesalePrice</code> - Wholesale price (e.g., 8.50)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">annualPrice</code> - Annual price (optional, e.g., 102.00)</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The NDC must match existing medications in the database. Medications not found will be skipped.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={downloadTemplate} 
              variant="outline" 
              className="gap-2"
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4" />
              Download Template CSV
            </Button>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Price Update File</CardTitle>
            <CardDescription>Select a CSV file containing medication pricing updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-muted-foreground/50 rounded-lg hover-elevate transition-all">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Choose CSV file"}
                  </span>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-csv-file"
                  />
                </div>
              </label>

              {selectedFile && (
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending}
                  className="gap-2"
                  data-testid="button-upload-csv"
                >
                  <FileText className="h-4 w-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload & Update Prices"}
                </Button>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedFile.name}</span>
                <Badge variant="outline" data-testid="badge-file-size">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{uploadResult.message}</p>
                
                {uploadResult.success && uploadResult.updatedCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" data-testid="badge-updated-count">
                      {uploadResult.updatedCount} medications updated
                    </Badge>
                  </div>
                )}

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Errors encountered:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {uploadResult.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
