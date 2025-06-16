
import { ProfileFieldTemplate } from '@/types/profile';

// Mock data for profile field templates since the table doesn't exist in the database
const defaultTemplates: ProfileFieldTemplate[] = [
  {
    id: 1,
    label: 'Full Name',
    field_key: 'full_name',
    type: 'text',
    required: true,
    visible_to_user: true,
    admin_only: false,
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    label: 'Phone Number',
    field_key: 'phone_number',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    label: 'Address',
    field_key: 'address',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function getAllProfileFieldTemplates(): Promise<ProfileFieldTemplate[]> {
  // Return mock data since the table doesn't exist
  return Promise.resolve(defaultTemplates);
}

export async function createProfileFieldTemplate(field: Omit<ProfileFieldTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ProfileFieldTemplate> {
  // Mock implementation
  const newTemplate: ProfileFieldTemplate = {
    ...field,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return Promise.resolve(newTemplate);
}

export async function updateProfileFieldTemplate(id: number, updates: Partial<ProfileFieldTemplate>): Promise<ProfileFieldTemplate> {
  // Mock implementation
  const template = defaultTemplates.find(t => t.id === id);
  if (!template) throw new Error('Template not found');
  
  const updatedTemplate = {
    ...template,
    ...updates,
    updated_at: new Date().toISOString()
  };
  return Promise.resolve(updatedTemplate);
}

export async function deleteProfileFieldTemplate(id: number): Promise<void> {
  // Mock implementation
  return Promise.resolve();
}

export async function reorderProfileFieldTemplates(order: number[]): Promise<void> {
  // Mock implementation
  return Promise.resolve();
}
