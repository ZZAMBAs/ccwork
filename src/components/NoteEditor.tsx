import { useMemo, useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { TagAutocomplete } from './TagAutocomplete';
import { TagChip } from './TagChip';
import {
  addTagsToList,
  collectTagAutocompleteCandidates,
  getTagAutocompleteSuggestions,
  getTagValidationError,
  hasPendingTagInput,
} from '../utils/tags';
import type { TagValidationError } from '../types/tag';

interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: (savedNoteId?: string) => void;
}

export function NoteEditor({ selectedNoteId, isCreating, onDone }: NoteEditorProps) {
  const { notes, createNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<TagValidationError | null>(null);
  const [showPendingTagDialog, setShowPendingTagDialog] = useState(false);
  const [hasEditedTags, setHasEditedTags] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);
  const autocompleteCandidates = useMemo(() => collectTagAutocompleteCandidates(notes), [notes]);
  const suggestions = useMemo(
    () => getTagAutocompleteSuggestions(autocompleteCandidates, tagInput, tags),
    [autocompleteCandidates, tagInput, tags],
  );

  // 선택된 노트가 바뀔 때 폼 동기화
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setTags(selectedNote.tags ?? []);
      setTagInput('');
      setTagError(null);
      setShowPendingTagDialog(false);
      setHasEditedTags(false);
      setActiveSuggestionIndex(-1);
    } else if (isCreating) {
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setTagError(null);
      setShowPendingTagDialog(false);
      setHasEditedTags(false);
      setActiveSuggestionIndex(-1);
    }
  }, [selectedNote, isCreating]);

  const handleAddTag = (input = tagInput) => {
    const result = addTagsToList(tags, input);

    if (result.errors.length > 0) {
      setTagError(result.errors[0]);
      if (input !== tagInput) {
        setTagInput('');
        setActiveSuggestionIndex(-1);
      }
      return;
    }

    setTags(result.tags);
    setHasEditedTags(true);
    setTagInput('');
    setTagError(null);
    setShowPendingTagDialog(false);
    setActiveSuggestionIndex(-1);
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeSuggestionIndex >= 0) {
        handleAddTag(suggestions[activeSuggestionIndex].tagName);
        return;
      }
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagName));
    setHasEditedTags(true);
    setShowPendingTagDialog(false);
  };

  const visibleTags = showPendingTagDialog
    ? tags
    : isCreating
      ? tags
      : selectedNote
        ? hasEditedTags
          ? tags
          : (selectedNote.tags ?? [])
        : tags;

  const handleSave = async () => {
    if (!title.trim()) {
      console.error('제목을 입력해주세요');
      return;
    }

    if (hasPendingTagInput(tagInput)) {
      setShowPendingTagDialog(true);
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        const createdNote = await createNote(title, content, tags);
        setTagInput('');
        setTagError(null);
        setShowPendingTagDialog(false);
        setHasEditedTags(false);
        onDone(createdNote.id);
        return;
      } else if (selectedNoteId) {
        await updateNote(selectedNoteId, { title, content, tags });
      }
      setTagInput('');
      setTagError(null);
      setShowPendingTagDialog(false);
      setHasEditedTags(false);
      onDone(selectedNoteId ?? undefined);
    } catch (e) {
      console.error('저장에 실패했습니다', e);
    } finally {
      setSaving(false);
    }
  };

  // 아무것도 선택 안 된 상태
  if (!isCreating && !selectedNoteId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-5xl">📝</p>
          <p className="text-muted-foreground text-sm">노트를 선택하거나 새 노트를 만드세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl px-8 sm:px-12 py-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-border max-w-2xl">
      {/* 섹션 라벨 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">
        {isCreating ? '새 노트' : '노트 편집'}
      </p>

      {/* 제목 입력 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full text-xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4"
      />

      {/* 구분선 */}
      <div className="h-px bg-border mb-4" />

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <TagChip
              key={tag}
              tagName={tag}
              variant={getTagValidationError(tag) ? 'warning' : 'default'}
              onRemove={handleRemoveTag}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            aria-label="Tag"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setTagError(null);
              setShowPendingTagDialog(false);
              setActiveSuggestionIndex(-1);
            }}
            onKeyDown={handleTagKeyDown}
            placeholder="태그"
            className="flex-1 text-sm text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => handleAddTag()}
            disabled={saving}
            className="bg-foreground text-card px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity disabled:opacity-40 cursor-pointer"
          >
            추가
          </button>
        </div>
        <TagAutocomplete
          suggestions={suggestions}
          activeIndex={activeSuggestionIndex}
          onSelect={handleAddTag}
        />
        {tagError ? (
          <p role="alert" className="text-xs text-destructive">
            {tagError.message}
          </p>
        ) : null}
        {showPendingTagDialog ? (
          <div
            role="dialog"
            aria-modal="false"
            className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
          >
            미추가 태그가 있습니다. 태그를 추가하거나 입력값을 지운 뒤 저장해주세요.
          </div>
        ) : null}
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border mb-4" />

      {/* 내용 입력 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..."
        rows={14}
        className="w-full text-base text-foreground/70 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
      />

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-foreground text-card px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={() => onDone()}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
