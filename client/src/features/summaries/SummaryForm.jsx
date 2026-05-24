import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Label } from '../../components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.jsx';
import { SUMMARY_TYPES, LENGTHS, TONES, LANGUAGES } from './constants.js';
import { useCreateSummary } from '../../services/queries/summaries.js';
import { getApiErrorMessage } from '../../lib/utils.js';

const ACCEPT = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  IMAGE: 'image/png,image/jpeg,image/webp,image/gif',
};

export default function SummaryForm({ onSuccess, onQuotaExceeded }) {
  const [sourceType, setSourceType] = useState('TEXT');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [summaryType, setSummaryType] = useState('QUICK');
  const [length, setLength] = useState('MEDIUM');
  const [tone, setTone] = useState('SIMPLE');
  const [language, setLanguage] = useState('en');

  const create = useCreateSummary();

  const submit = async () => {
    if (sourceType === 'TEXT' && !text.trim()) return toast.error('Paste some text first');
    if (sourceType === 'URL' && !url.trim()) return toast.error('Add a URL');
    if (['PDF', 'DOCX', 'IMAGE'].includes(sourceType) && !file) return toast.error('Pick a file');

    const data = { sourceType, summaryType, length, tone, language, title: title || undefined };
    if (sourceType === 'TEXT') data.text = text;
    if (sourceType === 'URL') data.url = url;

    try {
      const res = await create.mutateAsync({ data, file: ['PDF', 'DOCX', 'IMAGE'].includes(sourceType) ? file : null });
      toast.success('Summary ready');
      onSuccess?.(res?.summary);
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === 'QUOTA_EXCEEDED') {
        // Let the page decide how to surface it (guest → upgrade modal; user → daily-cap toast).
        if (onQuotaExceeded) onQuotaExceeded();
        else toast.error('Daily limit reached. Try again tomorrow.');
      } else {
        toast.error(getApiErrorMessage(err));
      }
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Tabs value={sourceType} onValueChange={setSourceType}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="TEXT">Text</TabsTrigger>
            <TabsTrigger value="URL">URL</TabsTrigger>
            <TabsTrigger value="PDF">PDF</TabsTrigger>
            <TabsTrigger value="DOCX">DOCX</TabsTrigger>
            <TabsTrigger value="IMAGE">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="TEXT" className="space-y-2">
            <Label htmlFor="text">Paste your content</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste an article, notes, or any long-form text…"
              className="min-h-[220px]"
              maxLength={100_000}
            />
            <div className="text-right text-xs text-muted-foreground">{text.length.toLocaleString()} / 100,000</div>
          </TabsContent>

          <TabsContent value="URL" className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">We'll fetch the page and summarize its main content.</p>
          </TabsContent>

          {['PDF', 'DOCX', 'IMAGE'].map((t) => (
            <TabsContent key={t} value={t} className="space-y-2">
              <FileDrop accept={ACCEPT[t]} file={file} setFile={setFile} kind={t} />
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title (optional)</Label>
          <Input id="title" placeholder="Auto-derived if left blank" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <Button onClick={submit} disabled={create.isPending} className="w-full" size="lg">
          <Wand2 className="mr-2 h-4 w-4" />
          {create.isPending ? 'Summarizing…' : 'Summarize'}
        </Button>
      </div>

      <aside className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Options</h3>
        <OptionSelect label="Type" value={summaryType} onChange={setSummaryType} options={SUMMARY_TYPES} />
        <OptionSelect label="Length" value={length} onChange={setLength} options={LENGTHS} />
        <OptionSelect label="Tone" value={tone} onChange={setTone} options={TONES} />
        <OptionSelect label="Language" value={language} onChange={setLanguage} options={LANGUAGES} />
      </aside>
    </div>
  );
}

function OptionSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FileDrop({ accept, file, setFile, kind }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center transition-colors hover:bg-accent/30">
      <Upload className="h-6 w-6 text-muted-foreground" />
      <span className="text-sm font-medium">{file ? file.name : `Drop a ${kind} or click to pick`}</span>
      <span className="text-xs text-muted-foreground">Max 10 MB</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
    </label>
  );
}
