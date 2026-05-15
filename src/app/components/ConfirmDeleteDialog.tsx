import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Erro ao excluir:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border shadow-sm">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border shadow-sm"
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Confirmar Exclusão"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
