import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { CreateRequirementModal } from "../components/CreateRequirementModal";
import { fetchEstatisticas } from "../lib/api";
import { toast } from "sonner";
import type { Requisito, Projeto } from "../lib/types";

const statusColors: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-700 border-green-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Rejeitado: "bg-red-100 text-red-700 border-red-200",
};

export function Dashboard() {
  const [isCreateRequirementModalOpen, setIsCreateRequirementModalOpen] = useState(false);
  const userDataString = localStorage.getItem("scopemaster_user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const isCliente = userData?.role === "Cliente";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequisitos: 0,
    aprovados: 0,
    pendentes: 0,
    rejeitados: 0,
    totalProjetos: 0,
    totalUsuarios: 0,
  });
  const [requisitos, setRequisitos] = useState<(Requisito & { projeto_nome?: string })[]>([]);
  const [projetos, setProjetos] = useState<(Projeto & { totalReqs: number; aprovadosReqs: number })[]>([]);

  /**
   * Carrega os dados do dashboard.
   * @param silencioso quando true, NÃO mostra o spinner full-screen — usado em
   *                   refreshes de fundo após criar/editar para evitar o "flash".
   */
  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const data = await fetchEstatisticas();

      setStats({
        totalRequisitos: data.totalRequisitos,
        aprovados: data.aprovados,
        pendentes: data.pendentes,
        rejeitados: data.rejeitados,
        totalProjetos: data.totalProjetos,
        totalUsuarios: data.totalUsuarios,
      });

      // Mapear requisitos com nome do projeto
      const projetoMap = new Map(data.projetos.map((p) => [p.id_projeto, p.nome]));
      const reqsComProjeto = data.requisitos.map((r) => ({
        ...r,
        projeto_nome: projetoMap.get(r.id_projeto) || "Desconhecido",
      }));
      setRequisitos(reqsComProjeto);

      // Mapear projetos com contagem de requisitos
      const projetosComReqs = data.projetos.map((p) => {
        const reqs = data.requisitos.filter((r) => r.id_projeto === p.id_projeto);
        return {
          ...p,
          totalReqs: reqs.length,
          aprovadosReqs: reqs.filter((r) => r.status_validacao === "Aprovado").length,
        };
      });
      setProjetos(projetosComReqs);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total de Requisitos",
      value: stats.totalRequisitos.toString(),
      icon: FileText,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      name: "Aprovados",
      value: stats.aprovados.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Pendentes",
      value: stats.pendentes.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      name: "Rejeitados",
      value: stats.rejeitados.toString(),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Painel Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bem-vindo de volta! Aqui está uma visão geral dos seus requisitos.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Ver Relatórios
            </Link>
          </Button>
          {/* RN006 — Cliente não pode criar requisitos */}
          {!isCliente && (
            <Button
              className="bg-foreground hover:bg-foreground/90 text-background"
              onClick={() => setIsCreateRequirementModalOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Novo Requisito
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-3 ${stat.bgColor} dark:bg-opacity-20`}>
                    <Icon className={`h-6 w-6 ${stat.color} dark:brightness-150`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.name}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Requisitos Recentes */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Requisitos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/requirements">
                Ver Todos
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requisitos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum requisito cadastrado.
                </p>
              ) : (
                requisitos.slice(0, 5).map((req) => (
                  <Link
                    key={req.id_requisito}
                    to={`/requirements/${req.id_requisito}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {req.codigo}
                        </span>
                        <Badge variant="outline" className={
                          req.tipo === "Funcional"
                            ? "bg-muted text-foreground border-border"
                            : "bg-purple-100 text-purple-700 border-purple-200"
                        }>
                          {req.tipo}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusColors[req.status_validacao] || ""}
                        >
                          {req.status_validacao}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {req.descricao}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{req.projeto_nome}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem>Arquivar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projetos Ativos */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Projetos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projetos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum projeto cadastrado.
                </p>
              ) : (
                projetos.map((projeto) => {
                  const progress =
                    projeto.totalReqs > 0
                      ? Math.round((projeto.aprovadosReqs / projeto.totalReqs) * 100)
                      : 0;

                  return (
                    <div key={projeto.id_projeto} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">
                            {projeto.nome}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {projeto.totalReqs} requisitos
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                        >
                          {progress}% aprovado
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium text-foreground">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/projects">Ver Todos os Projetos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <CreateRequirementModal
        open={isCreateRequirementModalOpen}
        onOpenChange={setIsCreateRequirementModalOpen}
        onCreated={() => {
          // Toast amigável + reload silencioso (sem flash)
          toast.success("Requisito criado com sucesso!");
          carregarDados(true);
        }}
      />
    </div>
  );
}
