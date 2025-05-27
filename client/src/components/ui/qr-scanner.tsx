import { useState, useEffect } from "react";
import { Button } from "./button";
import { Camera, Square } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanning = async () => {
    setIsScanning(true);
    setError(null);

    try {
      // Simulate QR code scanning
      // In a real implementation, you would use libraries like:
      // - @zxing/library
      // - qr-scanner
      // - react-qr-scanner
      
      setTimeout(() => {
        const mockQRCode = "CF" + Math.floor(Math.random() * 999999).toString().padStart(6, '0');
        onScan(mockQRCode);
        setIsScanning(false);
      }, 2000);
      
    } catch (err) {
      const errorMessage = "Errore nell'accesso alla fotocamera";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
        {!isScanning ? (
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Premi per avviare la scansione</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-pulse">
              <Square className="w-16 h-16 text-cinema-red mx-auto mb-2" />
            </div>
            <p className="text-white text-sm">Inquadra il QR Code...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 rounded-lg">
            <p className="text-white text-sm text-center px-4">{error}</p>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        {!isScanning ? (
          <Button 
            onClick={startScanning}
            className="bg-cinema-red hover:bg-red-700 text-white"
          >
            <Camera className="w-4 h-4 mr-2" />
            Avvia Scansione
          </Button>
        ) : (
          <Button 
            onClick={stopScanning}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Interrompi
          </Button>
        )}
      </div>
    </div>
  );
}
