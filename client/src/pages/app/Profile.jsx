import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar.jsx';
import { useUpdateMyProfile } from '../../services/queries/users.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getApiErrorMessage, formatDate } from '../../lib/utils.js';

const schema = z.object({
  name: z.string().min(2).max(80),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
});

export default function Profile() {
  const { user, refresh } = useAuth();
  const update = useUpdateMyProfile();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) reset({ name: user.name, avatarUrl: user.avatarUrl || '' });
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      await update.mutateAsync({ name: data.name, avatarUrl: data.avatarUrl || null });
      await refresh();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!user) return null;
  const initials = user.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your name and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{user.email}</p>
              <p className="text-muted-foreground">Role: {user.role?.name}</p>
              <p className="text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input id="avatarUrl" placeholder="https://…" {...register('avatarUrl')} />
              {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
            </div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
