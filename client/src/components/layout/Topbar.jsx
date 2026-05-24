import { NavLink } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown.jsx';
import NotificationsDropdown from './NotificationsDropdown.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import { Button } from '../ui/button.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const mobileLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/summarize', label: 'Summarize' },
  { to: '/history', label: 'History' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
];

export default function Topbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {mobileLinks.map((l) => (
                <DropdownMenuItem key={l.to} onClick={() => navigate(l.to)}>{l.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Logo: always visible for guests (PublicLayout has no sidebar); mobile-only for users (AppLayout sidebar carries it on desktop). */}
        <NavLink
          to={isAuthenticated ? '/dashboard' : '/'}
          className={`flex items-center gap-2 ${isAuthenticated ? 'md:hidden' : ''}`}
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Summarizer</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {isAuthenticated && <NotificationsDropdown />}
        {isAuthenticated ? <ProfileDropdown /> : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Get started</Button>
          </>
        )}
      </div>
    </header>
  );
}
