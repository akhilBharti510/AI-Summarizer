import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SummaryForm from '../../features/summaries/SummaryForm.jsx';
import SummaryDetail from '../../features/summaries/SummaryDetail.jsx';
import AuthCTAModal from '../../features/auth/AuthCTAModal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Summarize() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [createdId, setCreatedId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  // Only auto-open the upgrade modal once per page mount; after dismissal, fall back to a toast.
  const modalDismissed = useRef(false);

  const handleQuotaExceeded = () => {
    if (isAuthenticated) {
      toast.error('Daily limit reached. Try again tomorrow.');
      return;
    }
    toast.error("You've reached your free limit.");
    if (!modalDismissed.current) setAuthModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Summarize</h1>
        <p className="text-sm text-muted-foreground">Paste, link, or upload. Then pick the style.</p>
      </div>
      <SummaryForm
        onSuccess={(s) => setCreatedId(s?.id)}
        onQuotaExceeded={handleQuotaExceeded}
      />
      <SummaryDetail
        id={createdId}
        open={Boolean(createdId)}
        onIdChange={(newId) => setCreatedId(newId)}
        onOpenChange={(o) => {
          if (!o) {
            setCreatedId(null);
            if (isAuthenticated) navigate('/history');
          }
        }}
      />
      <AuthCTAModal
        open={authModalOpen}
        onOpenChange={(o) => {
          setAuthModalOpen(o);
          if (!o) modalDismissed.current = true;
        }}
      />
    </div>
  );
}
