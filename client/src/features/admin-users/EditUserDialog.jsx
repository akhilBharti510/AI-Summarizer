import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Switch } from '../../components/ui/switch.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.jsx';
import { useUpdateUser } from '../../services/queries/users.js';
import { useRoles } from '../../services/queries/roles.js';
import { getApiErrorMessage } from '../../lib/utils.js';

export default function EditUserDialog({ user, open, onOpenChange }) {
  const update = useUpdateUser();
  const { data: rolesData } = useRoles({ limit: 100, status: 'ACTIVE' });
  const [roleId, setRoleId] = useState(user?.role?.id || '');
  const [isActive, setIsActive] = useState(Boolean(user?.isActive));

  useEffect(() => {
    setRoleId(user?.role?.id || '');
    setIsActive(Boolean(user?.isActive));
  }, [user]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.name}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(rolesData?.data || []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive users cannot sign in</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={update.isPending}
            onClick={async () => {
              try {
                await update.mutateAsync({ id: user.id, roleId, isActive });
                toast.success('User updated');
                onOpenChange(false);
              } catch (e) {
                toast.error(getApiErrorMessage(e));
              }
            }}
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
