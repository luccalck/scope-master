import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { EditProjectModal } from "../components/EditProjectModal";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { fetchProjetosComDetalhes, excluirProjeto, notificarMembrosProjeto, fetchProjetosDoUsuario } from "../lib/api";

interface ProjetoListItem {
  id_projeto: string;
  nome: string;
  descricao: string | null;
  data_criacao: string;
  totalRequisitos: number;
  aprovados: number;
  pendentes: number;
  rejeitados: number;
  membros: {
    id_projeto: string;
    id_usuario: string;
    papel_no_projeto: string;
    usuario?: {
      id_usuario: string;
      nome: string;
      email: string;
      perfil: string;
    };
  }[];
}

export function Projects() {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjetoListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);

  // Edit modal state
  const [editProject, setEditProject] = useState<ProjetoListItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete dialog state
  const [deleteProject, setDeleteProject] = useState<ProjetoListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const carregarProjetos = async () => {
    try {
      setLoading(true);
      const data = await fetchProjetosComDetalhes();
      setProjects(data);
    } catch (err) {
      console.error("Erro ao carregar projetos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Obter dados do usuário logado
  const userDataString = localStorage.getItem("scopemaster_user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const currentUserId = userData?.id || "";
  const currentUserName = userData?.name || "Alguém";
  const currentUserRole = userData?.role || "";
  const isCliente = currentUserRole === "Cliente";
  const isDesenvolvedor = currentUserRole === "Desenvolvedor";
  const isAdmin = currentUserRole === "Administrador";

  useEffect(() => {
    carregarProjetos();
    // Buscar projetos em que o usuário participa
    if (currentUserId) {
      fetchProjetosDoUsuario(currentUserId).then(setMyProjectIds).catch(console.error);
    }
    // Cliente e Desenvolvedor sempre veem apenas seus projetos
    if (isCliente || isDesenvolvedor) {
      setShowOnlyMine(true);
    }
  }, []);

  const handleExcluir = async () => {
    if (!deleteProject) return;
    // Notificar membros antes de excluir
    await notificarMembrosProjeto(
      deleteProject.id_projeto,
      currentUserId,
      `${currentUserName} excluiu o projeto "${deleteProject.nome}".`,
      "projeto_excluido"
    );
    await excluirProjeto(deleteProject.id_projeto);
    carregarProjetos();
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParticipation = showOnlyMine
      ? myProjectIds.includes(p.id_projeto)
      : true;
    return matchesSearch && matchesParticipation;
  });

  const getInitials = (nome: string) =>
    nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getProgress = (p: ProjetoListItem) =>
    p.totalRequisitos > 0
      ? Math.round((p.aprovados / p.totalRequisitos) * 100)
      : 0;

  const totalReqs = projects.reduce((acc, p) => acc + p.totalRequisitos, 0);
  const totalMembros = new Set(
    projects.flatMap((p) => p.membros.map((m) => m.id_usuario))
  ).size;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + getProgress(p), 0) / projects.length
        )
      : 0;

  // Dropdown menu reutilizável para cada projeto
  const renderDropdown = (project: ProjetoListItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Visualizar — Azul */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${project.id_projeto}`);
          }}
          className="text-foreground focus:text-foreground focus:bg-muted cursor-pointer"
        >
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>

        {/* Modificar — Amarelo/Amber */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setEditProject(project);
            setIsEditModalOpen(true);
          }}
          className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Modificar
        </DropdownMenuItem>

        {/* Excluir — Vermelho (apenas Administrador) */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeleteProject(project);
                setIsDeleteDialogOpen(true);
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando projetos...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e acompanhe todos os seus projetos
          </p>
        </div>
        <Button
          className="bg-foreground hover:bg-foreground/90 text-background w-full sm:w-auto"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-muted dark:bg-opacity-20">
                <LayoutGrid className="h-6 w-6 text-foreground dark:brightness-150" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {projects.length}
              </div>
              <div className="text-sm text-muted-foreground">Projetos Ativos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-green-100 dark:bg-opacity-20">
                <FileText className="h-6 w-6 text-green-600 dark:brightness-150" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {totalReqs}
              </div>
              <div className="text-sm text-muted-foreground">Total de Requisitos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-purple-100 dark:bg-opacity-20">
                <Users className="h-6 w-6 text-purple-600 dark:brightness-150" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {totalMembros}
              </div>
              <div className="text-sm text-muted-foreground">Membros da Equipe</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-3 bg-amber-100 dark:bg-opacity-20">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:brightness-150" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-foreground">
                {avgProgress}%
              </div>
              <div className="text-sm text-muted-foreground">Aprovação Média</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar projetos..."
              className="pl-10 bg-background border-border text-foreground w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Botão Participação — apenas Administrador */}
          {isAdmin && (
            <Button
              variant={showOnlyMine ? "default" : "outline"}
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className={`w-full sm:w-auto ${showOnlyMine
                ? "bg-foreground hover:bg-foreground/90 text-background"
                : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Participação
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
            className={
              view === "grid"
                ? "bg-foreground hover:bg-foreground/90 text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            }
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
            className={
              view === "list"
                ? "bg-foreground hover:bg-foreground/90 text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            }
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const progress = getProgress(project);

            return (
              <Card
                key={project.id_projeto}
                className="border-border shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card"
                onClick={() => navigate(`/projects/${project.id_projeto}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {project.nome}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.descricao || "Sem descrição"}
                    </p>
                  </div>
                  {renderDropdown(project)}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Aprovação</span>
                      <span className="font-medium text-foreground">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>
                        {project.aprovados}/{project.totalRequisitos} requisitos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex -space-x-2">
                      {project.membros.slice(0, 4).map((member, i) => (
                        <Avatar
                          key={i}
                          className="h-8 w-8 border-2 border-background"
                        >
                          <AvatarFallback className="bg-muted text-foreground text-xs">
                            {member.usuario
                              ? getInitials(member.usuario.nome)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.membros.length > 4 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                          +{project.membros.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.data_criacao).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border shadow-sm bg-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredProjects.map((project) => {
                const progress = getProgress(project);

                return (
                  <div
                    key={project.id_projeto}
                    className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id_projeto}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {project.nome}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {project.descricao || "Sem descrição"}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            <span>
                              {project.aprovados}/{project.totalRequisitos}{" "}
                              requisitos
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Criado em{" "}
                              {new Date(project.data_criacao).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{project.membros.length} membros</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">
                            Aprovação
                          </div>
                          <div className="text-2xl font-semibold text-foreground">
                            {progress}%
                          </div>
                        </div>
                        <div className="flex -space-x-2">
                          {project.membros.slice(0, 3).map((member, i) => (
                            <Avatar
                              key={i}
                              className="h-8 w-8 border-2 border-background"
                            >
                              <AvatarFallback className="bg-muted text-foreground text-xs">
                                {member.usuario
                                  ? getInitials(member.usuario.nome)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {project.membros.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                              +{project.membros.length - 3}
                            </div>
                          )}
                        </div>
                        {renderDropdown(project)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) carregarProjetos();
        }}
      />

      <EditProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={editProject}
        onSaved={carregarProjetos}
      />

      {/* Dialog de exclusão — apenas Administrador */}
      {isAdmin && (
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Excluir Projeto"
          description={
            deleteProject
              ? `Tem certeza que deseja excluir o projeto "${deleteProject.nome}"? Todos os ${deleteProject.totalRequisitos} requisito(s) e ${deleteProject.membros.length} membro(s) associados também serão removidos. Esta ação não pode ser desfeita.`
              : ""
          }
          onConfirm={handleExcluir}
        />
      )}
    </div>
  );
}
