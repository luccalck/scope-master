import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, AlertTriangle } from "lucide-react";
import { atualizarRequisito, CodigoRequisitoDuplicadoError } from "../lib/api";
import type { Requisito, TipoRequisito } from "../lib/types";

interface EditRequirementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: Requisito;
  onSaved: (atualizado: Requisito) => void;
}

/**
 * Modal de edição de requisito (RF07).
 * Implementa também a RN004: ao editar um requisito "Aprovado",
 * o sistema avisa o usuário que o status voltará para "Pendente".
 */
export function EditRequirementModal({
  open,
  onOpenChange,
  requirement,
  onSaved,
}: EditRequirementModalProps) {
  const [codigo, setCodigo] = useState(requirement.codigo);
  const [descricao, setDescricao] = useState(requirement.descricao);
  const [tipo, setTipo] = useState<TipoRequisito>(requirement.tipo);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCodigo(requirement.codigo);
      setDescricao(requirement.descricao);
      setTipo(requirement.tipo);
      setError(null);
    }
  }, [open, requirement]);

  const eraAprovado = requirement.status_validacao === "Aprovado";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!codigo.trim() || !descricao.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      const atualizado = await atualizarRequisito(requirement.id_requisito, {
        codigo: codigo.trim(),
        descricao: descricao.trim(),
        tipo,
      });
      onSaved(atualizado);
      onOpenChange(false);
    } catch (err) {
      console.error("Erro ao editar requisito:", err);
      if (err instanceof CodigoRequisitoDuplicadoError) {
        setError(err.message);
      } else {
        setError("Falha ao salvar a edição. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border shadow-sm">
        <DialogHeader>
          <DialogTitle>Editar Requisito {requirement.codigo}</DialogTitle>
          <DialogDescription>
            Atualize os atributos do requisito. As alterações serão persistidas no
            banco de dados.
          </DialogDescription>
        </DialogHeader>

        {eraAprovado && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              Este requisito está com status <strong>"Aprovado"</strong>. Ao salvar
              esta edição o status retornará automaticamente para{" "}
              <strong>"Pendente"</strong> e o cliente precisará revalidá-lo
              (RN004).
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-codigo">Código *</Label>
            <Input
              id="edit-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex.: RF01"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descricao">Descrição *</Label>
            <Textarea
              id="edit-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRequisito)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Funcional">Funcional</SelectItem>
                <SelectItem value="Não Funcional">Não Funcional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
