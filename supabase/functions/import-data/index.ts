import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportRequest {
  template_id?: string;
  source_type: string;
  entity_type: 'clients' | 'appointments' | 'services';
  location_id?: string;
  data: Record<string, any>[];
  column_mappings?: Record<string, string>;
}

interface ColumnMapping {
  source: string;
  target: string;
  required?: boolean;
  transform?: string;
}

function transformValue(value: any, transform?: string): any {
  if (value === null || value === undefined || value === '') return null;
  
  switch (transform) {
    case 'integer':
      return parseInt(value, 10) || 0;
    case 'decimal':
      return parseFloat(value) || 0;
    case 'boolean':
      return value === 'true' || value === '1' || value === true;
    case 'date':
      // Try to parse various date formats
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    case 'time':
      // Ensure time is in HH:MM:SS format
      if (typeof value === 'string' && value.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        const parts = value.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2] || '00'}`;
      }
      return value;
    default:
      return value;
  }
}

function mapRow(row: Record<string, any>, mappings: ColumnMapping[]): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  for (const mapping of mappings) {
    const sourceValue = row[mapping.source];
    mapped[mapping.target] = transformValue(sourceValue, mapping.transform);
  }
  
  return mapped;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    const importData: ImportRequest = await req.json();
    const { template_id, source_type, entity_type, location_id, data, column_mappings } = importData;

    if (!entity_type || !data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Missing required fields: entity_type, data (non-empty array)");
    }

    console.log(`Starting import: ${entity_type} from ${source_type}, ${data.length} rows`);

    // Get column mappings from template or request
    let mappings: ColumnMapping[] = [];
    
    if (template_id) {
      const { data: template, error: templateError } = await supabase
        .from('import_templates')
        .select('column_mappings')
        .eq('id', template_id)
        .single();
      
      if (templateError) throw new Error('Template not found');
      mappings = template.column_mappings as ColumnMapping[];
    } else if (column_mappings) {
      // Convert simple key-value mappings to ColumnMapping format
      mappings = Object.entries(column_mappings).map(([source, target]) => ({
        source,
        target: target as string,
      }));
    } else {
      throw new Error("Either template_id or column_mappings is required");
    }

    // Create import job record
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        template_id,
        source_type: source_type || 'generic',
        entity_type,
        location_id,
        total_rows: data.length,
        status: 'processing',
        started_at: new Date().toISOString(),
        created_by: userId,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job record:", jobError);
      throw new Error("Failed to create import job");
    }

    const jobId = job.id;
    const errors: any[] = [];
    const warnings: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      try {
        const mapped = mapRow(row, mappings);

        // Add import tracking fields
        mapped.external_id = mapped.external_id || null;
        mapped.import_source = source_type || 'csv';
        mapped.imported_at = new Date().toISOString();

        // Add location if provided
        if (location_id && entity_type !== 'services') {
          mapped.location_id = location_id;
        }

        // Validate required fields based on entity type
        let isValid = true;
        let validationError = '';

        switch (entity_type) {
          case 'clients':
            if (!mapped.first_name && !mapped.last_name) {
              isValid = false;
              validationError = 'Missing first_name and last_name';
            }
            break;
          case 'services':
            if (!mapped.name) {
              isValid = false;
              validationError = 'Missing service name';
            }
            if (!mapped.duration_minutes) {
              mapped.duration_minutes = 60; // Default duration
              warnings.push({ row: rowNum, message: 'Duration not specified, defaulting to 60 minutes' });
            }
            break;
          case 'appointments':
            if (!mapped.appointment_date || !mapped.start_time || !mapped.end_time) {
              isValid = false;
              validationError = 'Missing date or time fields';
            }
            break;
        }

        if (!isValid) {
          errors.push({ row: rowNum, error: validationError, data: row });
          errorCount++;
          continue;
        }

        // Insert into appropriate table
        const { error: insertError } = await supabase
          .from(entity_type)
          .insert(mapped);

        if (insertError) {
          // Check for duplicate
          if (insertError.code === '23505') {
            skipCount++;
            warnings.push({ row: rowNum, message: 'Duplicate record skipped' });
          } else {
            throw insertError;
          }
        } else {
          successCount++;
        }
      } catch (rowError: any) {
        errors.push({ row: rowNum, error: rowError.message, data: row });
        errorCount++;
      }

      // Update progress every 50 rows
      if (i % 50 === 0) {
        await supabase
          .from('import_jobs')
          .update({
            processed_rows: i + 1,
            success_count: successCount,
            error_count: errorCount,
            skip_count: skipCount,
          })
          .eq('id', jobId);
      }
    }

    // Update job with final results
    await supabase
      .from('import_jobs')
      .update({
        status: errorCount > 0 && successCount === 0 ? 'failed' : 'completed',
        processed_rows: data.length,
        success_count: successCount,
        error_count: errorCount,
        skip_count: skipCount,
        errors,
        warnings,
        completed_at: new Date().toISOString(),
        summary: {
          total: data.length,
          imported: successCount,
          skipped: skipCount,
          failed: errorCount,
        },
      })
      .eq('id', jobId);

    console.log(`Import completed: ${successCount} success, ${errorCount} errors, ${skipCount} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        summary: {
          total: data.length,
          imported: successCount,
          skipped: skipCount,
          failed: errorCount,
        },
        errors: errors.slice(0, 10), // Return first 10 errors
        warnings: warnings.slice(0, 10),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
