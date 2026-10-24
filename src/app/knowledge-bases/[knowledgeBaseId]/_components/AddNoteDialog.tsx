"use client";

import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { noteAnswerSchema, noteQuestionSchema } from "@/lib/note-schema";
import type { CreateNoteInput, CreateNoteResult } from "../actions";

interface AddNoteDialogProps {
  knowledgeBaseId: number;
  onCreate: (input: CreateNoteInput) => Promise<CreateNoteResult>;
}

interface FieldErrors {
  question?: string;
  answer?: string;
}

export function AddNoteDialog({
  knowledgeBaseId,
  onCreate,
}: AddNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Ignore dismissals while saving so the result isn't lost.
    if (isPending) return;
    if (nextOpen) {
      setQuestion("");
      setAnswer("");
      setErrors({});
    }
    setOpen(nextOpen);
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuestion = noteQuestionSchema.safeParse(question);
    const parsedAnswer = noteAnswerSchema.safeParse(answer);
    if (!parsedQuestion.success || !parsedAnswer.success) {
      setErrors({
        question: parsedQuestion.success
          ? undefined
          : parsedQuestion.error.issues[0]?.message,
        answer: parsedAnswer.success
          ? undefined
          : parsedAnswer.error.issues[0]?.message,
      });
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        const result = await onCreate({
          knowledgeBaseId,
          question: parsedQuestion.data,
          answer: parsedAnswer.data,
        });

        if (!result.ok) {
          setErrors({
            question: result.fieldErrors?.question?.[0],
            answer: result.fieldErrors?.answer?.[0],
          });
          toast.error(result.error);
          return;
        }

        toast.success("Note created");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to create the note");
      }
    });
  }

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <Plus />
        Add Note
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Add note</DialogTitle>
              <DialogDescription>
                Add a new question and answer to this knowledge base.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={errors.question ? true : undefined}>
                <FieldLabel htmlFor="new-note-question">Question</FieldLabel>
                <Textarea
                  id="new-note-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  aria-invalid={errors.question ? true : undefined}
                  disabled={isPending}
                  rows={2}
                />
                {errors.question && <FieldError>{errors.question}</FieldError>}
              </Field>
              <Field data-invalid={errors.answer ? true : undefined}>
                <FieldLabel htmlFor="new-note-answer">Answer</FieldLabel>
                <Textarea
                  id="new-note-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  aria-invalid={errors.answer ? true : undefined}
                  disabled={isPending}
                  rows={6}
                />
                {errors.answer && <FieldError>{errors.answer}</FieldError>}
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
                {isPending ? "Creating..." : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
