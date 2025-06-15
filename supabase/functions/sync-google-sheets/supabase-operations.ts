
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchReportsData() {
  const { data, error } = await supabase
    .from('observation_reports')
    .select(`
      id,
      report_text,
      status,
      station_id,
      location_data,
      attachments,
      created_at,
      updated_at,
      profiles!observer_id (
        id,
        name,
        email,
        role
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return data?.map(report => ({
    ID: report.id,
    'Observer Name': report.profiles?.name || 'Unknown',
    'Observer Email': report.profiles?.email || 'Unknown',
    'Report Text': report.report_text,
    'Status': report.status,
    'Station ID': report.station_id || '',
    'Location Data': JSON.stringify(report.location_data || {}),
    'Attachments': JSON.stringify(report.attachments || []),
    'Created At': report.created_at,
    'Updated At': report.updated_at
  })) || [];
}

export async function fetchObserversData() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return data?.map(profile => ({
    ID: profile.id,
    Name: profile.name,
    Email: profile.email,
    Role: profile.role,
    'Phone Number': profile.phone_number || '',
    'Verification Status': profile.verification_status,
    'Assigned Station': profile.assigned_station || '',
    Parish: profile.parish || '',
    Address: profile.address || '',
    'Bank Name': profile.bank_name || '',
    'Bank Account Number': profile.bank_account_number || '',
    'Bank Routing Number': profile.bank_routing_number || '',
    TRN: profile.trn || '',
    'Profile Image': profile.profile_image || '',
    'Created At': profile.created_at,
    'Last Login': profile.last_login || ''
  })) || [];
}

export async function fetchCommunicationsData() {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return data?.map(comm => ({
    ID: comm.id,
    'Campaign Name': comm.campaign_name,
    'Communication Type': comm.communication_type,
    'Target Audience': comm.target_audience,
    'Message Content': comm.message_content,
    Status: comm.status,
    'Sent Count': comm.sent_count || 0,
    'Delivered Count': comm.delivered_count || 0,
    'Failed Count': comm.failed_count || 0,
    'Target Filter': JSON.stringify(comm.target_filter || {}),
    'Scheduled At': comm.scheduled_at || '',
    'Sent At': comm.sent_at || '',
    'Created At': comm.created_at
  })) || [];
}

export async function importDataToSupabase(dataType: string, records: any[]): Promise<number> {
  if (!records || records.length === 0) {
    throw new Error('No data found to import');
  }

  console.log(`Importing ${records.length} records for ${dataType}`);

  switch (dataType) {
    case 'observers': {
      const profiles = records.map(record => ({
        name: record['Name'] || record['name'] || '',
        email: record['Email'] || record['email'] || '',
        role: record['Role'] || record['role'] || 'observer',
        phone_number: record['Phone Number'] || record['phone_number'] || null,
        verification_status: record['Verification Status'] || record['verification_status'] || 'pending',
        assigned_station: record['Assigned Station'] || record['assigned_station'] || null,
        parish: record['Parish'] || record['parish'] || null,
        address: record['Address'] || record['address'] || null,
        bank_name: record['Bank Name'] || record['bank_name'] || null,
        bank_account_number: record['Bank Account Number'] || record['bank_account_number'] || null,
        bank_routing_number: record['Bank Routing Number'] || record['bank_routing_number'] || null,
        trn: record['TRN'] || record['trn'] || null,
        profile_image: record['Profile Image'] || record['profile_image'] || null
      })).filter(profile => profile.name && profile.email);

      if (profiles.length === 0) {
        throw new Error('No valid observer records found. Make sure the sheet has Name and Email columns.');
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profiles, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (error) throw new Error(`Database error: ${error.message}`);
      return profiles.length;
    }

    case 'reports': {
      // For reports, we need to handle observer_id properly
      const reports = records.map(record => ({
        report_text: record['Report Text'] || record['report_text'] || '',
        status: record['Status'] || record['status'] || 'submitted',
        station_id: record['Station ID'] || record['station_id'] || null,
        location_data: record['Location Data'] ? JSON.parse(record['Location Data']) : null,
        attachments: record['Attachments'] ? JSON.parse(record['Attachments']) : []
      })).filter(report => report.report_text);

      if (reports.length === 0) {
        throw new Error('No valid report records found. Make sure the sheet has Report Text column.');
      }

      const { data, error } = await supabase
        .from('observation_reports')
        .insert(reports);

      if (error) throw new Error(`Database error: ${error.message}`);
      return reports.length;
    }

    case 'communications': {
      const communications = records.map(record => ({
        campaign_name: record['Campaign Name'] || record['campaign_name'] || '',
        communication_type: record['Communication Type'] || record['communication_type'] || 'sms',
        target_audience: record['Target Audience'] || record['target_audience'] || '',
        message_content: record['Message Content'] || record['message_content'] || '',
        status: record['Status'] || record['status'] || 'pending',
        target_filter: record['Target Filter'] ? JSON.parse(record['Target Filter']) : null
      })).filter(comm => comm.campaign_name && comm.message_content);

      if (communications.length === 0) {
        throw new Error('No valid communication records found. Make sure the sheet has Campaign Name and Message Content columns.');
      }

      const { data, error } = await supabase
        .from('communications')
        .insert(communications);

      if (error) throw new Error(`Database error: ${error.message}`);
      return communications.length;
    }

    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}
