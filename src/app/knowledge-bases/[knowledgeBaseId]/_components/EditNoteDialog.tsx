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
import { Textarea } from "@/components/ui/textarea";
import { noteAnswerSchema, noteQuestionSchema } from "@/lib/note-schema";
import type { UpdateNoteInput, UpdateNoteResult } from "../actions";

interface EditNoteDialogProps {
  note: { id: number; question: string; answer: string };
  onSave: (input: UpdateNoteInput) => Promise<UpdateNoteResult>;
}

interface FieldErrors {
  question?: string;
  answer?: string;
}

export function EditNoteDialog({ note, onSave }: EditNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(note.question);
  const [answer, setAnswer] = useState(note.answer);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Ignore dismissals while saving so the result isn't lost.
    if (isPending) return;
    if (nextOpen) {
      // Prefill with the latest saved values every time the dialog opens.
      setQuestion(note.question);
      setAnswer(note.answer);
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
        const result = await onSave({
          noteId: note.id,
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

        toast.success("Note updated");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to update the note");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Edit note"
        onClick={() => handleOpenChange(true)}
      >
        <Pencil />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Edit note</DialogTitle>
              <DialogDescription>
                Update the question and answer of this note.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={errors.question ? true : undefined}>
                <FieldLabel htmlFor={`note-question-${note.id}`}>
                  Question
                </FieldLabel>
                <Textarea
                  id={`note-question-${note.id}`}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  aria-invalid={errors.question ? true : undefined}
                  disabled={isPending}
                  rows={2}
                />
                {errors.question && <FieldError>{errors.question}</FieldError>}
              </Field>
              <Field data-invalid={errors.answer ? true : undefined}>
                <FieldLabel htmlFor={`note-answer-${note.id}`}>
                  Answer
                </FieldLabel>
                <Textarea
                  id={`note-answer-${note.id}`}
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
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
