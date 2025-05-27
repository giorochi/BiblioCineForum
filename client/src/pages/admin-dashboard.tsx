import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, QrCode, UserPlus, Plus, Eye, Edit, Trash2, Check, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddMemberModal from "@/components/modals/add-member-modal";
import AddFilmModal from "@/components/modals/add-film-modal";
import QRScannerModal from "@/components/modals/qr-scanner-modal";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("members");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddFilmModal, setShowAddFilmModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: films } = useQuery({
    queryKey: ["/api/films"],
  });

  const { data: proposals } = useQuery({
    queryKey: ["/api/proposals"],
  });

  const renewMembershipMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest("POST", `/api/members/${memberId}/renew`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Successo",
        description: "Tessera rinnovata con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel rinnovo della tessera",
        variant: "destructive",
      });
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/proposals/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Successo",
        description: "Proposta aggiornata con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento della proposta",
        variant: "destructive",
      });
    },
  });

  const deleteFilmMutation = useMutation({
    mutationFn: async (filmId: number) => {
      return apiRequest("DELETE", `/api/films/${filmId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/films"] });
      toast({
        title: "Successo",
        description: "Film eliminato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione del film",
        variant: "destructive",
      });
    },
  });

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

  const getProposalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-600 text-white">In Valutazione</Badge>;
      case "approved":
        return <Badge className="bg-green-600 text-white">Approvata</Badge>;
      case "rejected":
        return <Badge className="bg-red-600 text-white">Rifiutata</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">Sconosciuto</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-cinema-dark">
      {/* Admin Navigation */}
      <header className="bg-cinema-surface border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-cinema-accent" />
                <span className="text-xl font-bold text-white">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowQRScannerModal(true)}
                className="bg-cinema-red hover:bg-red-700 text-white"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scansiona QR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "members"
                  ? "border-cinema-accent text-cinema-accent"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Tesserati
            </button>
            <button
              onClick={() => setActiveTab("films")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "films"
                  ? "border-cinema-accent text-cinema-accent"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Gestione Film
            </button>
            <button
              onClick={() => setActiveTab("proposals")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "proposals"
                  ? "border-cinema-accent text-cinema-accent"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Proposte Film
            </button>
          </nav>
        </div>

        {/* Members Management Tab */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Gestione Tesserati</h3>
              <Button
                onClick={() => setShowAddMemberModal(true)}
                className="bg-cinema-red hover:bg-red-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nuovo Tesserato
              </Button>
            </div>

            <div className="bg-cinema-surface rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tesserato</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Codice Tessera</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Scadenza</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stato</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {members?.map((member: any) => {
                      const membershipStatus = getMembershipStatus(member.expiryDate);
                      return (
                        <tr key={member.id} className="hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {member.firstName} {member.lastName}
                              </div>
                              <div className="text-sm text-gray-400">{member.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                            {member.membershipCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {format(new Date(member.expiryDate), "dd/MM/yyyy")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={membershipStatus.className}>
                              {membershipStatus.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-cinema-accent hover:text-yellow-400"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => renewMembershipMutation.mutate(member.id)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Films Management Tab */}
        {activeTab === "films" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Gestione Film</h3>
              <Button
                onClick={() => setShowAddFilmModal(true)}
                className="bg-cinema-red hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Film
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {films?.map((film: any) => (
                <div key={film.id} className="bg-cinema-surface rounded-xl overflow-hidden border border-gray-700 film-card-hover">
                  {film.coverImage && (
                    <img
                      src={film.coverImage}
                      alt={`Poster ${film.title}`}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">{film.title}</h4>
                    <p className="text-gray-300 text-sm mb-2">{film.director}</p>
                    <p className="text-gray-400 text-sm mb-4">
                      {format(new Date(film.scheduledDate), "dd MMMM yyyy, HH:mm", { locale: it })}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Film programmato</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFilmMutation.mutate(film.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposals Management Tab */}
        {activeTab === "proposals" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-6">Proposte Film da Approvare</h3>
            
            <div className="space-y-4">
              {proposals?.filter((proposal: any) => proposal.status === "pending").map((proposal: any) => (
                <div key={proposal.id} className="bg-cinema-surface rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{proposal.title}</h4>
                      <p className="text-gray-300 mb-1">Regia: {proposal.director}</p>
                      <p className="text-gray-400 text-sm">Proposto da: {proposal.memberName}</p>
                      <p className="text-gray-400 text-sm">
                        Data proposta: {format(new Date(proposal.createdAt), "dd MMMM yyyy", { locale: it })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateProposalMutation.mutate({ id: proposal.id, status: "approved" })}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approva
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateProposalMutation.mutate({ id: proposal.id, status: "rejected" })}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    <span className="font-medium">Motivazione:</span> {proposal.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddMemberModal 
        open={showAddMemberModal} 
        onOpenChange={setShowAddMemberModal} 
      />
      <AddFilmModal 
        open={showAddFilmModal} 
        onOpenChange={setShowAddFilmModal} 
      />
      <QRScannerModal 
        open={showQRScannerModal} 
        onOpenChange={setShowQRScannerModal} 
      />
    </div>
  );
}
