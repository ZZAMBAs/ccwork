import type { TagAutocompleteCandidate } from '../types/tag';

interface TagAutocompleteProps {
  suggestions: TagAutocompleteCandidate[];
  activeIndex: number;
  onSelect: (tagName: string) => void;
}

export function TagAutocomplete({ suggestions, activeIndex, onSelect }: TagAutocompleteProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.comparisonKey}
          type="button"
          onClick={() => onSelect(suggestion.tagName)}
          className={`block w-full rounded-xl border px-3 py-2 text-left text-sm text-foreground transition-colors cursor-pointer ${
            index === activeIndex ? 'border-foreground bg-muted' : 'border-border bg-card'
          }`}
        >
          {suggestion.tagName}
        </button>
      ))}
    </div>
  );
}
