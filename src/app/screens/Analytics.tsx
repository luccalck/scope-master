import { useState, useEffect } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Lightbulb,
  FileCheck,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchEstatisticas } from "../lib/api";
import type { Requisito, Projeto, Usuario } from "../lib/types";

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequisitos: 0,
    aprovados: 0,
    pendentes: 0,
    rejeitados: 0,
    totalProjetos: 0,
    totalUsuarios: 0,
  });
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await fetchEstatisticas();
        setStats({
          totalRequisitos: data.totalRequisitos,
          aprovados: data.aprovados,
          pendentes: data.pendentes,
          rejeitados: data.rejeitados,
          totalProjetos: data.totalProjetos,
          totalUsuarios: data.totalUsuarios,
        });
        setRequisitos(data.requisitos);
        setProjetos(data.projetos);
        setUsuarios(data.usuarios);
      } catch (err) {
        console.error("Erro ao carregar analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando relatórios...</span>
      </div>
    );
  }

  // Dados para o gráfico de distribuição por status
  const statusDistribution = [
    { name: "Aprovados", value: stats.aprovados, color: "#10b981" },
    { name: "Pendentes", value: stats.pendentes, color: "#f59e0b" },
    { name: "Rejeitados", value: stats.rejeitados, color: "#ef4444" },
  ];

  // Dados para o gráfico de requisitos por projeto
  const reqsPorProjeto = projetos.map((p) => {
    const reqs = requisitos.filter((r) => r.id_projeto === p.id_projeto);
    return {
      name: p.nome.length > 15 ? p.nome.slice(0, 15) + "..." : p.nome,
      total: reqs.length,
      aprovados: reqs.filter((r) => r.status_validacao === "Aprovado").length,
      pendentes: reqs.filter((r) => r.status_validacao === "Pendente").length,
      rejeitados: reqs.filter((r) => r.status_validacao === "Rejeitado").length,
    };
  });

  // Dados dos usuários por perfil
  const perfilCount = {
    Administrador: usuarios.filter((u) => u.perfil === "Administrador").length,
    Desenvolvedor: usuarios.filter((u) => u.perfil === "Desenvolvedor").length,
    Cliente: usuarios.filter((u) => u.perfil === "Cliente").length,
  };

  const perfilDistribution = [
    { name: "Administradores", value: perfilCount.Administrador, color: "#0a0a0a" },
    { name: "Desenvolvedores", value: perfilCount.Desenvolvedor, color: "#10b981" },
    { name: "Clientes", value: perfilCount.Cliente, color: "#f59e0b" },
  ];

  // Requisitos recentes
  const reqsFuncionais = requisitos.filter((r) => r.tipo === "Funcional").length;
  const reqsNaoFuncionais = requisitos.filter(
    (r) => r.tipo === "Não Funcional"
  ).length;

  const statCards = [
    {
      name: "Total de Requisitos",
      value: stats.totalRequisitos.toString(),
      subtitle: "Cadastrados no sistema",
      icon: Lightbulb,
    },
    {
      name: "Requisitos Aprovados",
      value: stats.aprovados.toString(),
      subtitle: `${stats.totalRequisitos > 0 ? Math.round((stats.aprovados / stats.totalRequisitos) * 100) : 0}% do total`,
      icon: FileCheck,
    },
    {
      name: "Projetos Ativos",
      value: stats.totalProjetos.toString(),
      subtitle: "Projetos cadastrados",
      icon: PlayCircle,
    },
    {
      name: "Usuários",
      value: stats.totalUsuarios.toString(),
      subtitle: `${perfilCount.Desenvolvedor} devs, ${perfilCount.Administrador} admins, ${perfilCount.Cliente} clientes`,
      icon: Clock,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Relatórios e Métricas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe estatísticas de requisitos, projetos e equipe
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-foreground hover:bg-foreground/90 text-background">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.name} className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground block mb-1">
                      {stat.name}
                    </span>
                    <div className="text-2xl font-semibold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50">
                    <IconComponent className="h-5 w-5 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Requisitos por Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reqsPorProjeto.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reqsPorProjeto}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: "11px" }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="aprovados" fill="#10b981" name="Aprovados" />
                  <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                  <Bar dataKey="rejeitados" fill="#ef4444" name="Rejeitados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Sem dados para exibir.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Requisitos Recentes */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Todos os Requisitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requisitos.map((req) => {
              const projetoNome =
                projetos.find((p) => p.id_projeto === req.id_projeto)?.nome ||
                "Desconhecido";

              return (
                <div
                  key={req.id_requisito}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border shadow-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {req.codigo}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground mb-1">
                      {req.descricao}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Projeto: {projetoNome}</span>
                      <span>•</span>
                      <span>{req.tipo}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      req.tipo === "Funcional"
                        ? "bg-muted text-foreground border-border"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }
                  >
                    {req.tipo}
                  </Badge>
                  {req.status_validacao === "Aprovado" ? (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      disabled
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovado
                    </Button>
                  ) : req.status_validacao === "Rejeitado" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                      disabled
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitado
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      disabled
                    >
                      Pendente
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Resumo por Tipo de Requisito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border shadow-sm text-center">
                <div className="text-3xl font-bold text-foreground">
                  {reqsFuncionais}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Requisitos Funcionais
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border shadow-sm text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {reqsNaoFuncionais}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Requisitos Não Funcionais
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Equipe por Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={perfilDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {perfilDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {usuarios.map((user) => (
                <div
                  key={user.id_usuario}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-foreground font-medium text-xs">
                    {user.nome
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">
                      {user.nome}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.perfil}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
