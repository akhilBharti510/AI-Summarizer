import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, FileDown, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu.jsx';
import { formatRelative } from '../../lib/utils.js';

export default function SummaryCard({ summary, onBookmark, onDelete, onRegenerate, onExport }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">
            <Link to={`/history?id=${summary.id}`} className="hover:underline">{summary.title}</Link>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.(summary, 'txt')}><FileDown className="mr-2 h-4 w-4" /> Export TXT</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.(summary, 'pdf')}><FileDown className="mr-2 h-4 w-4" /> Export PDF</DropdownMenuItem>
              {onRegenerate && summary.sourceType !== 'IMAGE' && (
                <DropdownMenuItem onClick={() => onRegenerate(summary)}><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(summary)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{summary.sourceType}</Badge>
          <Badge variant="outline">{summary.summaryType}</Badge>
          <Badge variant="outline">{summary.length}</Badge>
          <Badge variant="outline">{summary.language}</Badge>
          {summary.status === 'FAILED' && <Badge variant="destructive">Failed</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-4 text-sm text-muted-foreground">{summary.output || summary.inputPreview}</p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">{formatRelative(summary.createdAt)}</span>
        {onBookmark && (
          <Button variant="ghost" size="icon" onClick={() => onBookmark(summary)} aria-label="Toggle bookmark">
            {summary.bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
