import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button.jsx';

export default function Pagination({ pagination, onChange }) {
  if (!pagination) return null;
  const { page, totalPages, total, hasNext, hasPrev } = pagination;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 pt-3 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
