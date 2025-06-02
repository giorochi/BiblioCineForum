
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ViewMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

export default function ViewMemberModal({ open, onOpenChange, member }: ViewMemberModalProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!member) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copiato",
        description: `${field} copiato negli appunti`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile copiare negli appunti",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = member.qrCode;
    link.download = `qr-code-${member.membershipCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMembershipStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: "Scaduta", className: "bg-red-600 text-white" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "In Scadenza", className: "bg-yellow-600 text-white" };
    } else {
      return { status: "Attiva", className: "bg-green-600 text-white" };
    }
  };

  const membershipStatus = getMembershipStatus(member.expiryDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Dettagli Tesserato</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Informazioni Personali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Nome</label>
                <p className="text-white font-medium">{member.firstName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Cognome</label>
                <p className="text-white font-medium">{member.lastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Data di Nascita</label>
                <p className="text-white">{format(new Date(member.birthDate), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Codice Fiscale</label>
                <p className="text-white font-mono">{member.taxCode}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white">{member.email}</p>
              </div>
            </div>
          </div>

          {/* Membership Information */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Informazioni Tessera</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Codice Tessera</label>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono">{member.membershipCode}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(member.membershipCode, "Codice tessera")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedField === "Codice tessera" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Scadenza</label>
                <div className="flex items-center space-x-2">
                  <p className="text-white">{format(new Date(member.expiryDate), "dd/MM/yyyy")}</p>
                  <Badge className={membershipStatus.className}>
                    {membershipStatus.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Data Creazione</label>
                <p className="text-white">{format(new Date(member.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
              </div>
            </div>
          </div>

          {/* Access Credentials */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Credenziali di Accesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Username</label>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono">{member.username}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(member.username, "Username")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedField === "Username" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Password</label>
                <div className="flex items-center space-x-2">
                  <p className="text-white font-mono">••••••••</p>
                  <span className="text-xs text-gray-500">
                    (generata automaticamente al momento della creazione)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">QR Code Tessera</h3>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="bg-white p-4 rounded-lg">
                <img src={member.qrCode} alt="QR Code Tessera" className="w-32 h-32" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-gray-400 text-sm">
                  Usa questo QR code per registrare le presenze durante gli eventi del cineforum.
                </p>
                <Button
                  onClick={downloadQRCode}
                  className="bg-cinema-red hover:bg-red-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Scarica QR Code
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
