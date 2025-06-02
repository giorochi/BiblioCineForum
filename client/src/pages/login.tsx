import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Film } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Don't clear tokens automatically - let auth handle it

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (error) {
      toast({
        title: "Errore di login",
        description: "Credenziali non valide",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cinema-dark via-gray-900 to-cinema-surface p-4">
      <div className="max-w-md w-full">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-4">
              <span className="text-2xl font-bold text-white">SCB</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-amber-600 mb-1">Biblioteca San Carlo Borromeo</h1>
          <h2 className="text-xl font-semibold text-amber-500 mb-2">CineForum</h2>
          <p className="text-gray-400">Sistema di gestione eventi</p>
        </div>

        {/* Login Form */}
        <Card className="bg-cinema-surface border-gray-700 shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-gray-300 mb-2">Username</Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cinema-red focus:border-transparent"
                  placeholder="Inserisci il tuo username"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300 mb-2">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-cinema-red focus:border-transparent"
                  placeholder="Inserisci la tua password"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cinema-red hover:bg-red-700 text-white font-semibold py-3 transition duration-200 transform hover:scale-105"
              >
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}