import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditFilmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  film: any;
}

export default function EditFilmModal({ open, onOpenChange, film }: EditFilmModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: film?.title || "",
    director: film?.director || "",
    cast: film?.cast || "",
    plot: film?.plot || "",
    scheduledDate: film?.scheduledDate ? new Date(film.scheduledDate).toISOString().slice(0, 16) : "",
  });

  const updateFilmMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/films/${film.id}`, {
        ...data,
        scheduledDate: new Date(data.scheduledDate)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/films"] });
      toast({
        title: "Successo",
        description: "Film aggiornato con successo",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento del film",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilmMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!film) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cinema-accent">
            Modifica Film
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">Titolo</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="director" className="text-gray-300">Regia</Label>
            <Input
              id="director"
              name="director"
              value={formData.director}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="cast" className="text-gray-300">Cast</Label>
            <Input
              id="cast"
              name="cast"
              value={formData.cast}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="plot" className="text-gray-300">Trama</Label>
            <Textarea
              id="plot"
              name="plot"
              value={formData.plot}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white min-h-24"
              required
            />
          </div>

          <div>
            <Label htmlFor="scheduledDate" className="text-gray-300">Data e Ora Proiezione</Label>
            <Input
              id="scheduledDate"
              name="scheduledDate"
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={updateFilmMutation.isPending}
              className="bg-cinema-red hover:bg-red-700 text-white"
            >
              {updateFilmMutation.isPending ? "Aggiornamento..." : "Aggiorna Film"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}