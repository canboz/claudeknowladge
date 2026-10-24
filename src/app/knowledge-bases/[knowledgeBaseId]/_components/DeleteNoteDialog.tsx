"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { DeleteNoteInput, DeleteNoteResult } from "../actions";

interface DeleteNoteDialogProps {
  noteId: number;
  onDelete: (input: DeleteNoteInput) => Promise<DeleteNoteResult>;
}

export function DeleteNoteDialog({ noteId, onDelete }: DeleteNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Ignore dismissals while deleting so the result isn't lost.
    if (isPending) return;
    setOpen(nextOpen);
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await onDelete({ noteId });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("Note deleted");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to delete the note");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete note"
        onClick={() => handleOpenChange(true)}
      >
        <Trash2 />
      </Button>
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
