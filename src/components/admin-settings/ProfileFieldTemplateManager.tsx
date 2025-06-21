
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  getProfileFieldTemplates,
  createProfileFieldTemplate,
  updateProfileFieldTemplate,
  deleteProfileFieldTemplate,
  reorderProfileFieldTemplates,
  ProfileFieldTemplate,
} from '@/services/profileFieldTemplateService';

export const ProfileFieldTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ProfileFieldTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState<Partial<ProfileFieldTemplate>>({
    field_key: '',
    label: '',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    default_value: '',
    validation: '',
    options: null,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await getProfileFieldTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile field templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.field_key || !newTemplate.label) {
      toast({
        title: 'Validation Error',
        description: 'Field key and label are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createProfileFieldTemplate(newTemplate as Omit<ProfileFieldTemplate, 'id' | 'created_at' | 'updated_at'>);
      toast({
        title: 'Success',
        description: 'Profile field template created successfully',
      });
      setNewTemplate({
        field_key: '',
        label: '',
        type: 'text',
        required: false,
        visible_to_user: true,
        admin_only: false,
        default_value: '',
        validation: '',
        options: null,
      });
      setIsCreating(false);
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile field template',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (id: number, updates: Partial<ProfileFieldTemplate>) => {
    try {
      await updateProfileFieldTemplate(id, updates);
      toast({
        title: 'Success',
        description: 'Profile field template updated successfully',
      });
      setEditingId(null);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile field template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this field template?')) {
      return;
    }

    try {
      await deleteProfileFieldTemplate(id);
      toast({
        title: 'Success',
        description: 'Profile field template deleted successfully',
      });
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile field template',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(templates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTemplates(items);

    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        order: index,
      }));
      await reorderProfileFieldTemplates(updates);
      toast({
        title: 'Success',
        description: 'Field order updated successfully',
      });
    } catch (error) {
      console.error('Error reordering templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field order',
        variant: 'destructive',
      });
      loadTemplates(); // Reload to revert changes
    }
  };

  const renderTemplateForm = (
    template: Partial<ProfileFieldTemplate>,
    onUpdate: (updates: Partial<ProfileFieldTemplate>) => void,
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field_key">Field Key</Label>
          <Input
            id="field_key"
            value={template.field_key || ''}
            onChange={(e) => onUpdate({ field_key: e.target.value })}
            placeholder="e.g., emergency_contact"
          />
        </div>
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={template.label || ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="e.g., Emergency Contact"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Field Type</Label>
          <Select
            value={template.type || 'text'}
            onValueChange={(value) => onUpdate({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="number">Number</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="default_value">Default Value</Label>
          <Input
            id="default_value"
            value={template.default_value || ''}
            onChange={(e) => onUpdate({ default_value: e.target.value })}
          />
        </div>
      </div>

      {template.type === 'select' && (
        <div>
          <Label htmlFor="options">Options (JSON format)</Label>
          <Textarea
            id="options"
            value={template.options ? JSON.stringify(template.options, null, 2) : ''}
            onChange={(e) => {
              try {
                const options = JSON.parse(e.target.value);
                onUpdate({ options });
              } catch {
                // Invalid JSON, don't update
              }
            }}
            placeholder='["Option 1", "Option 2", "Option 3"]'
          />
        </div>
      )}

      <div>
        <Label htmlFor="validation">Validation Rules</Label>
        <Input
          id="validation"
          value={template.validation || ''}
          onChange={(e) => onUpdate({ validation: e.target.value })}
          placeholder="e.g., required|email|min:3"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={template.required || false}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label htmlFor="required">Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="visible_to_user"
            checked={template.visible_to_user !== false}
            onCheckedChange={(checked) => onUpdate({ visible_to_user: checked })}
          />
          <Label htmlFor="visible_to_user">Visible to User</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="admin_only"
            checked={template.admin_only || false}
            onCheckedChange={(checked) => onUpdate({ admin_only: checked })}
          />
          <Label htmlFor="admin_only">Admin Only</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Field Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Field Templates</CardTitle>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            Configure custom profile fields that will be available for user profiles.
            Drag and drop to reorder fields.
          </AlertDescription>
        </Alert>

        {isCreating && (
          <>
            {renderTemplateForm(
              newTemplate,
              (updates) => setNewTemplate({ ...newTemplate, ...updates }),
              handleCreate,
              () => setIsCreating(false)
            )}
            <Separator />
          </>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="templates">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {templates.map((template, index) => (
                  <Draggable
                    key={template.id}
                    draggableId={template.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-lg p-4 bg-white ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        {editingId === template.id ? (
                          renderTemplateForm(
                            template,
                            (updates) => setTemplates(templates.map(t => 
                              t.id === template.id ? { ...t, ...updates } : t
                            )),
                            () => handleUpdate(template.id, template),
                            () => setEditingId(null)
                          )
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium">{template.label}</h3>
                                  <Badge variant="outline">{template.type}</Badge>
                                  {template.required && (
                                    <Badge variant="destructive">Required</Badge>
                                  )}
                                  {template.admin_only && (
                                    <Badge variant="secondary">Admin Only</Badge>
                                  )}
                                  {!template.visible_to_user && (
                                    <Badge variant="outline">Hidden</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Key: {template.field_key}
                                </p>
                                {template.validation && (
                                  <p className="text-sm text-gray-500">
                                    Validation: {template.validation}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(template.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(template.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {templates.length === 0 && !isCreating && (
          <div className="text-center py-8 text-gray-500">
            No profile field templates configured. Click "Add Field Template" to create one.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
