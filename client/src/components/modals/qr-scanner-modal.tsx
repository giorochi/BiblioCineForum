import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRScanner } from "@/components/ui/qr-scanner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Type } from "lucide-react";

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QRScannerModal({ open, onOpenChange }: QRScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [selectedFilmId, setSelectedFilmId] = useState<string>("");
  const [scannedCode, setScannedCode] = useState<string>("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upcomingFilms } = useQuery({
    queryKey: ["/api/films/upcoming"],
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ membershipCode, filmId }: { membershipCode: string; filmId: number }) => {
      return apiRequest("POST", "/api/attendance", { membershipCode, filmId });
    },
    onSuccess: (data) => {
      toast({
        title: "Successo",
        description: `Presenza registrata con successo per ${data.attendance?.memberName || 'il tesserato'}`,
      });
      setScannedCode("");
      setManualCode("");
      setSelectedFilmId("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      let errorMessage = "Errore nella registrazione della presenza";
      if (error.message?.includes("Member not found")) {
        errorMessage = "Codice tessera non trovato";
      } else if (error.message?.includes("already marked")) {
        errorMessage = "Presenza già registrata per questo film";
      }
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleQRScan = (result: string) => {
    setScannedCode(result);
    setManualCode(result);
    toast({
      title: "QR Code Scansionato",
      description: `Codice tessera: ${result}`,
    });
  };

  const handleMarkAttendance = () => {
    const code = scannedCode || manualCode;

    if (!code) {
      toast({
        title: "Errore",
        description: "Inserisci o scansiona un codice tessera",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFilmId) {
      toast({
        title: "Errore", 
        description: "Seleziona un film",
        variant: "destructive",
      });
      return;
    }

    markAttendanceMutation.mutate({ 
      membershipCode: code, 
      filmId: parseInt(selectedFilmId) 
    });
  };

  const handleClose = () => {
    setManualCode("");
    setScannedCode("");
    setSelectedFilmId("");
    setScanMode("camera");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Registra Presenza</DialogTitle>
          <DialogDescription className="text-gray-400">
            Scansiona il QR code del tesserato o inserisci manualmente il codice tessera
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex space-x-2">
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              onClick={() => setScanMode("camera")}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              onClick={() => setScanMode("manual")}
              className="flex-1"
            >
              <Type className="w-4 h-4 mr-2" />
              Manuale
            </Button>
          </div>

          {/* QR Scanner */}
          {scanMode === "camera" && (
            <div className="space-y-4">
              <QRScanner onScan={handleQRScan} />
              {scannedCode && (
                <div className="bg-green-800 p-3 rounded">
                  <p className="text-green-200 text-sm">
                    <strong>Codice scansionato:</strong> {scannedCode}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          {scanMode === "manual" && (
            <div>
              <Label className="text-gray-300 mb-2">Codice Tessera</Label>
              <Input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Inserisci codice tessera (es. CF123456)"
              />
            </div>
          )}

          {/* Film Selection */}
          <div>
            <Label className="text-gray-300 mb-2">Seleziona Film</Label>
            <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Scegli un film..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {upcomingFilms?.map((film: any) => (
                  <SelectItem key={film.id} value={film.id.toString()}>
                    {film.title} - {new Date(film.scheduledDate).toLocaleDateString("it-IT")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleMarkAttendance}
              disabled={markAttendanceMutation.isPending || (!scannedCode && !manualCode) || !selectedFilmId}
              className="bg-cinema-red hover:bg-red-700 text-white"
            >
              {markAttendanceMutation.isPending ? "Registrazione..." : "Registra Presenza"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}