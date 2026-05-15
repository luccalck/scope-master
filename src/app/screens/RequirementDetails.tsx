import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  MoreVertical,
  Calendar,
  Tag,
  CheckCircle2,
  Check,
  Loader2,
  XCircle,
  MessageSquareWarning,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import {
  fetchRequisitoPorId,
  atualizarStatusRequisito,
  notificarMembrosProjeto,
  excluirRequisito,
} from "../lib/api";
import { EditRequirementModal } from "../components/EditRequirementModal";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import type { RequisitoComProjeto, Requisito } from "../lib/types";

const statusColors: Record<string, string> = {
  Aprovado: "bg-green-100 text-green-700 border-green-200",
  Pendente: "bg-amber-100 text-amber-700 border-amber-200",
  Rejeitado: "bg-red-100 text-red-700 border-red-200",
};

const tipoColors: Record<string, string> = {
  Funcional: "bg-muted text-foreground border-border",
  "Não Funcional": "bg-purple-100 text-purple-700 border-purple-200",
};

export function RequirementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState<RequisitoComProjeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Dialog de rejeição (RN007 / A5)
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Edição (RF07) e exclusão (RF08)
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const userDataString = localStorage.getItem("scopemaster_user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const currentUserId: string = userData?.id || "";
  const currentUserName: string = userData?.name || "Cliente";
  const currentUserRole: string = userData?.role || "";

  // RN006 — Cliente não cria/edita/exclui requisitos
  const podeEditarOuExcluir = currentUserRole !== "Cliente";

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchRequisitoPorId(id);
        setRequirement(data);
      } catch (err) {
        console.error("Erro ao carregar requisito:", err);
        toast.error("Falha ao carregar o requisito.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  const handleAprovar = async () => {
    if (!requirement) return;
    try {
      setUpdating(true);
      const updated = await atualizarStatusRequisito(
        requirement.id_requisito,
        "Aprovado",
        null
      );
      setRequirement((prev) =>
        prev
          ? {
              ...prev,
              status_validacao: updated.status_validacao,
              feedback_validacao: updated.feedback_validacao,
            }
          : null
      );
      // Notificar o Analista responsável (RF09)
      if (requirement.id_projeto) {
        await notificarMembrosProjeto(
          requirement.id_projeto,
          currentUserId,
          `${currentUserName} aprovou o requisito ${requirement.codigo}.`,
          "requisito_aprovado"
        );
      }
      toast.success("Requisito aprovado com sucesso.");
    } catch (err) {
      console.error("Erro ao aprovar requisito:", err);
      toast.error("Falha ao aprovar o requisito.");
    } finally {
      setUpdating(false);
    }
  };

  const abrirDialogoRejeitar = () => {
    setFeedback("");
    setFeedbackError(null);
    setRejectOpen(true);
  };

  const handleRequisitoSalvo = (atualizado: Requisito) => {
    setRequirement((prev) => (prev ? { ...prev, ...atualizado } : prev));
    if (atualizado.status_validacao !== requirement?.status_validacao) {
      toast.info(
        'O status do requisito foi retornado para "Pendente" para nova validação (RN004).'
      );
    } else {
      toast.success("Requisito atualizado com sucesso.");
    }
  };

  const handleExcluirRequisito = async () => {
    if (!requirement) return;
    try {
      await excluirRequisito(requirement.id_requisito);
      if (requirement.id_projeto) {
        await notificarMembrosProjeto(
          requirement.id_projeto,
          currentUserId,
          `${currentUserName} excluiu o requisito ${requirement.codigo}.`,
          "requisito_excluido"
        );
      }
      toast.success("Requisito excluído.");
      navigate("/requirements");
    } catch (err) {
      console.error("Erro ao excluir requisito:", err);
      toast.error("Falha ao excluir o requisito.");
    }
  };

  const handleConfirmarRejeicao = async () => {
    if (!requirement) return;

    // A5 — Rejeição sem Justificativa
    if (!feedback.trim()) {
      setFeedbackError("A justificativa é obrigatória ao rejeitar um requisito.");
      return;
    }

    try {
      setUpdating(true);
      const updated = await atualizarStatusRequisito(
        requirement.id_requisito,
        "Rejeitado",
        feedback
      );
      setRequirement((prev) =>
        prev
          ? {
              ...prev,
              status_validacao: updated.status_validacao,
              feedback_validacao: updated.feedback_validacao,
            }
          : null
      );
      if (requirement.id_projeto) {
        await notificarMembrosProjeto(
          requirement.id_projeto,
          currentUserId,
          `${currentUserName} rejeitou o requisito ${requirement.codigo}. Justificativa: "${feedback.trim()}"`,
          "requisito_rejeitado"
        );
      }
      toast.success("Requisito rejeitado. Justificativa registrada.");
      setRejectOpen(false);
    } catch (err) {
      console.error("Erro ao rejeitar requisito:", err);
      const msg = err instanceof Error ? err.message : "Falha ao rejeitar o requisito.";
      setFeedbackError(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando requisito...</span>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-foreground">
            Requisito não encontrado
          </h2>
          <p className="text-muted-foreground mt-2">
            O requisito que você está procurando não existe.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/requirements">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Requisitos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAprovado = requirement.status_validacao === "Aprovado";
  const isRejeitado = requirement.status_validacao === "Rejeitado";
  const isPendente = requirement.status_validacao === "Pendente";

  // Botões de validação aparecem para Cliente (RF09) e também para Admin/Dev (papel operacional)
  const podeValidar = isPendente; // qualquer usuário autenticado pode validar nesta fase do protótipo

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/requirements" className="hover:text-foreground">
          Requisitos
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{requirement.codigo}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/requirements">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <span className="text-sm font-medium text-foreground">
              {requirement.codigo}
            </span>
            <Badge variant="outline" className={tipoColors[requirement.tipo] || ""}>
              {requirement.tipo}
            </Badge>
            <Badge
              variant="outline"
              className={statusColors[requirement.status_validacao] || ""}
            >
              {requirement.status_validacao}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 break-words">
            {requirement.descricao}
          </h1>
          {requirement.projeto && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Projeto: {requirement.projeto.nome}
              </span>
              {requirement.projeto.data_criacao && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Criado em{" "}
                    {new Date(requirement.projeto.data_criacao).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {podeValidar ? (
            <>
              <Button
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                onClick={handleAprovar}
                disabled={updating}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 flex-1 sm:flex-initial"
                onClick={abrirDialogoRejeitar}
                disabled={updating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          ) : isAprovado ? (
            <Button className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial" disabled>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovado
            </Button>
          ) : (
            <Button variant="outline" className="border-red-300 text-red-700 flex-1 sm:flex-initial" disabled>
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitado
            </Button>
          )}
          {podeEditarOuExcluir && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-border shadow-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Requisito
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Requisito
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Feedback de rejeição visível quando aplicável */}
      {isRejeitado && requirement.feedback_validacao && (
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-800">
              <MessageSquareWarning className="h-5 w-5" />
              Justificativa da Rejeição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-900 whitespace-pre-line">
              {requirement.feedback_validacao}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Descrição do Requisito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{requirement.descricao}</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Código
                  </label>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {requirement.codigo}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Tipo
                  </label>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {requirement.tipo}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    Status de Validação
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={statusColors[requirement.status_validacao] || ""}
                    >
                      {requirement.status_validacao}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">
                    ID do Requisito
                  </label>
                  <p className="text-sm font-mono text-muted-foreground mt-1">
                    {requirement.id_requisito.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Projeto
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {requirement.projeto?.nome || "Desconhecido"}
                </p>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Descrição do Projeto
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  {requirement.projeto?.descricao || "Sem descrição"}
                </p>
              </div>
              <Separator />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Data de Criação do Projeto
                </label>
                <p className="text-sm font-medium text-foreground mt-1">
                  {requirement.projeto
                    ? new Date(requirement.projeto.data_criacao).toLocaleDateString(
                        "pt-BR"
                      )
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="bg-muted text-foreground border-border shadow-sm"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {requirement.tipo}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-muted text-foreground border-border shadow-sm"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {requirement.codigo}
                </Badge>
                {requirement.projeto && (
                  <Badge
                    variant="outline"
                    className="bg-muted text-foreground border-border shadow-sm"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {requirement.projeto.nome}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de Rejeição com Justificativa Obrigatória — RN007 / A5 */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rejeitar requisito {requirement.codigo}</DialogTitle>
            <DialogDescription>
              Informe a justificativa da rejeição. A equipe responsável receberá esta
              mensagem para realizar os ajustes necessários.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="feedback">Justificativa *</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (feedbackError) setFeedbackError(null);
              }}
              placeholder="Explique o motivo da rejeição e o que precisa ser ajustado..."
              rows={5}
              className={feedbackError ? "border-red-400 focus-visible:ring-red-400" : ""}
            />
            {feedbackError && (
              <p className="text-sm text-red-600">{feedbackError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmarRejeicao}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>Confirmar Rejeição</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RF07 — Edição de Requisito */}
      <EditRequirementModal
        open={editOpen}
        onOpenChange={setEditOpen}
        requirement={requirement}
        onSaved={handleRequisitoSalvo}
      />

      {/* RF08 — Exclusão de Requisito */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Requisito"
        description={`Tem certeza que deseja excluir o requisito ${requirement.codigo}? Esta ação não pode ser desfeita.`}
        onConfirm={handleExcluirRequisito}
      />
    </div>
  );
}
