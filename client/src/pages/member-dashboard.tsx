import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, LogOut, Plus, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ProposalModal from "@/components/modals/proposal-modal";

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("films");
  const [showProposalModal, setShowProposalModal] = useState(false);

  const { data: upcomingFilms } = useQuery({
    queryKey: ["/api/films/upcoming"],
  });

  const { data: pastFilms } = useQuery({
    queryKey: ["/api/films/past"],
  });

  const { data: myProposals } = useQuery({
    queryKey: ["/api/proposals"],
  });

  const { data: myAttendance } = useQuery({
    queryKey: ["/api/attendance/member", user?.id],
  });

  const getStatusBadge = (status: string) => {
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

  const hasAttended = (filmId: number) => {
    return myAttendance?.some((attendance: any) => attendance.filmId === filmId);
  };

  return (
    <div className="min-h-screen bg-cinema-dark">
      {/* Navigation Header */}
      <header className="bg-cinema-surface border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Film className="w-6 h-6 text-cinema-red" />
                <span className="text-xl font-bold text-white">CineForum</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user?.fullName}</span>
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
        {/* User Card with QR Code */}
        <div className="bg-gradient-to-r from-cinema-red to-red-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">{user?.fullName}</h2>
              <p className="text-red-100 mb-1">
                Codice Tessera: <span className="font-mono">{user?.membershipCode}</span>
              </p>
              <p className="text-red-100">
                Scadenza: {user?.expiryDate && format(new Date(user.expiryDate), "dd MMMM yyyy", { locale: it })}
              </p>
              <div className="mt-2">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Tessera Attiva
                </Badge>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl">
              {user?.qrCode && (
                <img src={user.qrCode} alt="QR Code Tessera" className="w-24 h-24" />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("films")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "films"
                  ? "border-cinema-red text-cinema-red"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Film in Programma
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "history"
                  ? "border-cinema-red text-cinema-red"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Film Visti
            </button>
            <button
              onClick={() => setActiveTab("proposals")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "proposals"
                  ? "border-cinema-red text-cinema-red"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Proponi Film
            </button>
          </nav>
        </div>

        {/* Films Tab Content */}
        {activeTab === "films" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-6">Prossimi Film in Programma</h3>
            
            {upcomingFilms?.map((film: any) => (
              <div key={film.id} className="bg-cinema-surface rounded-xl p-6 border border-gray-700 film-card-hover">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                  {film.coverImage && (
                    <img
                      src={film.coverImage}
                      alt={`Poster ${film.title}`}
                      className="w-full md:w-32 h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">{film.title}</h4>
                    <p className="text-gray-300 mb-2">
                      <span className="font-medium">Regia:</span> {film.director}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-medium">Cast:</span> {film.cast}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">{film.plot}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-cinema-accent font-medium">
                        {format(new Date(film.scheduledDate), "EEEE dd MMMM yyyy, 'ore' HH:mm", { locale: it })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {hasAttended(film.id) ? "Partecipato" : "Non ancora partecipato"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-6">Film Già Visti</h3>
            
            {pastFilms?.filter((film: any) => hasAttended(film.id)).map((film: any) => (
              <div key={film.id} className="bg-cinema-surface rounded-xl p-6 border border-gray-700">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                  {film.coverImage && (
                    <img
                      src={film.coverImage}
                      alt={`Poster ${film.title}`}
                      className="w-full md:w-32 h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">{film.title}</h4>
                    <p className="text-gray-300 mb-2">
                      <span className="font-medium">Regia:</span> {film.director}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <span className="font-medium">Cast:</span> {film.cast}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">
                        Visto il {format(new Date(film.scheduledDate), "dd MMMM yyyy", { locale: it })}
                      </span>
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Partecipato
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Proposals Tab Content */}
        {activeTab === "proposals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Le Mie Proposte</h3>
              <Button
                onClick={() => setShowProposalModal(true)}
                className="bg-cinema-red hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuova Proposta
              </Button>
            </div>

            <div className="space-y-4">
              {myProposals?.map((proposal: any) => (
                <div key={proposal.id} className="bg-cinema-surface rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{proposal.title}</h4>
                      <p className="text-gray-300 mb-2">Regia: {proposal.director}</p>
                      <p className="text-gray-400 text-sm">
                        Proposto il {format(new Date(proposal.createdAt), "dd MMMM yyyy", { locale: it })}
                      </p>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProposalModal 
        open={showProposalModal} 
        onOpenChange={setShowProposalModal} 
      />
    </div>
  );
}
