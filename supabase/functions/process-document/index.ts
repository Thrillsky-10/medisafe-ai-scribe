
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessDocumentPayload {
  documentUrl: string;
  documentPath: string;
  patientId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the request payload
    const payload: ProcessDocumentPayload = await req.json();
    const { documentUrl, documentPath, patientId } = payload;

    // Simulate OCR processing
    console.log(`Processing document at path: ${documentPath}`);
    
    // In a real implementation, you would use an OCR API like Google Vision, AWS Textract, etc.
    // For this demo, we'll simulate the OCR process with sample extracted data
    const extractedText = "Sample prescription for patient. Medication: Lisinopril. Dosage: 10mg daily. Refills: 3.";
    
    // Extract structured data using a basic rule-based approach
    // In a real implementation, you'd use NLP or a more sophisticated method
    const medicationMatch = extractedText.match(/Medication: ([^.]+)/);
    const dosageMatch = extractedText.match(/Dosage: ([^.]+)/);
    const refillsMatch = extractedText.match(/Refills: (\d+)/);
    
    const extractedData = {
      medication: medicationMatch ? medicationMatch[1] : "Unknown",
      dosage: dosageMatch ? dosageMatch[1] : "Unknown",
      refills: refillsMatch ? parseInt(refillsMatch[1]) : 0,
      confidence: 0.85,
      processed_timestamp: new Date().toISOString()
    };

    // Store the OCR results in the database
    const { data: ocrResult, error: ocrError } = await supabaseClient
      .from("ocr_results")
      .insert({
        document_path: documentPath,
        document_url: documentUrl,
        patient_id: patientId,
        raw_text: extractedText,
        extracted_data: extractedData,
        processed_by: "document-processor"
      })
      .select()
      .single();

    if (ocrError) {
      console.error("Error storing OCR results:", ocrError);
      return new Response(
        JSON.stringify({ error: "Failed to store OCR results" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log analytics event
    await supabaseClient
      .from("analytics_events")
      .insert({
        event_type: "document_processed",
        event_data: {
          document_id: ocrResult.id,
          patient_id: patientId,
          processing_time_ms: 1250, // Simulated processing time
          extraction_confidence: extractedData.confidence,
        },
        user_id: (await supabaseClient.auth.getUser()).data.user?.id
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        ocr_result: ocrResult,
        extracted_data: extractedData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
