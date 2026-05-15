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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Loader2, Search, UserPlus } from "lucide-react";
import { fetchUsuarios, adicionarMembroProjeto, notificarMembrosProjeto } from "../lib/api";
import type { Usuario } from "../lib/types";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentMemberIds: string[]; // IDs de membros já no projeto
  onAdded: () => void;
}

export function AddMemberModal({
  open,
  onOpenChange,
  projectId,
  currentMemberIds,
  onAdded,
}: AddMemberModalProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [papel, setPapel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      const carregar = async () => {
        try {
          setLoadingUsuarios(true);
          const data = await fetchUsuarios();
          setUsuarios(data);
        } catch (err) {
          console.error("Erro ao carregar usuários:", err);
        } finally {
          setLoadingUsuarios(false);
        }
      };
      carregar();
      // Reset
      setSelectedUserId("");
      setPapel("");
      setError("");
      setSearchTerm("");
    }
  }, [open]);

  const getInitials = (nome: string) =>
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Filtrar usuários que NÃO estão no projeto e pelo termo de busca
  const availableUsers = usuarios.filter(
    (u) =>
      !currentMemberIds.includes(u.id_usuario) &&
      u.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = usuarios.find((u) => u.id_usuario === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUserId) {
      setError("Selecione um usuário.");
      return;
    }
    if (!papel.trim()) {
      setError("Informe o papel do membro no projeto.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adicionarMembroProjeto(projectId, selectedUserId, papel.trim());

      // Notificar membros do projeto
      const userDataString = localStorage.getItem("scopemaster_user");
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const currentUserId = userData?.id || "";
      const currentUserName = userData?.name || "Alguém";
      const nomeUsuarioAdd = usuarios.find(u => u.id_usuario === selectedUserId)?.nome || "Um novo membro";

      await notificarMembrosProjeto(
        projectId,
        currentUserId,
        `${currentUserName} adicionou ${nomeUsuarioAdd} ao projeto.`,
        "membro_adicionado"
      );

      onOpenChange(false);
      onAdded();
    } catch (err) {
      console.error("Erro ao adicionar membro:", err);
      setError("Erro ao adicionar membro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
              <UserPlus className="h-5 w-5 text-foreground" />
            </div>
            Adicionar Membro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Buscar usuário */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Buscar Usuário
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                className="pl-10 border-border shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Lista de usuários disponíveis */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Selecionar Usuário
            </Label>
            {loadingUsuarios ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border shadow-sm rounded-lg">
                {searchTerm
                  ? "Nenhum usuário encontrado com esse nome."
                  : "Todos os usuários já são membros deste projeto."}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border shadow-sm rounded-lg p-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.id_usuario}
                    onClick={() => setSelectedUserId(user.id_usuario)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedUserId === user.id_usuario
                        ? "bg-muted border border-foreground/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className={`text-xs ${
                          selectedUserId === user.id_usuario
                            ? "bg-muted text-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getInitials(user.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {user.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {user.perfil}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Papel no projeto */}
          <div className="space-y-2">
            <Label htmlFor="papel" className="text-sm font-medium text-foreground">
              Papel no Projeto
            </Label>
            <Input
              id="papel"
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              placeholder="Ex: Desenvolvedor Backend, Product Owner, QA..."
              className="border-border shadow-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Resumo do selecionado */}
          {selectedUser && (
            <div className="bg-muted border border-border rounded-lg p-3 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-foreground text-xs">
                  {getInitials(selectedUser.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedUser.nome}
                </p>
                <p className="text-xs text-foreground">{selectedUser.email}</p>
              </div>
            </div>
          )}

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
              disabled={isSubmitting || !selectedUserId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Membro"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
