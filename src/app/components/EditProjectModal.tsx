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
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Loader2, UserMinus, UserPlus, Search, Pencil } from "lucide-react";
import {
  atualizarProjeto,
  fetchUsuarios,
  fetchMembrosProjeto,
  adicionarMembroProjeto,
  removerMembroProjeto,
  notificarMembrosProjeto,
} from "../lib/api";
import type { Usuario, ProjetoUsuario } from "../lib/types";

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id_projeto: string;
    nome: string;
    descricao: string | null;
  } | null;
  onSaved: () => void;
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSaved,
}: EditProjectModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Membros
  const [membros, setMembros] = useState<(ProjetoUsuario & { usuario?: Usuario })[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [novoPapel, setNovoPapel] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // Obter dados do usuário logado
  const userDataString = localStorage.getItem("scopemaster_user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const currentUserId = userData?.id || "";
  const currentUserName = userData?.name || "Alguém";

  // Preencher campos quando o projeto mudar
  useEffect(() => {
    if (project && open) {
      setNome(project.nome);
      setDescricao(project.descricao || "");
      setShowAddMember(false);
      setSearchUser("");
      setNovoPapel("");
      setSelectedUserId("");
      carregarDados();
    }
  }, [project, open]);

  const carregarDados = async () => {
    if (!project) return;
    try {
      setLoadingMembros(true);
      const [membrosData, usuariosData] = await Promise.all([
        fetchMembrosProjeto(project.id_projeto),
        fetchUsuarios(),
      ]);
      setMembros(membrosData);
      setTodosUsuarios(usuariosData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoadingMembros(false);
    }
  };

  const getInitials = (nome: string) =>
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const usuariosDisponiveis = todosUsuarios.filter(
    (u) =>
      !membros.some((m) => m.id_usuario === u.id_usuario) &&
      u.nome.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleAdicionarMembro = async () => {
    if (!project || !selectedUserId || !novoPapel.trim()) return;
    try {
      setAddingMember(true);
      await adicionarMembroProjeto(project.id_projeto, selectedUserId, novoPapel.trim());

      // Criar notificação
      const nomeUsuarioAdd = todosUsuarios.find(u => u.id_usuario === selectedUserId)?.nome || "Um novo membro";
      await notificarMembrosProjeto(
        project.id_projeto,
        currentUserId,
        `${currentUserName} adicionou ${nomeUsuarioAdd} ao projeto "${project.nome}".`,
        "membro_adicionado"
      );

      setSelectedUserId("");
      setNovoPapel("");
      setShowAddMember(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao adicionar membro:", err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoverMembro = async (idUsuario: string) => {
    if (!project) return;
    const membroNome = membros.find(m => m.id_usuario === idUsuario)?.usuario?.nome || "Um membro";
    try {
      await removerMembroProjeto(project.id_projeto, idUsuario);

      await notificarMembrosProjeto(
        project.id_projeto,
        currentUserId,
        `${currentUserName} removeu ${membroNome} do projeto "${project.nome}".`,
        "membro_removido"
      );

      await carregarDados();
    } catch (err) {
      console.error("Erro ao remover membro:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nome.trim()) {
      setError("O nome do projeto é obrigatório.");
      return;
    }

    if (!project) return;

    try {
      setIsSubmitting(true);
      await atualizarProjeto(project.id_projeto, {
        nome: nome.trim(),
        descricao: descricao.trim(),
      });

      // Notificar membros sobre a edição
      await notificarMembrosProjeto(
        project.id_projeto,
        currentUserId,
        `${currentUserName} editou o projeto "${nome.trim()}".`,
        "projeto_editado"
      );

      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error("Erro ao atualizar projeto:", err);
      setError("Erro ao atualizar o projeto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100">
              <Pencil className="h-5 w-5 text-amber-600" />
            </div>
            Editar Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Nome do Projeto */}
          <div className="space-y-2">
            <Label htmlFor="editProjectName" className="text-sm font-medium text-foreground">
              Nome do Projeto
            </Label>
            <Input
              id="editProjectName"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do projeto"
              className="border-border shadow-sm"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="editDescription" className="text-sm font-medium text-foreground">
              Descrição
            </Label>
            <Textarea
              id="editDescription"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo e escopo do projeto"
              className="min-h-[100px] border-border shadow-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Membros da Equipe */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Membros da Equipe ({membros.length})
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-foreground/80"
                onClick={() => setShowAddMember(!showAddMember)}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                {showAddMember ? "Cancelar" : "Adicionar"}
              </Button>
            </div>

            {/* Adicionar membro inline */}
            {showAddMember && (
              <div className="border border-border bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar usuário por nome..."
                    className="pl-10 border-border shadow-sm bg-card text-card-foreground"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>

                {usuariosDisponiveis.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {usuariosDisponiveis.map((user) => (
                      <div
                        key={user.id_usuario}
                        onClick={() => setSelectedUserId(user.id_usuario)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm ${
                          selectedUserId === user.id_usuario
                            ? "bg-muted border border-foreground/30"
                            : "hover:bg-card text-card-foreground border border-transparent"
                        }`}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-muted text-foreground text-xs">
                            {getInitials(user.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{user.nome}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{user.perfil}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhum usuário disponível.
                  </p>
                )}

                {selectedUserId && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Papel no projeto (ex: Dev Backend)"
                      className="border-border shadow-sm bg-card text-card-foreground flex-1"
                      value={novoPapel}
                      onChange={(e) => setNovoPapel(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-foreground hover:bg-foreground/90 text-background"
                      onClick={handleAdicionarMembro}
                      disabled={addingMember || !novoPapel.trim()}
                    >
                      {addingMember ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Adicionar"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Lista de membros atuais */}
            {loadingMembros ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando membros...</span>
              </div>
            ) : membros.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border shadow-sm rounded-lg">
                Nenhum membro associado a este projeto.
              </p>
            ) : (
              <div className="space-y-2">
                {membros.map((member, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border shadow-sm group hover:border-gray-300"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {member.usuario
                          ? getInitials(member.usuario.nome)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {member.usuario?.nome || "Desconhecido"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.papel_no_projeto}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoverMembro(member.id_usuario)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
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
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
