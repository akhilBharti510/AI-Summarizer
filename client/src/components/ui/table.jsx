import * as React from 'react';
import { cn } from '../../lib/utils.js';

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef((props, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', props.className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef((props, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', props.className)} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b transition-colors hover:bg-muted/40', className)} {...props} />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn('h-10 px-3 text-left align-middle font-medium text-muted-foreground', className)} {...props} />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-3 align-middle', className)} {...props} />
));
TableCell.displayName = 'TableCell';
