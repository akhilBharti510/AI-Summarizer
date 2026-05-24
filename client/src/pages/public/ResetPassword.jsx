import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { resetSchema } from '../../features/auth/schemas.js';
import { useResetPassword } from '../../services/queries/auth.js';
import { getApiErrorMessage } from '../../lib/utils.js';

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema), defaultValues: { token: '' } });

  useEffect(() => {
    const token = sp.get('token') || '';
    setValue('token', token);
  }, [sp, setValue]);

  const onSubmit = async (data) => {
    try {
      await reset.mutateAsync({ token: data.token, password: data.password });
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>The token expires 30 minutes after request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <input type="hidden" {...register('token')} />
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>
            {errors.token && <p className="text-xs text-destructive">Reset token is required</p>}
            <Button type="submit" className="w-full" disabled={reset.isPending}>
              {reset.isPending ? 'Saving…' : 'Update password'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
