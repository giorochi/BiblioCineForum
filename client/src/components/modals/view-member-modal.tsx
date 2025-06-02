
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Download, Copy, Check, RotateCcw, Film, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ViewMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

export default function ViewMemberModal({ open, onOpenChange, member }: ViewMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const { data: memberAttendance } = useQuery({
    queryKey: ["/api/attendance/member", member?.id],
    queryFn: () => apiRequest("GET", `/api/attendance/member/${member.id}`),
    enabled: !!member?.id,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await apiRequest("POST", `/api/members/${memberId}/reset-password`);
      return response.json();
    },
    onSuccess: (data) => {
      setNewPassword(data.newPassword);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Successo",
        description: "Nuova password generata con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nella generazione della nuova password",
        variant: "destructive",
      });
    },
  });

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
                  {(member.plainPassword || newPassword) ? (
                    <>
                      <p className="text-white font-mono bg-gray-700 px-2 py-1 rounded">
                        {member.plainPassword || newPassword}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(member.plainPassword || newPassword, "Password")}
                        className="text-gray-400 hover:text-white"
                      >
                        {copiedField === "Password" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-mono">••••••••</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetPasswordMutation.mutate(member.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                        disabled={resetPasswordMutation.isPending}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        {resetPasswordMutation.isPending ? "Generando..." : "Nuova Password"}
                      </Button>
                    </>
                  )}
                </div>
                {(member.plainPassword || newPassword) && (
                  <p className="text-xs text-green-400 mt-1">
                    Password visibile - comunicala al tesserato
                  </p>
                )}
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

          {/* Films Attended */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Film className="w-5 h-5 mr-2 text-cinema-accent" />
                Film Visti
              </h3>
              <Badge className="bg-cinema-accent text-black">
                Totale: {memberAttendance?.length || 0}
              </Badge>
            </div>
            
            {memberAttendance && memberAttendance.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {memberAttendance.map((attendance: any) => (
                  <div key={attendance.id} className="flex justify-between items-center py-3 px-4 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{attendance.filmTitle}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Film: {format(new Date(attendance.filmDate), "dd/MM/yyyy")}
                        </span>
                        <span>
                          Presenza: {format(new Date(attendance.attendedAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white ml-2">
                      Partecipato
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">Nessun film visto ancora</p>
                <p className="text-gray-500 text-sm">Le presenze registrate appariranno qui</p>
              </div>
            )}
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
