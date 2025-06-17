import { ProfileFieldTemplate } from '@/types/profile';
import { supabase } from '@/integrations/supabase/client';

// Default templates to seed the database if empty
const defaultTemplates: Omit<ProfileFieldTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    label: 'Full Name',
    field_key: 'full_name',
    type: 'text',
    required: true,
    visible_to_user: true,
    admin_only: false,
    order: 1
  },
  {
    label: 'Phone Number',
    field_key: 'phone_number',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 2
  },
  {
    label: 'Address',
    field_key: 'address',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 3
  },
  {
    label: 'Parish',
    field_key: 'parish',
    type: 'select',
    options: [
      'Clarendon',
      'Hanover',
      'Kingston',
      'Manchester',
      'Portland',
      'Saint Andrew',
      'Saint Ann',
      'Saint Catherine',
      'Saint Elizabeth',
      'Saint James',
      'Saint Mary',
      'Saint Thomas',
      'Trelawny',
      'Westmoreland'
    ],
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 4
  },
  {
    label: 'Deployment Parish',
    field_key: 'deployment_parish',
    type: 'select',
    options: [
      'Clarendon',
      'Hanover',
      'Kingston',
      'Manchester',
      'Portland',
      'Saint Andrew',
      'Saint Ann',
      'Saint Catherine',
      'Saint Elizabeth',
      'Saint James',
      'Saint Mary',
      'Saint Thomas',
      'Trelawny',
      'Westmoreland'
    ],
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 5
  },
  {
    label: 'Assigned Station',
    field_key: 'assigned_station',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 6
  },
  {
    label: 'Bank Name',
    field_key: 'bank_name',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 7
  },
  {
    label: 'Bank Account Number',
    field_key: 'bank_account_number',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 8
  },
  {
    label: 'Bank Routing Number',
    field_key: 'bank_routing_number',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 9
  },
  {
    label: 'TRN',
    field_key: 'trn',
    type: 'text',
    required: false,
    visible_to_user: true,
    admin_only: false,
    order: 10
  }
];

export async function getAllProfileFieldTemplates(): Promise<ProfileFieldTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('profile_field_templates')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching profile field templates:', error);
      throw error;
    }

    // If no templates exist, seed with defaults
    if (!data || data.length === 0) {
      console.log('No templates found, seeding with defaults...');
      await seedDefaultTemplates();
      return getAllProfileFieldTemplates(); // Recursive call after seeding
    }

    return data as ProfileFieldTemplate[];
  } catch (error) {
    console.error('Failed to fetch profile field templates:', error);
    // Fallback to default templates if database fails
    return defaultTemplates.map((template, index) => ({
      ...template,
      id: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as ProfileFieldTemplate[];
  }
}

async function seedDefaultTemplates(): Promise<void> {
  try {
    const { error } = await supabase
      .from('profile_field_templates')
      .insert(defaultTemplates);

    if (error) {
      console.error('Error seeding default templates:', error);
      throw error;
    }

    console.log('Default templates seeded successfully');
  } catch (error) {
    console.error('Failed to seed default templates:', error);
    throw error;
  }
}

export async function createProfileFieldTemplate(field: Omit<ProfileFieldTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ProfileFieldTemplate> {
  try {
    const { data, error } = await supabase
      .from('profile_field_templates')
      .insert([field])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile field template:', error);
      throw error;
    }

    return data as ProfileFieldTemplate;
  } catch (error) {
    console.error('Failed to create profile field template:', error);
    throw error;
  }
}

export async function updateProfileFieldTemplate(id: number, updates: Partial<ProfileFieldTemplate>): Promise<ProfileFieldTemplate> {
  try {
    const { data, error } = await supabase
      .from('profile_field_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile field template:', error);
      throw error;
    }

    return data as ProfileFieldTemplate;
  } catch (error) {
    console.error('Failed to update profile field template:', error);
    throw error;
  }
}

export async function deleteProfileFieldTemplate(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('profile_field_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile field template:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete profile field template:', error);
    throw error;
  }
}

export async function reorderProfileFieldTemplates(templateOrders: { id: number; order: number }[]): Promise<void> {
  try {
    // Update each template's order
    const updates = templateOrders.map(({ id, order }) =>
      supabase
        .from('profile_field_templates')
        .update({ order, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error reordering profile field templates:', result.error);
        throw result.error;
      }
    }
  } catch (error) {
    console.error('Failed to reorder profile field templates:', error);
    throw error;
  }
}
