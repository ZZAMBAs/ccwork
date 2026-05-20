interface TagChipProps {
  tagName: string;
  variant?: 'default' | 'warning';
  onRemove?: (tagName: string) => void;
}

export function TagChip({ tagName, variant = 'default', onRemove }: TagChipProps) {
  return (
    <span
      data-testid="tag-chip"
      data-variant={variant}
      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold ${
        variant === 'warning'
          ? 'border-destructive text-destructive'
          : 'border-border text-muted-foreground'
      }`}
    >
      {tagName}
      {onRemove ? (
        <button
          type="button"
          aria-label={`${tagName} 삭제`}
          onClick={() => onRemove(tagName)}
          className="text-muted-foreground hover:text-destructive text-xs transition-colors cursor-pointer"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
