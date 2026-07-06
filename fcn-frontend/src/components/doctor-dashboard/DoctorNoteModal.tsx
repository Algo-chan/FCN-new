import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { clsx } from "clsx";
import { Lock, FileText } from "lucide-react";
import { getDoctorNotes, saveDoctorNote, type DoctorNote } from "@/services/doctor-dashboard.service";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";

interface DoctorNoteModalProps {
  patientId: string;
  patientName: string;
  appointmentId?: string;
  onClose: () => void;
}

export const DoctorNoteModal = ({ patientId, patientName, appointmentId, onClose }: DoctorNoteModalProps) => {
  const queryClient = useQueryClient();
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();
  const [noteText, setNoteText] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const { data: notesData } = useQuery({
    queryKey: ["doctor-notes", patientId],
    queryFn: () => getDoctorNotes(patientId),
  });
  const notes: DoctorNote[] = (notesData as any)?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => saveDoctorNote(patientId, noteText, appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-notes", patientId] });
      setNoteText("");
      playSuccess();
      addToast({ type: "success", title: "Note saved" });
    },
    onError: () => {
      addToast({ type: "danger", title: "Failed to save note" });
    },
  });

  return (
    <Modal isOpen onClose={onClose} title={`Private Note — ${patientName}`} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          <Lock className="h-3 w-3" />
          <span>This note is private — only you can see it</span>
        </div>

        {notes.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto space-y-2 border border-fcn-primary/10 rounded-lg p-3">
            <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Previous Notes ({notes.length})
            </p>
            {notes.map((note: DoctorNote) => (
              <div key={note.id} className="space-y-1">
                <button
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                      {format(parseISO(note.created_at), "MMM d, h:mm a")}
                    </span>
                    <Badge size="sm" variant="info">private</Badge>
                  </div>
                  <p className={clsx("text-xs text-fcn-text-light/70 dark:text-fcn-text-dark/70 mt-0.5", expandedNote !== note.id && "line-clamp-1")}>
                    {note.note_text}
                  </p>
                </button>
                {notes.indexOf(note) < notes.length - 1 && (
                  <div className="border-t border-fcn-primary/5" />
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value.slice(0, 2000))}
            rows={4}
            placeholder="Write your clinical observations, follow-up reminders, or private notes about this patient..."
            className="w-full resize-none rounded-lg border border-fcn-primary/20 bg-white p-3 text-sm text-fcn-text-light outline-none focus:border-fcn-primary focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark dark:border-fcn-primary/10"
          />
          <p className="text-right text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40 mt-1">
            {noteText.length}/2000
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={noteText.trim().length < 2}
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            <FileText className="h-4 w-4" /> Save Note
          </Button>
        </div>
      </div>
    </Modal>
  );
};
