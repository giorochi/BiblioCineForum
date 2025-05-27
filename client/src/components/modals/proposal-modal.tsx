import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProposalModal({ open, onOpenChange }: ProposalModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    director: "",
    reason: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProposalMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/proposals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Successo",
        description: "Proposta inviata con successo",
      });
      onOpenChange(false);
      setFormData({
        title: "",
        director: "",
        reason: "",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'invio della proposta",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProposalMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Proponi un Film</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Titolo Film</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="Titolo del film che vorresti proporre"
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
            <Label className="text-gray-300 mb-2">Motivazione</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              rows={4}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              placeholder="Perché vorresti che proiettassimo questo film? Cosa ti ha colpito di più?"
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
              disabled={createProposalMutation.isPending}
              className="bg-cinema-red hover:bg-red-700 text-white"
            >
              {createProposalMutation.isPending ? "Invio..." : "Invia Proposta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
