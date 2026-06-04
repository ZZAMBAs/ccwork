import { useEffect, useState } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { TagListView } from './components/TagListView';

type AppMode = 'notes' | 'tags';
type PendingNoteNavigation =
  | { type: 'select-note'; noteId: string }
  | { type: 'new-note' }
  | { type: 'open-tags' };

function AppContent() {
  const { notes, loading, error } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mode, setMode] = useState<AppMode>('notes');
  const [hasUnsavedEditorChanges, setHasUnsavedEditorChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNoteNavigation | null>(null);
  const [lastSelectedNoteIdBeforeTags, setLastSelectedNoteIdBeforeTags] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!hasUnsavedEditorChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedEditorChanges]);

  const executeNavigation = (action: PendingNoteNavigation) => {
    if (action.type === 'select-note') {
      setMode('notes');
      setSelectedNoteId(action.noteId);
      setIsCreating(false);
      setHasUnsavedEditorChanges(false);
      return;
    }

    if (action.type === 'new-note') {
      setMode('notes');
      setSelectedNoteId(null);
      setIsCreating(true);
      setHasUnsavedEditorChanges(false);
      return;
    }

    setLastSelectedNoteIdBeforeTags(selectedNoteId);
    setIsCreating(false);
    setMode('tags');
    setHasUnsavedEditorChanges(false);
  };

  const requestNavigation = (action: PendingNoteNavigation) => {
    if (!hasUnsavedEditorChanges) {
      executeNavigation(action);
      return;
    }

    setPendingNavigation(action);
  };

  const confirmPendingNavigation = () => {
    if (!pendingNavigation) {
      return;
    }

    const action = pendingNavigation;
    setPendingNavigation(null);
    setHasUnsavedEditorChanges(false);
    executeNavigation(action);
  };

  const cancelPendingNavigation = () => {
    setPendingNavigation(null);
  };

  const handleSelectNote = (id: string) => requestNavigation({ type: 'select-note', noteId: id });

  const handleNewNote = () => requestNavigation({ type: 'new-note' });

  const handleOpenTags = () => requestNavigation({ type: 'open-tags' });

  const handleBackToNotes = () => {
    const shouldRestoreSelectedNote =
      lastSelectedNoteIdBeforeTags &&
      notes.some((note) => note.id === lastSelectedNoteIdBeforeTags);

    setMode('notes');
    setIsCreating(false);
    setSelectedNoteId(shouldRestoreSelectedNote ? lastSelectedNoteIdBeforeTags : null);
  };

  const handleSelectTaggedNote = (noteId: string) => {
    setMode('notes');
    setIsCreating(false);
    setSelectedNoteId(noteId);
    setHasUnsavedEditorChanges(false);
  };

  const handleDone = (savedNoteId?: string) => {
    setIsCreating(false);
    setHasUnsavedEditorChanges(false);
    if (savedNoteId) {
      setSelectedNoteId(savedNoteId);
    }
  };

  if (mode === 'tags') {
    return (
      <TagListView
        notes={notes}
        loading={loading}
        error={error}
        onBackToNotes={handleBackToNotes}
        onSelectNote={handleSelectTaggedNote}
      />
    );
  }

  return (
    <>
      <Layout
        onNewNote={handleNewNote}
        onOpenTags={handleOpenTags}
        sidebar={<NoteList selectedNoteId={selectedNoteId} onSelect={handleSelectNote} />}
        main={
          <NoteEditor
            selectedNoteId={selectedNoteId}
            isCreating={isCreating}
            onDone={handleDone}
            onUnsavedChangesChange={setHasUnsavedEditorChanges}
          />
        }
      />
      {pendingNavigation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-changes-title"
          className="fixed inset-0 z-10 flex items-center justify-center bg-foreground/20 px-4"
        >
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
            <h2 id="unsaved-changes-title" className="text-base font-semibold text-foreground">
              미저장 변경
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              저장하지 않은 변경 사항이 있습니다. 계속 이동하면 현재 편집 내용이 사라집니다.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelPendingNavigation}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmPendingNavigation}
                className="bg-foreground text-card px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity cursor-pointer"
              >
                계속
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function App() {
  return (
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  );
}

export default App;
