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
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { useCreateRole, useUpdateRole, usePermissionCatalog } from '../../services/queries/roles.js';
import { getApiErrorMessage } from '../../lib/utils.js';

export default function RoleDialog({ role, open, onOpenChange }) {
  const create = useCreateRole();
  const update = useUpdateRole();
  const { data: catalog } = usePermissionCatalog();

  const isEdit = Boolean(role);
  const [form, setForm] = useState({
    name: '',
    description: '',
    dailyLimit: 20,
    permissions: [],
  });

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name,
        description: role.description || '',
        dailyLimit: role.dailyLimit,
        permissions: role.permissions || [],
      });
    } else {
      setForm({ name: '', description: '', dailyLimit: 20, permissions: [] });
    }
  }, [role]);

  const togglePerm = (key) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));

  const submit = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        dailyLimit: Number(form.dailyLimit),
        permissions: form.permissions,
      };
      if (isEdit) await update.mutateAsync({ id: role.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Role updated' : 'Role created');
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const grouped = (catalog?.permissions || []).reduce((acc, p) => {
    (acc[p.group] ||= []).push(p);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${role.name}` : 'Create role'}</DialogTitle>
          <DialogDescription>Configure name, daily limit, and permissions.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                disabled={role?.isSystem}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit">Daily limit (−1 = unlimited)</Label>
              <Input
                id="limit"
                type="number"
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={280}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border p-3">
              {Object.entries(grouped).map(([group, perms]) => (
                <div key={group}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(p.key)}
                          onChange={() => togglePerm(p.key)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <span className="font-mono text-xs">{p.key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
