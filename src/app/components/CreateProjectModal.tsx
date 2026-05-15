import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { criarProjeto } from "../lib/api";
import { Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!projectName.trim()) {
      setError("O nome do projeto é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      await criarProjeto(projectName.trim(), description.trim());
      onOpenChange(false);
      // Reset form
      setProjectName("");
      setDescription("");
    } catch (err) {
      console.error("Erro ao criar projeto:", err);
      setError("Erro ao criar o projeto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Criar Novo Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-sm font-medium text-foreground">
              Nome do Projeto
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Digite o nome do projeto"
              className="border-border shadow-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo e escopo do projeto"
              className="min-h-[100px] border-border shadow-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border shadow-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-foreground hover:bg-foreground/90 text-background"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Projeto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
