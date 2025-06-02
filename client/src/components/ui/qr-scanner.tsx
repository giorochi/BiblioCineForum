
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Square } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // For now, we'll wait for manual scanning
      // The user needs to manually enter the code or we need a QR scanning library
      
    } catch (err) {
      const errorMessage = "Errore nell'accesso alla fotocamera";
      setError(errorMessage);
      onError?.(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden">
        {isScanning ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Premi per avviare la scansione</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 rounded-lg">
            <p className="text-white text-sm text-center px-4">{error}</p>
          </div>
        )}

        {isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-cinema-red w-32 h-32 animate-pulse"></div>
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
