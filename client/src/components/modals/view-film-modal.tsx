import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Eye, Users } from "lucide-react";
import { useState } from "react";

interface ViewFilmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  film: any;
}

export default function ViewFilmModal({ open, onOpenChange, film }: ViewFilmModalProps) {
  const { user } = useAuth();
  const [showAttendance, setShowAttendance] = useState(false);

  const { data: filmAttendance } = useQuery({
    queryKey: ["/api/attendance/film", film?.id],
    enabled: !!film?.id && user?.role === 'admin' && showAttendance,
  });

  if (!film) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-cinema-surface border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Dettagli Film</DialogTitle>
          <DialogDescription className="text-gray-400">
            Dettagli completi del film con informazioni su presenze e statistiche
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {film.coverImage && (
            <div className="flex justify-center">
              <img
                src={film.coverImage}
                alt={`Poster ${film.title}`}
                className="max-w-xs h-auto object-cover rounded-lg border border-gray-600"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{film.title}</h3>
              <p className="text-gray-300">
                <span className="font-medium">Regia:</span> {film.director}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Cast:</span> {film.cast}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Anno:</span> {film.year}
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Durata:</span> {film.duration} minuti
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Genere:</span> {film.genre}
              </p>
            </div>

            <div>
              <p className="text-gray-300">
                <span className="font-medium">Data e ora:</span>{" "}
                {format(new Date(film.scheduledDate), "EEEE dd MMMM yyyy, 'ore' HH:mm", { locale: it })}
              </p>
            </div>

            {film.plot && (
              <div>
                <h4 className="font-medium text-white mb-2">Trama</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{film.plot}</p>
              </div>
            )}

            {/* Attendance Section - Only for Admins */}
            {user?.role === 'admin' && (
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Presenze</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAttendance(!showAttendance)}
                    className="text-cinema-accent hover:text-yellow-400"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {showAttendance ? 'Nascondi' : 'Mostra'} Presenze
                  </Button>
                </div>

                {film.attendanceCount !== undefined && (
                  <div className="mb-3">
                    <Badge className="bg-blue-600 text-white">
                      Totale presenti: {film.attendanceCount}
                    </Badge>
                  </div>
                )}

                {showAttendance && filmAttendance && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filmAttendance.length > 0 ? (
                      filmAttendance.map((attendance: any) => (
                        <div key={attendance.id} className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded">
                          <span className="text-white text-sm">
                            {attendance.memberFirstName} {attendance.memberLastName}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {format(new Date(attendance.attendedAt), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4 text-sm">Nessuna presenza registrata</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <Badge className="bg-cinema-red text-white px-4 py-2">
                Film Programmato
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}