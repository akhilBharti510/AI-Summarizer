import { Bell, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../services/queries/notifications.js';
import { formatRelative } from '../../lib/utils.js';

export default function NotificationsDropdown() {
  const { data } = useNotifications({ limit: 10 });
  const items = data?.data || [];
  const unread = data?.meta?.unreadCount || 0;
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]">
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up</div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-1"
              onClick={() => !n.readAt && markRead.mutate(n.id)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className={'text-sm font-medium ' + (n.readAt ? 'text-muted-foreground' : '')}>{n.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelative(n.createdAt)}</span>
              </div>
              {n.body ? <span className="text-xs text-muted-foreground">{n.body}</span> : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
