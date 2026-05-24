import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Summarizer</span>
        </Link>
      </header>
      <main className="container grid flex-1 place-items-center text-center">
        <div>
          <p className="text-6xl font-bold">404</p>
          <p className="mt-2 text-muted-foreground">That page wandered off.</p>
          <Button className="mt-6" asChild><Link to="/">Go home</Link></Button>
        </div>
      </main>
    </div>
  );
}
