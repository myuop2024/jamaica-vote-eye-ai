import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getAllProfileFieldTemplates,
  createProfileFieldTemplate,
  updateProfileFieldTemplate,
  deleteProfileFieldTemplate,
  reorderProfileFieldTemplates,
} from '@/services/profileFieldTemplateService';
import { ProfileFieldTemplate } from '@/types/profile';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' },
];

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'observer', label: 'Observer' },
  { value: 'roving_observer', label: 'Roving Observer' },
  { value: 'parish_coordinator', label: 'Parish Coordinator' },
];

export const ProfileFieldTemplateManager: React.FC = () => {
  const [fields, setFields] = useState<ProfileFieldTemplate[]>([]);
  const [editingField, setEditingField] = useState<ProfileFieldTemplate | null>(null);
  const [form, setForm] = useState<any>({
    label: '',
    field_key: '',
    type: 'text',
    options: '',
    required: false,
    validation: '',
    order: 0,
    default_value: '',
    visible_to_user: true,
    admin_only: false,
    roles: ['admin', 'observer'],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllProfileFieldTemplates()
      .then(setFields)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({
      label: '',
      field_key: '',
      type: 'text',
      options: '',
      required: false,
      validation: '',
      order: fields.length,
      default_value: '',
      visible_to_user: true,
      admin_only: false,
      roles: ['admin', 'observer'],
    });
    setEditingField(null);
    setError(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.field_key.trim()) {
      setError('Label and Field Key are required');
      return;
    }
    if (fields.some(f => f.field_key === form.field_key) && !editingField) {
      setError('Field Key must be unique');
      return;
    }
    setLoading(true);
    try {
      let updatedFields;
      if (editingField) {
        const updated = await updateProfileFieldTemplate(editingField.id, {
          ...form,
          options: form.options ? form.options.split(',').map((o: string) => o.trim()) : null,
        });
        updatedFields = fields.map(f => f.id === editingField.id ? updated : f);
      } else {
        const created = await createProfileFieldTemplate({
          ...form,
          options: form.options ? form.options.split(',').map((o: string) => o.trim()) : null,
          order: fields.length,
        });
        updatedFields = [...fields, created];
      }
      setFields(updatedFields);
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: ProfileFieldTemplate) => {
    setEditingField(field);
    setForm({ ...field, options: field.options ? field.options.join(', ') : '' });
    setError(null);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await deleteProfileFieldTemplate(id);
      setFields(fields.filter(f => f.id !== id));
      if (editingField && editingField.id === id) resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const idx = fields.findIndex(f => f.id === id);
    if (idx < 0) return;
    let newFields = [...fields];
    if (direction === 'up' && idx > 0) {
      [newFields[idx - 1], newFields[idx]] = [newFields[idx], newFields[idx - 1]];
    } else if (direction === 'down' && idx < newFields.length - 1) {
      [newFields[idx + 1], newFields[idx]] = [newFields[idx], newFields[idx + 1]];
    }
    newFields = newFields.map((f, i) => ({ ...f, order: i }));
    setFields(newFields);
    setLoading(true);
    try {
      await reorderProfileFieldTemplates(newFields.map(f => f.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Field Template Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddOrUpdate} className="space-y-4 mb-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={e => handleFormChange('label', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Field Key</Label>
              <Input value={form.field_key} onChange={e => handleFormChange('field_key', e.target.value)} required disabled={!!editingField} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => handleFormChange('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.type === 'select' || form.type === 'checkbox' ? (
              <div className="space-y-2">
                <Label>Options (comma separated)</Label>
                <Input value={form.options} onChange={e => handleFormChange('options', e.target.value)} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Default Value</Label>
              <Input value={form.default_value} onChange={e => handleFormChange('default_value', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Validation (Regex)</Label>
              <Input value={form.validation} onChange={e => handleFormChange('validation', e.target.value)} />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Switch checked={form.required} onCheckedChange={v => handleFormChange('required', v)} />
              <Label>Required</Label>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Switch checked={form.visible_to_user} onCheckedChange={v => handleFormChange('visible_to_user', v)} />
              <Label>Visible to User</Label>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Switch checked={form.admin_only} onCheckedChange={v => handleFormChange('admin_only', v)} />
              <Label>Admin Only</Label>
            </div>
            <div className="space-y-2">
              <Label>Visible To Roles</Label>
              <div className="flex gap-4">
                {ROLES.map(role => (
                  <label key={role.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.roles?.includes(role.value) ?? false}
                      onCheckedChange={checked => {
                        setForm((prev: any) => ({
                          ...prev,
                          roles: checked
                            ? [...(prev.roles || []), role.value]
                            : (prev.roles || []).filter((r: string) => r !== role.value),
                        }));
                      }}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit">{editingField ? 'Update Field' : 'Add Field'}</Button>
            {editingField && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
        <div>
          <h3 className="font-semibold mb-2">Current Fields</h3>
          <ul className="space-y-2">
            {fields.sort((a, b) => a.order - b.order).map((field, idx) => (
              <li key={field.field_key} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{field.label} <span className="text-xs text-gray-500">({field.type})</span></div>
                  <div className="text-xs text-gray-500">Key: {field.field_key}</div>
                  {field.required && <span className="text-xs text-red-600">Required</span>}
                  {field.admin_only && <span className="text-xs text-blue-600 ml-2">Admin Only</span>}
                  {field.visible_to_user === false && <span className="text-xs text-gray-400 ml-2">Hidden</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(field)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(field.id)}>Delete</Button>
                  <Button size="icon" variant="ghost" onClick={() => handleReorder(field.id, 'up')} disabled={idx === 0}>↑</Button>
                  <Button size="icon" variant="ghost" onClick={() => handleReorder(field.id, 'down')} disabled={idx === fields.length - 1}>↓</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 