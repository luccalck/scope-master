import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2 } from "lucide-react";
import { fetchProjetos, criarRequisito, CodigoRequisitoDuplicadoError } from "../lib/api";
import type { Projeto, TipoRequisito } from "../lib/types";

interface CreateRequirementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Quando informado, o projeto vem pré-selecionado e o seletor fica bloqueado.
   * Usado quando o modal é aberto a partir do painel de um projeto específico.
   */
  preselectedProjectId?: string;
  /** Callback opcional disparado após criar com sucesso (ex: recarregar painel) */
  onCreated?: () => void;
}

export function CreateRequirementModal({
  open,
  onOpenChange,
  preselectedProjectId,
  onCreated,
}: CreateRequirementModalProps) {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState(preselectedProjectId || "");
  const [tipo, setTipo] = useState<TipoRequisito | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(false);

  useEffect(() => {
    if (open) {
      // Sincroniza o projeto pré-selecionado sempre que o modal abrir
      if (preselectedProjectId) {
        setProjetoId(preselectedProjectId);
      }
      const carregar = async () => {
        try {
          setLoadingProjetos(true);
          const data = await fetchProjetos();
          setProjetos(data);
        } catch (err) {
          console.error("Erro ao carregar projetos:", err);
        } finally {
          setLoadingProjetos(false);
        }
      };
      carregar();
    }
  }, [open, preselectedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!codigo.trim() || !descricao.trim() || !projetoId || !tipo) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await criarRequisito({
        id_projeto: projetoId,
        codigo: codigo.trim(),
        tipo: tipo as TipoRequisito,
        descricao: descricao.trim(),
      });
      onOpenChange(false);
      // Reset form (mantém o projeto pré-selecionado se houver)
      setCodigo("");
      setDescricao("");
      setProjetoId(preselectedProjectId || "");
      setTipo("");
      onCreated?.();
    } catch (err) {
      console.error("Erro ao criar requisito:", err);
      if (err instanceof CodigoRequisitoDuplicadoError) {
        // A3 — Código de Requisito Duplicado / RN002
        setError(err.message);
      } else {
        setError("Erro ao criar o requisito. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Criar Novo Requisito
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="codigo" className="text-sm font-medium text-foreground">
              Código
            </Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: RF01, RNF02"
              className="border-border shadow-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-sm font-medium text-foreground">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o requisito em detalhes"
              className="min-h-[120px] border-border shadow-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Projeto
              </Label>
              <Select
                value={projetoId}
                onValueChange={setProjetoId}
                required
                disabled={!!preselectedProjectId}
              >
                <SelectTrigger className="border-border shadow-sm">
                  <SelectValue placeholder={loadingProjetos ? "Carregando..." : "Selecione o projeto"} />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map((proj) => (
                    <SelectItem key={proj.id_projeto} value={proj.id_projeto}>
                      {proj.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preselectedProjectId && (
                <p className="text-xs text-muted-foreground">
                  Requisito será cadastrado neste projeto.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Tipo
              </Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRequisito)} required>
                <SelectTrigger className="border-border shadow-sm">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcional">Funcional</SelectItem>
                  <SelectItem value="Não Funcional">Não Funcional</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                "Criar Requisito"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
