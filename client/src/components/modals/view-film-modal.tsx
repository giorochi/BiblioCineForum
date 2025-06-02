import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ViewFilmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  film: any;
}

export default function ViewFilmModal({ open, onOpenChange, film }: ViewFilmModalProps) {
  if (!film) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cinema-accent">
            Dettagli Film
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {film.coverImage && (
            <div className="flex justify-center">
              <img
                src={film.coverImage}
                alt={`Poster ${film.title}`}
                className="w-48 h-72 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{film.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Regia:</span>
                  <p className="text-white">{film.director}</p>
                </div>
                <div>
                  <span className="text-gray-400">Cast:</span>
                  <p className="text-white">{film.cast}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Data proiezione:</span>
                  <p className="text-cinema-accent font-medium">
                    {format(new Date(film.scheduledDate), "EEEE dd MMMM yyyy, 'ore' HH:mm", { locale: it })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-gray-400">Trama:</span>
              <p className="text-white mt-1 leading-relaxed">{film.plot}</p>
            </div>

            {film.attendanceCount !== undefined && (
              <div>
                <span className="text-gray-400">Presenze registrate:</span>
                <Badge className="ml-2 bg-blue-600 text-white">
                  {film.attendanceCount} partecipanti
                </Badge>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}