import { useState } from 'react';
import { toast } from 'sonner';
import { Bookmark, BookmarkCheck, FileDown, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import {
  useSummary,
  useRenameSummary,
  useToggleBookmark,
  useDeleteSummary,
  useRegenerateSummary,
  downloadExport,
} from '../../services/queries/summaries.js';
import { getApiErrorMessage, formatDate } from '../../lib/utils.js';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';

export default function SummaryDetail({ id, open, onOpenChange }) {
  const { data, isLoading, error, refetch } = useSummary(id);
  const summary = data?.summary;
  const rename = useRenameSummary();
  const bookmark = useToggleBookmark();
  const remove = useDeleteSummary();
  const regen = useRegenerateSummary();
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8">
              {renaming ? (
                <div className="flex gap-2">
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={160} />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await rename.mutateAsync({ id, title: newTitle });
                        toast.success('Renamed');
                        setRenaming(false);
                        refetch();
                      } catch (err) {
                        toast.error(getApiErrorMessage(err));
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRenaming(false)}>Cancel</Button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {summary?.title || 'Summary'}
                  {summary && (
                    <Button variant="ghost" size="icon" onClick={() => { setNewTitle(summary.title); setRenaming(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </span>
              )}
            </DialogTitle>
            {summary && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="secondary">{summary.sourceType}</Badge>
                <Badge variant="outline">{summary.summaryType}</Badge>
                <Badge variant="outline">{summary.length}</Badge>
                <Badge variant="outline">{summary.tone}</Badge>
                <Badge variant="outline">{summary.language}</Badge>
              </div>
            )}
          </DialogHeader>

          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>}

          {summary && (
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {summary.output}
            </div>
          )}

          {summary && (
            <p className="text-xs text-muted-foreground">Created {formatDate(summary.createdAt)}</p>
          )}

          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadExport(id, 'txt')}><FileDown className="mr-2 h-4 w-4" /> TXT</Button>
              <Button variant="outline" size="sm" onClick={() => downloadExport(id, 'pdf')}><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
              {summary?.sourceType !== 'IMAGE' && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={regen.isPending}
                  onClick={async () => {
                    try {
                      await regen.mutateAsync({ id, options: {} });
                      toast.success('Regenerated — see History');
                    } catch (err) {
                      toast.error(getApiErrorMessage(err));
                    }
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await bookmark.mutateAsync(id);
                    refetch();
                  } catch (err) {
                    toast.error(getApiErrorMessage(err));
                  }
                }}
              >
                {summary?.bookmarked ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                Bookmark
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this summary?"
        description="This action cannot be undone."
        destructive
        loading={remove.isPending}
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await remove.mutateAsync(id);
            toast.success('Deleted');
            setConfirmDelete(false);
            onOpenChange(false);
          } catch (err) {
            toast.error(getApiErrorMessage(err));
          }
        }}
      />
    </>
  );
}
