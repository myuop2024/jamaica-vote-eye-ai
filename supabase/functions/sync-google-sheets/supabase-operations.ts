
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getSupabaseConfig } from './config.ts';

export async function fetchReportsData() {
  const config = getSupabaseConfig();
  const supabase = createClient(config.url, config.serviceRoleKey);
  
  const { data: reports, error } = await supabase
    .from('observation_reports')
    .select(`
      id,
      report_text,
      station_id,
      status,
      created_at,
      updated_at,
      observer_id,
      profiles!observer_id(name, email)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Reports fetch error:', error);
    throw error;
  }
  
  // Flatten the data for Google Sheets
  return reports?.map(report => ({
    id: report.id,
    observer_name: report.profiles?.name || 'Unknown',
    observer_email: report.profiles?.email || '',
    report_text: report.report_text,
    station_id: report.station_id || '',
    status: report.status,
    created_at: report.created_at,
    updated_at: report.updated_at
  }));
}

export async function fetchObserversData() {
  const config = getSupabaseConfig();
  const supabase = createClient(config.url, config.serviceRoleKey);
  
  const { data: observers, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, phone_number, assigned_station, verification_status, created_at')
    .eq('role', 'observer')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Observers fetch error:', error);
    throw error;
  }
  
  return observers;
}

export async function fetchCommunicationsData() {
  const config = getSupabaseConfig();
  const supabase = createClient(config.url, config.serviceRoleKey);
  
  const { data: comms, error } = await supabase
    .from('communications')
    .select('id, campaign_name, message_content, target_audience, status, sent_count, delivered_count, failed_count, created_at, sent_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Communications fetch error:', error);
    throw error;
  }
  
  return comms;
}

export async function importDataToSupabase(dataType: string, records: any[]) {
  const config = getSupabaseConfig();
  const supabase = createClient(config.url, config.serviceRoleKey);
  
  let tableName = '';
  let processedRecords = records;
  
  switch (dataType) {
    case 'reports':
      tableName = 'observation_reports';
      // Ensure required fields are present
      processedRecords = records.filter(record => record.report_text && record.observer_id);
      break;
    case 'observers':
      tableName = 'profiles';
      // Ensure required fields are present and set role
      processedRecords = records.filter(record => record.name && record.email).map(record => ({
        ...record,
        role: record.role || 'observer'
      }));
      break;
    case 'communications':
      tableName = 'communications';
      // Ensure required fields are present
      processedRecords = records.filter(record => record.campaign_name && record.message_content);
      break;
    default:
      throw new Error(`Invalid data type: ${dataType}`);
  }

  if (processedRecords.length === 0) {
    throw new Error('No valid records found to import. Please check the data format.');
  }

  const { error } = await supabase
    .from(tableName)
    .upsert(processedRecords, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return processedRecords.length;
}
