import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QRScanner } from "@/components/ui/qr-scanner";

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QRScannerModal({ open, onOpenChange }: QRScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [selectedFilmId, setSelectedFilmId] = useState<string>("");
  const [scannedCode, setScannedCode] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upcomingFilms } = useQuery({
    queryKey: ["/api/films/upcoming"],
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ membershipCode, filmId }: { membershipCode: string; filmId: number }) => {
      return apiRequest("POST", "/api/attendance", { membershipCode, filmId });
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Presenza registrata con successo",
      });
      onOpenChange(false);
      setManualCode("");
      setScannedCode("");
      setSelectedFilmId("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nella registrazione della presenza",
        variant: "destructive",
      });
    },
  });

  const handleQRScan = (result: string) => {
    setScannedCode(result);
    setManualCode(result);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-md qr-scanner-overlay">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">Scansiona QR Code</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Film Selection */}
          <div>
            <Label className="text-gray-300 mb-2">Seleziona Film</Label>
            <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Scegli il film..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {upcomingFilms?.map((film: any) => (
                  <SelectItem key={film.id} value={film.id.toString()}>
                    {film.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QR Scanner */}
          <QRScanner 
            onScan={handleQRScan}
            onError={(error) => {
              toast({
                title: "Errore Scanner",
                description: error,
                variant: "destructive",
              });
            }}
          />

          {/* Manual Input Alternative */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm mb-3">Oppure inserisci manualmente:</p>
            <Label className="text-gray-300 mb-2">Codice Tessera</Label>
            <Input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="CF123456"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 mb-4"
            />
            <Button
              onClick={handleMarkAttendance}
              disabled={markAttendanceMutation.isPending}
              className="w-full bg-cinema-red hover:bg-red-700 text-white"
            >
              {markAttendanceMutation.isPending ? "Registrazione..." : "Segna Presenza"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
