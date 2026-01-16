import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Heart, X, Loader2 } from "lucide-react";

interface CardioRequirementDialogProps {
  open: boolean;
  patientName: string;
  onConfirm: (needsCardio: boolean) => void;
  isLoading?: boolean;
}

export function CardioRequirementDialog({
  open,
  patientName,
  onConfirm,
  isLoading = false,
}: CardioRequirementDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-6 w-6 text-red-500" />
            Avaliação Cardiológica
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base py-2">
            O paciente <span className="font-semibold text-foreground">{patientName}</span> precisa passar pelo cardiologista antes da cirurgia?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1 h-12 border-2"
            onClick={() => onConfirm(false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <X className="h-5 w-5 mr-2" />
            )}
            Não
          </Button>
          <Button
            className="flex-1 h-12 bg-red-500 hover:bg-red-600"
            onClick={() => onConfirm(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Heart className="h-5 w-5 mr-2" />
            )}
            Sim, precisa
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
