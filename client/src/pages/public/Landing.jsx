import { Link, Navigate } from 'react-router-dom';
import { Sparkles, FileText, Globe, Image as ImageIcon, FileType, Languages, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const features = [
  { icon: FileText, title: 'Text & long docs', desc: 'Paste raw text or upload PDF/DOCX up to 10 MB.' },
  { icon: Globe, title: 'URL summaries', desc: 'Drop a link and get the article boiled down.' },
  { icon: ImageIcon, title: 'Image OCR', desc: 'Photos of pages, slides, or whiteboards — summarized.' },
  { icon: Languages, title: 'Multi-language', desc: 'Get the same summary in English, Hindi, French, Spanish or German.' },
  { icon: FileType, title: 'Export anywhere', desc: 'Download as TXT or PDF and share.' },
  { icon: Shield, title: 'Secure by default', desc: 'HTTP-only cookies, CSRF, rate-limiting, audit logs.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center animate-slide-up">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Gemini 2.5 Flash
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
          Turn anything into a clean summary.
        </h1>
        <p className="mt-5 text-balance text-lg text-muted-foreground">
          Text, URLs, PDFs, DOCX, images. Pick the style. Get the gist in seconds.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/register">Create free account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/summarize">Try as guest</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">No credit card · 3 free summaries per session</p>
      </div>

      <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border p-6 transition-colors hover:bg-accent/30">
            <Icon className="mb-3 h-5 w-5 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
