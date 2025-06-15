import { createClient } from '@supabase/supabase-js';
import { ProfileFieldTemplate } from '@/types/profile';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getAllProfileFieldTemplates(): Promise<ProfileFieldTemplate[]> {
  const { data, error } = await supabase
    .from('profile_field_templates')
    .select('*')
    .order('order', { ascending: true });
  if (error) throw error;
  return data as ProfileFieldTemplate[];
}

export async function createProfileFieldTemplate(field: Omit<ProfileFieldTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ProfileFieldTemplate> {
  const { data, error } = await supabase
    .from('profile_field_templates')
    .insert([{ ...field }])
    .select()
    .single();
  if (error) throw error;
  return data as ProfileFieldTemplate;
}

export async function updateProfileFieldTemplate(id: number, updates: Partial<ProfileFieldTemplate>): Promise<ProfileFieldTemplate> {
  const { data, error } = await supabase
    .from('profile_field_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ProfileFieldTemplate;
}

export async function deleteProfileFieldTemplate(id: number): Promise<void> {
  const { error } = await supabase
    .from('profile_field_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function reorderProfileFieldTemplates(order: number[]): Promise<void> {
  // order: array of field IDs in new order
  for (let i = 0; i < order.length; i++) {
    await supabase
      .from('profile_field_templates')
      .update({ order: i })
      .eq('id', order[i]);
  }
} 