import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  MoreVertical,
  ArrowUpDown,
  Loader2,
  UserCheck,
} from "lucide-react";
import { Input } from "../components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import { Link } from "react-router";
import { CreateRequirementModal } from "../components/CreateRequirementModal";
import { fetchRequisitosComProjeto, excluirRequisito, fetchProjetosDoUsuario } from "../lib/api";
import type { Requisito } from "../lib/types";

const statusColors: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-700 border-green-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Rejeitado: "bg-red-100 text-red-700 border-red-200",
};

const tipoColors: Record<string, string> = {
  Funcional: "bg-muted text-foreground border-border",
  "Não Funcional": "bg-purple-100 text-purple-700 border-purple-200",
};

type RequisitoComProjeto = Requisito & { projeto_nome: string };

export function Requirements() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<RequisitoComProjeto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [myProjectIds, setMyProjectIds] = useState<string[]>([]);

  // Obter dados do usuário logado
  const userDataString = localStorage.getItem("scopemaster_user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const currentUserId = userData?.id || "";
  const currentUserRole = userData?.role || "";
  const isCliente = currentUserRole === "Cliente";

  const carregarRequisitos = async () => {
    try {
      setLoading(true);
      const data = await fetchRequisitosComProjeto();
      setRequirements(data);
    } catch (err) {
      console.error("Erro ao carregar requisitos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRequisitos();
    // Buscar projetos do usuário
    if (currentUserId) {
      fetchProjetosDoUsuario(currentUserId).then(setMyProjectIds).catch(console.error);
    }
    // Cliente sempre vê apenas seus requisitos
    if (isCliente) {
      setShowOnlyMine(true);
    }
  }, []);

  const handleExcluir = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este requisito?")) {
      try {
        await excluirRequisito(id);
        carregarRequisitos();
      } catch (err) {
        console.error("Erro ao excluir requisito:", err);
      }
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch =
      req.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.projeto_nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || req.status_validacao === statusFilter;

    const matchesTipo =
      tipoFilter === "all" || req.tipo === tipoFilter;

    const matchesParticipation = showOnlyMine
      ? myProjectIds.includes(req.id_projeto)
      : true;

    return matchesSearch && matchesStatus && matchesTipo && matchesParticipation;
  });

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === filteredRequirements.length
        ? []
        : filteredRequirements.map((req) => req.id_requisito)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando requisitos...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Requisitos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e acompanhe todos os requisitos do projeto
          </p>
        </div>
        {/* RN006 — Cliente não pode criar requisitos */}
        {!isCliente && (
          <Button
            className="bg-foreground hover:bg-foreground/90 text-background w-full sm:w-auto flex-shrink-0"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Requisito
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1 lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar requisitos..."
              className="pl-10 bg-background border-border text-foreground w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-background border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Funcional">Funcional</SelectItem>
              <SelectItem value="Não Funcional">Não Funcional</SelectItem>
            </SelectContent>
          </Select>
          {/* Botão Participação — só para Admin/Dev */}
          {!isCliente && (
            <Button
              variant={showOnlyMine ? "default" : "outline"}
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className={`col-span-2 sm:col-auto ${showOnlyMine
                ? "bg-foreground hover:bg-foreground/90 text-background"
                : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Participação
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {filteredRequirements.length}
          </span>{" "}
          requisitos
        </p>
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selecionados
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-red-600 hover:text-red-700 hover:bg-red-500/10"
              onClick={async () => {
                if (
                  confirm(
                    `Tem certeza que deseja excluir ${selectedRows.length} requisitos?`
                  )
                ) {
                  for (const id of selectedRows) {
                    await excluirRequisito(id);
                  }
                  setSelectedRows([]);
                  carregarRequisitos();
                }
              }}
            >
              Excluir
            </Button>
          </div>
        )}
      </div>

      {/* Lista em CARDS — visível abaixo de lg (mobile e tablet) */}
      <div className="lg:hidden space-y-3">
        {filteredRequirements.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            Nenhum requisito encontrado.
          </div>
        ) : (
          filteredRequirements.map((req) => (
            <Link
              key={req.id_requisito}
              to={`/requirements/${req.id_requisito}`}
              className="block rounded-lg border border-border bg-card p-4 hover:border-foreground/30 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="font-medium text-foreground text-sm">{req.codigo}</span>
                  <Badge variant="outline" className={tipoColors[req.tipo] || ""}>
                    {req.tipo}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={statusColors[req.status_validacao] || ""}
                  >
                    {req.status_validacao}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-foreground/90 break-words mb-2">
                {req.descricao.length > 120 ? req.descricao.slice(0, 120) + "..." : req.descricao}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {req.projeto_nome}
              </p>
            </Link>
          ))
        )}
      </div>

      {/* Tabela — visível somente em lg+ */}
      <div className="hidden lg:block rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredRequirements.length > 0 &&
                    selectedRows.length === filteredRequirements.length
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-muted-foreground">
                <Button variant="ghost" size="sm" className="h-8 -ml-3">
                  Código
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-muted-foreground">
                <Button variant="ghost" size="sm" className="h-8 -ml-3">
                  Descrição
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-muted-foreground">Projeto</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequirements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum requisito encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequirements.map((req) => (
                <TableRow
                  key={req.id_requisito}
                  className="border-border hover:bg-muted"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(req.id_requisito)}
                      onCheckedChange={() => toggleRow(req.id_requisito)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/requirements/${req.id_requisito}`}
                      className="font-medium text-foreground hover:text-foreground/80"
                    >
                      {req.codigo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/requirements/${req.id_requisito}`}
                      className="font-medium text-foreground hover:text-foreground"
                    >
                      {req.descricao.length > 80
                        ? req.descricao.slice(0, 80) + "..."
                        : req.descricao}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {req.projeto_nome}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={tipoColors[req.tipo] || ""}
                    >
                      {req.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[req.status_validacao] || ""}
                    >
                      {req.status_validacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/requirements/${req.id_requisito}`}>
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleExcluir(req.id_requisito)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateRequirementModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) carregarRequisitos();
        }}
      />
    </div>
  );
}
