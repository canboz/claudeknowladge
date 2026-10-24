"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { knowledgeBaseNameSchema } from "@/lib/knowledge-base-schema";
import type { UpdateKnowledgeBaseResult } from "../actions";

interface EditKnowledgeBaseDialogProps {
  knowledgeBase: { id: number; name: string };
  onSave: (input: {
    knowledgeBaseId: number;
    name: string;
  }) => Promise<UpdateKnowledgeBaseResult>;
}

export function EditKnowledgeBaseDialog({
  knowledgeBase,
  onSave,
}: EditKnowledgeBaseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(knowledgeBase.name);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Ignore dismissals while saving so the result isn't lost.
    if (isPending) return;
    if (nextOpen) {
      // Prefill with the latest saved values every time the dialog opens.
      setName(knowledgeBase.name);
      setError(undefined);
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = knowledgeBaseNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);

    startTransition(async () => {
      try {
        const result = await onSave({
          knowledgeBaseId: knowledgeBase.id,
          name: parsed.data,
        });

        if (!result.ok) {
          const fieldError = result.fieldErrors?.name?.[0];
          if (fieldError) setError(fieldError);
          toast.error(result.error);
          return;
        }

        toast.success("Knowledge base updated");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to update the knowledge base");
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => handleOpenChange(true)}>
        <Pencil />
        Edit
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Edit knowledge base</DialogTitle>
              <DialogDescription>
                Update the details of this knowledge base.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="knowledge-base-name">Name</FieldLabel>
                <Input
                  id="knowledge-base-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={error ? true : undefined}
                  disabled={isPending}
                  autoComplete="off"
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
