import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Spinner from '../components/common/Spinner.jsx';

export default function PermissionRoute({ anyOf = [], allOf = [], children }) {
  const { user, isLoading, hasPermission } = useAuth();
  if (isLoading) return <div className="grid h-full place-items-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  const okAny = anyOf.length ? anyOf.some(hasPermission) : true;
  const okAll = allOf.length ? allOf.every(hasPermission) : true;
  if (!okAny || !okAll) return <Navigate to="/dashboard" replace />;
  return children;
}
