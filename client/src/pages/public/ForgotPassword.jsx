import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { forgotSchema } from '../../features/auth/schemas.js';
import { useForgotPassword } from '../../services/queries/auth.js';
import { getApiErrorMessage } from '../../lib/utils.js';

export default function ForgotPassword() {
  const fp = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data) => {
    try {
      await fp.mutateAsync(data);
      toast.success('If that account exists, a reset link is on its way.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>We'll email you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitSuccessful ? (
            <div className="text-sm text-muted-foreground">
              Check your inbox. The link expires in 30 minutes.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={fp.isPending}>
                {fp.isPending ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
