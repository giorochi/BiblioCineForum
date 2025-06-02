import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, LogOut, Plus, CheckCircle, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ProposalModal from "@/components/modals/proposal-modal";
import ViewFilmModal from "@/components/modals/view-film-modal";

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("films");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showViewFilmModal, setShowViewFilmModal] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<any>(null);

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

  const handleViewFilm = (film: any) => {
    setSelectedFilm(film);
    setShowViewFilmModal(true);
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
                <div className="text-center">
                  <img src={user.qrCode} alt="QR Code Tessera" className="w-24 h-24 mb-2" />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = user.qrCode;
                        link.download = `qr-${user.membershipCode}.png`;
                        link.click();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                    >
                      Scarica
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head><title>QR Code - ${user.membershipCode}</title></head>
                              <body style="text-align: center; margin: 50px;">
                                <h2>${user.fullName}</h2>
                                <p>Codice Tessera: ${user.membershipCode}</p>
                                <img src="${user.qrCode}" style="width: 200px; height: 200px;" />
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                    >
                      Stampa
                    </Button>
                  </div>
                </div>
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
            <button
              onClick={() => setActiveTab("attendance")}
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "attendance"
                  ? "border-cinema-red text-cinema-red"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              Le Mie Presenze
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
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewFilm(film)}
                          className="text-cinema-accent hover:text-yellow-400"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Dettagli
                        </Button>
                        <span className="text-xs text-gray-500">
                          {hasAttended(film.id) ? "Partecipato" : "Non ancora partecipato"}
                        </span>
                      </div>
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
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewFilm(film)}
                          className="text-cinema-accent hover:text-yellow-400"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Dettagli
                        </Button>
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Partecipato
                        </Badge>
                      </div>
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
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{proposal.title}</h4>
                      <p className="text-gray-300 mb-1">
                        <span className="font-medium">Regia:</span> {proposal.director}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Data proposta: {format(new Date(proposal.createdAt), "dd MMMM yyyy", { locale: it })}
                      </p>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <p className="text-gray-400 text-sm">
                    <span className="font-medium">Motivazione:</span> {proposal.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Tab Content */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Le Mie Presenze</h3>
              <Badge className="bg-cinema-accent text-black px-3 py-1">
                Presenze totali: {myAttendance?.length || 0}
              </Badge>
            </div>

            <div className="space-y-4">
              {myAttendance && myAttendance.length > 0 ? (
                myAttendance.map((attendance: any) => (
                  <div key={attendance.id} className="bg-cinema-surface rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">{attendance.filmTitle}</h4>
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium">Data film:</span>{" "}
                          {format(new Date(attendance.filmDate), "EEEE dd MMMM yyyy, 'ore' HH:mm", { locale: it })}
                        </p>
                        <p className="text-gray-400 text-sm">
                          <span className="font-medium">Presenza registrata:</span>{" "}
                          {format(new Date(attendance.attendedAt), "dd MMMM yyyy, 'ore' HH:mm", { locale: it })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <Badge className="bg-green-600 text-white">
                          Partecipato
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Nessuna presenza registrata</p>
                  <p className="text-gray-500 text-sm">
                    Le tue presenze ai film verranno mostrate qui dopo che l'admin le avrà registrate
                  </p>
                </div>
              )}
            </div>

            {/* Statistics */}
            {myAttendance && myAttendance.length > 0 && (
              <div className="bg-cinema-surface rounded-xl p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4">Statistiche Presenze</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cinema-accent mb-1">
                      {myAttendance.length}
                    </div>
                    <div className="text-gray-400 text-sm">Film visti</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {myAttendance.filter((a: any) => new Date(a.filmDate) <= new Date()).length}
                    </div>
                    <div className="text-gray-400 text-sm">Film passati</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {myAttendance.filter((a: any) => new Date(a.filmDate) > new Date()).length}
                    </div>
                    <div className="text-gray-400 text-sm">Film futuri</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProposalModal 
        open={showProposalModal} 
        onOpenChange={setShowProposalModal} 
      />
      <ViewFilmModal 
        open={showViewFilmModal} 
        onOpenChange={setShowViewFilmModal}
        film={selectedFilm}
      />
    </div>
  );
}