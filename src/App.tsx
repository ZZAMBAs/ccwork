import { useState } from 'react';
import { NotesProvider } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';

function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreating(true);
  };

  const handleDone = (savedNoteId?: string) => {
    setIsCreating(false);
    if (savedNoteId) {
      setSelectedNoteId(savedNoteId);
    }
  };

  return (
    <NotesProvider>
      <Layout
        onNewNote={handleNewNote}
        sidebar={<NoteList selectedNoteId={selectedNoteId} onSelect={handleSelectNote} />}
        main={
          <NoteEditor selectedNoteId={selectedNoteId} isCreating={isCreating} onDone={handleDone} />
        }
      />
    </NotesProvider>
  );
}

export default App;
