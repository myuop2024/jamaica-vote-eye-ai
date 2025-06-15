
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
  
  console.log(`Processing ${records.length} records for import to ${dataType}`);
  
  let tableName = '';
  let processedRecords = [];
  
  switch (dataType) {
    case 'reports':
      tableName = 'observation_reports';
      // Process and validate reports data
      processedRecords = records
        .filter(record => record.report_text && record.report_text.trim() !== '')
        .map(record => ({
          id: record.id || undefined, // Let database generate if not provided
          observer_id: record.observer_id || null,
          report_text: record.report_text,
          station_id: record.station_id || null,
          status: record.status || 'submitted',
          created_at: record.created_at || new Date().toISOString(),
          updated_at: record.updated_at || new Date().toISOString()
        }));
      break;
      
    case 'observers':
      tableName = 'profiles';
      // Process and validate observers data
      processedRecords = records
        .filter(record => record.name && record.name.trim() !== '' && record.email && record.email.trim() !== '')
        .map(record => ({
          id: record.id || undefined, // Let database generate if not provided
          name: record.name,
          email: record.email,
          role: record.role || 'observer',
          phone_number: record.phone_number || null,
          assigned_station: record.assigned_station || null,
          verification_status: record.verification_status || 'pending',
          created_at: record.created_at || new Date().toISOString()
        }));
      break;
      
    case 'communications':
      tableName = 'communications';
      // Process and validate communications data
      processedRecords = records
        .filter(record => record.campaign_name && record.campaign_name.trim() !== '' && record.message_content && record.message_content.trim() !== '')
        .map(record => ({
          id: record.id || undefined, // Let database generate if not provided
          campaign_name: record.campaign_name,
          message_content: record.message_content,
          target_audience: record.target_audience || 'all',
          status: record.status || 'pending',
          sent_count: parseInt(record.sent_count) || 0,
          delivered_count: parseInt(record.delivered_count) || 0,
          failed_count: parseInt(record.failed_count) || 0,
          created_at: record.created_at || new Date().toISOString(),
          sent_at: record.sent_at || null,
          sent_by: record.sent_by || null
        }));
      break;
      
    default:
      throw new Error(`Invalid data type: ${dataType}`);
  }

  if (processedRecords.length === 0) {
    throw new Error(`No valid records found to import. Please check the data format and ensure required fields are present for ${dataType}.`);
  }

  console.log(`Importing ${processedRecords.length} processed records to ${tableName}`);

  // Use upsert to handle both inserts and updates
  const { data, error } = await supabase
    .from(tableName)
    .upsert(processedRecords, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error('Database import error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  console.log(`Successfully imported ${processedRecords.length} records`);
  return processedRecords.length;
}
