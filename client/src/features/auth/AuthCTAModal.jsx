import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog.jsx';
import { Button } from '../../components/ui/button.jsx';

const BENEFITS = [
  '20 summaries per day',
  'Save and revisit your history',
  'Bookmark important summaries',
  'Multi-language summaries',
  'Export as TXT or PDF',
];

export default function AuthCTAModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const go = (to) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl">Continue Using AI Summarizer</DialogTitle>
          <DialogDescription className="pt-1 text-sm">
            You've used all 3 free summaries for this session. Create an account or log in to keep going.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 rounded-md border bg-secondary/30 p-4 text-sm">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button variant="outline" onClick={() => go('/login')}>
            Log in
          </Button>
          <Button onClick={() => go('/register')}>Create account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
