import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

export default function EditMemberModal({ open, onOpenChange, member }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    taxCode: "",
    email: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        birthDate: member.birthDate || "",
        taxCode: member.taxCode || "",
        email: member.email || ""
      });
    }
  }, [member]);

  const updateMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", `/api/members/${member.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      onOpenChange(false);
      toast({
        title: "Successo",
        description: "Tesserato aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento del tesserato",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-lg max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Modifica Tesserato</DialogTitle>
          <DialogDescription className="text-gray-400">
            Aggiorna le informazioni del tesserato selezionato
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
              disabled={updateMemberMutation.isPending}
              className="bg-cinema-red hover:bg-red-700 text-white"
            >
              {updateMemberMutation.isPending ? "Aggiornamento..." : "Aggiorna"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}