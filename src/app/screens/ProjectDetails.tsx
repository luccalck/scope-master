import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  MoreVertical,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  UserMinus,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  gerarDocumentacaoPdf,
  SemRequisitosAprovadosError,
  FalhaExportacaoError,
} from "../lib/documentExport";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EditProjectModal } from "../components/EditProjectModal";
import { AddMemberModal } from "../components/AddMemberModal";
import { CreateRequirementModal } from "../components/CreateRequirementModal";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import {
  fetchProjetoCompleto,
  excluirProjeto,
  removerMembroProjeto,
  notificarMembrosProjeto,
} from "../lib/api";
import type { ProjetoCompleto } from "../lib/types";

const statusColors: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-700 border-green-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Rejeitado: "bg-red-100 text-red-700 border-red-200",
};

const tipoColors: Record<string, string> = {
  Funcional: "bg-muted text-foreground border-border",
  "Não Funcional": "bg-purple-100 text-purple-700 border-purple-200",
};

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjetoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id_usuario: string;
    nome: string;
  } | null>(null);

  // RF10 — Geração de Documentação
  const [exportando, setExportando] = useState(false);

  // RF06 — Criar requisito direto do painel do projeto
  const [isCreateReqModalOpen, setIsCreateReqModalOpen] = useState(false);

  /**
   * Carrega o projeto completo.
   * @param silencioso quando true, não mostra o spinner — usado em refreshes
   *                   após criar/editar para evitar o "flash" da tela.
   */
  const carregarProjeto = async (silencioso = false) => {
    if (!id) return;
    try {
      if (!silencioso) setLoading(true);
      const data = await fetchProjetoCompleto(id);
      setProject(data);
    } catch (err) {
      console.error("Erro ao carregar projeto:", err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    carregarProjeto();
  }, [id]);

  // Obter dados do usuário logado
  const userDataString = localStorage.getItem("scopemaster_user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const currentUserId = userData?.id || "";
  const currentUserName = userData?.name || "Alguém";
  const currentUserRole = userData?.role || "";
  const isAdmin = currentUserRole === "Administrador";

  const handleExcluirProjeto = async () => {
    if (!id || !project) return;
    // Notificar membros antes de excluir
    await notificarMembrosProjeto(
      id,
      currentUserId,
      `${currentUserName} excluiu o projeto "${project.nome}".`,
      "projeto_excluido"
    );
    await excluirProjeto(id);
    navigate("/projects");
  };

  /**
   * RF10 — Geração de Documentação Automática
   * Trata os fluxos alternativos:
   *  - A6: ausência de requisitos aprovados
   *  - A7: falha na exportação
   */
  const handleGerarDocumentacao = async () => {
    if (!id) return;
    try {
      setExportando(true);
      const arquivo = await gerarDocumentacaoPdf(id);
      toast.success(`Documento gerado: ${arquivo}`);
    } catch (err) {
      if (err instanceof SemRequisitosAprovadosError) {
        toast.warning(err.message);
      } else if (err instanceof FalhaExportacaoError) {
        toast.error(err.message);
      } else {
        console.error("Erro inesperado ao gerar documentação:", err);
        toast.error("Erro inesperado ao gerar a documentação.");
      }
    } finally {
      setExportando(false);
    }
  };

  const handleRemoverMembro = async () => {
    if (!id || !memberToRemove || !project) return;
    await removerMembroProjeto(id, memberToRemove.id_usuario);
    await notificarMembrosProjeto(
      id,
      currentUserId,
      `${currentUserName} removeu ${memberToRemove.nome} do projeto "${project.nome}".`,
      "membro_removido"
    );
    carregarProjeto();
  };

  const getInitials = (nome: string) =>
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando projeto...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-foreground">
            Projeto não encontrado
          </h2>
          <p className="text-muted-foreground mt-2">
            O projeto que você está procurando não existe.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Projetos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const reqs = project.requisitos || [];
  const membros = project.membros || [];
  const aprovados = reqs.filter((r) => r.status_validacao === "Aprovado").length;
  const pendentes = reqs.filter((r) => r.status_validacao === "Pendente").length;
  const rejeitados = reqs.filter((r) => r.status_validacao === "Rejeitado").length;
  const progress =
    reqs.length > 0 ? Math.round((aprovados / reqs.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {project.nome}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.descricao || "Sem descrição"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* RF06 — Novo Requisito direto neste projeto (RN006: oculto para Cliente) */}
          {currentUserRole !== "Cliente" && (
            <Button
              variant="outline"
              onClick={() => setIsCreateReqModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Requisito
            </Button>
          )}

          {/* RF10 — Gerar Documentação Automática */}
          <Button
            onClick={handleGerarDocumentacao}
            disabled={exportando}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {exportando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Gerar Documentação
              </>
            )}
          </Button>

          {/* Botão Gerenciar Equipe — Abre modal de adicionar membro */}
          <Button
            variant="outline"
            onClick={() => setIsAddMemberModalOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Equipe
          </Button>

          {/* Menu de ações do projeto */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Modificar — Amber */}
              <DropdownMenuItem
                onClick={() => setIsEditModalOpen(true)}
                className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modificar Projeto
              </DropdownMenuItem>

              {/* Excluir — Vermelho (apenas Administrador) */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Projeto
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-muted">
                <FileText className="h-6 w-6 text-foreground" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {reqs.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Requisitos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {aprovados}
              </div>
              <div className="text-sm text-muted-foreground">Aprovados</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {membros.length}
              </div>
              <div className="text-sm text-muted-foreground">Membros da Equipe</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-amber-100">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {progress}%
              </div>
              <div className="text-sm text-muted-foreground">Aprovação</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Informações do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Criado em:{" "}
                  {new Date(project.data_criacao).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {aprovados} de {reqs.length} requisitos aprovados
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso de Aprovação</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Tabs defaultValue="requirements" className="mt-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="requirements">Requisitos</TabsTrigger>
                <TabsTrigger value="activity">Atividade</TabsTrigger>
              </TabsList>
              <TabsContent value="requirements" className="mt-4 space-y-3">
                {reqs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum requisito cadastrado para este projeto.
                  </p>
                ) : (
                  reqs.map((req) => (
                    <Link
                      key={req.id_requisito}
                      to={`/requirements/${req.id_requisito}`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border shadow-sm hover:border-foreground/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-foreground">
                            {req.codigo}
                          </span>
                          <Badge
                            variant="outline"
                            className={tipoColors[req.tipo] || ""}
                          >
                            {req.tipo}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              statusColors[req.status_validacao] || ""
                            }
                          >
                            {req.status_validacao}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {req.descricao}
                        </h4>
                      </div>
                    </Link>
                  ))
                )}
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Atividades recentes aparecerão aqui
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Equipe do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {membros.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro associado.
                  </p>
                ) : (
                  membros.map((member, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-foreground">
                          {member.usuario
                            ? getInitials(member.usuario.nome)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {member.usuario?.nome || "Usuário desconhecido"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.papel_no_projeto}
                        </p>
                      </div>
                      {/* Botão de remover membro */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setMemberToRemove({
                            id_usuario: member.id_usuario,
                            nome: member.usuario?.nome || "Usuário desconhecido",
                          });
                          setIsRemoveMemberDialogOpen(true);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setIsAddMemberModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Membro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <EditProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={project}
        onSaved={carregarProjeto}
      />

      <AddMemberModal
        open={isAddMemberModalOpen}
        onOpenChange={setIsAddMemberModalOpen}
        projectId={project.id_projeto}
        currentMemberIds={membros.map((m) => m.id_usuario)}
        onAdded={carregarProjeto}
      />

      {/* RF06 — Modal de criação de requisito atrelado ao projeto atual */}
      <CreateRequirementModal
        open={isCreateReqModalOpen}
        onOpenChange={setIsCreateReqModalOpen}
        preselectedProjectId={project.id_projeto}
        onCreated={() => {
          toast.success("Requisito criado com sucesso!");
          carregarProjeto(true); // refresh silencioso, sem flash
        }}
      />

      {/* Dialog de exclusão — apenas Administrador */}
      {isAdmin && (
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Excluir Projeto"
          description={`Tem certeza que deseja excluir o projeto "${project.nome}"? Todos os ${reqs.length} requisito(s) e ${membros.length} membro(s) associados também serão removidos. Esta ação não pode ser desfeita.`}
          onConfirm={handleExcluirProjeto}
        />
      )}

      <ConfirmDeleteDialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
        title="Remover Membro"
        description={
          memberToRemove
            ? `Tem certeza que deseja remover "${memberToRemove.nome}" deste projeto?`
            : ""
        }
        onConfirm={handleRemoverMembro}
      />
    </div>
  );
}
