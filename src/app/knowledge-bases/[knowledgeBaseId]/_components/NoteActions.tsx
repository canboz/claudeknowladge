import { deleteNote, updateNote } from "../actions";
import { DeleteNoteDialog } from "./DeleteNoteDialog";
import { EditNoteDialog } from "./EditNoteDialog";

interface NoteActionsProps {
  note: { id: number; question: string; answer: string };
}

export function NoteActions({ note }: NoteActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <EditNoteDialog note={note} onSave={updateNote} />
      <DeleteNoteDialog noteId={note.id} onDelete={deleteNote} />
    </div>
  );
}
