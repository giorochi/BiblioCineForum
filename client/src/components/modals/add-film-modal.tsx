import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddFilmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFilmModal({ open, onOpenChange }: AddFilmModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    director: "",
    cast: "",
    plot: "",
    scheduledDate: "",
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFilmMutation = useMutation({
    mutationFn: async ({ filmData, file }: { filmData: typeof formData; file: File | null }) => {
      const formDataToSend = new FormData();

      Object.entries(filmData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      if (file) {
        formDataToSend.append("coverImage", file);
      }

      const response = await fetch("/api/films", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to create film");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/films"] });
      toast({
        title: "Successo",
        description: "Film aggiunto con successo",
      });
      onOpenChange(false);
      setFormData({
        title: "",
        director: "",
        cast: "",
        plot: "",
        scheduledDate: "",
      });
      setCoverImage(null);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiunta del film",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFilmMutation.mutate({ 
      filmData: {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
      }, 
      file: coverImage 
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-lg max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Aggiungi Nuovo Film</DialogTitle>
          <DialogDescription className="text-gray-400">
            Inserisci i dettagli per programmare un nuovo film nel cineforum
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Titolo</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="Titolo del film"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Regista</Label>
            <Input
              type="text"
              value={formData.director}
              onChange={(e) => handleChange("director", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="Nome del regista"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Cast Principale</Label>
            <Input
              type="text"
              value={formData.cast}
              onChange={(e) => handleChange("cast", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="Attori principali separati da virgola"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Trama</Label>
            <Textarea
              value={formData.plot}
              onChange={(e) => handleChange("plot", e.target.value)}
              rows={4}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="Breve descrizione della trama..."
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Data e Ora Proiezione</Label>
            <Input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => handleChange("scheduledDate", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Copertina Film</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">
                {coverImage ? coverImage.name : "Clicca per caricare la copertina"}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="coverImage"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("coverImage")?.click()}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Scegli File
              </Button>
            </div>
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
              disabled={createFilmMutation.isPending}
              className="bg-cinema-red hover:bg-red-700 text-white"
            >
              {createFilmMutation.isPending ? "Salvataggio..." : "Salva Film"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}