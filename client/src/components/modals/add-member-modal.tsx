import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMemberModal({ open, onOpenChange }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    taxCode: "",
    email: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/members", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setFormData({
        firstName: "",
        lastName: "",
        birthDate: "",
        taxCode: "",
        email: ""
      });
      onOpenChange(false);
      toast({
        title: "Tesserato creato con successo",
        description: `Username: ${data.username} - Password: ${data.plainPassword}`,
        duration: 10000, // Show for 10 seconds so admin can note the credentials
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nella creazione del tesserato",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMemberMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-lg max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nuovo Tesserato</DialogTitle>
          <DialogDescription className="text-gray-400">
            Compila i campi per registrare un nuovo tesserato al circolo del cinema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2">Nome</Label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Nome"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300 mb-2">Cognome</Label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Cognome"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Data di Nascita</Label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Codice Fiscale</Label>
            <Input
              type="text"
              value={formData.taxCode}
              onChange={(e) => handleChange("taxCode", e.target.value.toUpperCase())}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="RSSMRA80A01H501X"
              maxLength={16}
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="email@example.com"
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
              disabled={createMemberMutation.isPending}
              className="bg-cinema-red hover:bg-red-700 text-white"
            >
              {createMemberMutation.isPending ? "Salvataggio..." : "Salva Tesserato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}