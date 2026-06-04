import { useState } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { TagListView } from './components/TagListView';

type AppMode = 'notes' | 'tags';

function AppContent() {
  const { notes, loading, error } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mode, setMode] = useState<AppMode>('notes');
  const [lastSelectedNoteIdBeforeTags, setLastSelectedNoteIdBeforeTags] = useState<string | null>(
    null,
  );

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setMode('notes');
    setSelectedNoteId(null);
    setIsCreating(true);
  };

  const handleOpenTags = () => {
    setLastSelectedNoteIdBeforeTags(selectedNoteId);
    setIsCreating(false);
    setMode('tags');
  };

  const handleBackToNotes = () => {
    const shouldRestoreSelectedNote =
      lastSelectedNoteIdBeforeTags &&
      notes.some((note) => note.id === lastSelectedNoteIdBeforeTags);

    setMode('notes');
    setIsCreating(false);
    setSelectedNoteId(shouldRestoreSelectedNote ? lastSelectedNoteIdBeforeTags : null);
  };

  const handleDone = (savedNoteId?: string) => {
    setIsCreating(false);
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
      />
    );
  }

  return (
    <Layout
      onNewNote={handleNewNote}
      onOpenTags={handleOpenTags}
      sidebar={<NoteList selectedNoteId={selectedNoteId} onSelect={handleSelectNote} />}
      main={
        <NoteEditor selectedNoteId={selectedNoteId} isCreating={isCreating} onDone={handleDone} />
      }
    />
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
