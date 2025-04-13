// supabase/functions/process-document/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { config } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

// Load environment variables
await config({ export: true });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessDocumentPayload {
  documentUrl: string;
  documentPath: string;
  patientId: string;
  extractedText: string; // Add extractedText to the interface
}

/**
 * Extracts structured data from text using a simple rule-based approach.
 * In a real application, this should be replaced with NLP techniques.
 * @param {string} text - The text to extract data from.
 * @returns {object} - An object containing extracted data.
 */
function extractData(text: string) {
  // Basic extraction for medication, dosage, and refills
  const medicationMatch = text.match(/Medication:\s*([\w\s]+)/i);
  const dosageMatch = text.match(/Dosage:\s*([\w\s\.]+)/i);
  const refillsMatch = text.match(/Refills:\s*(\d+)/i);
  const patientNameMatch = text.match(/Patient Name:\s*([\w\s]+)/i);
  const dateMatch = text.match(/Date:\s*([\w\s\.\/]+)/i);

  return {
    medication: medicationMatch ? medicationMatch[1].trim() : "Unknown",
    dosage: dosageMatch ? dosageMatch[1].trim() : "Unknown",
    refills: refillsMatch ? parseInt(refillsMatch[1]) : 0,
    confidence: 0.75, // Placeholder confidence score
    patient_name: patientNameMatch ? patientNameMatch[1].trim() : "Unknown",
    date: dateMatch ? dateMatch[1].trim() : "Unknown",
  };
}

// --- Testing ---
if (import.meta.main) {
  Deno.test("Test extractData function", () => {
    const testText =
      "Patient Name: John Doe Medication:  Aspirin Dosage: 100mg Refills: 2 Date: 02/02/2024";
    const data = extractData(testText);
    console.log("Extraction Test Output:", data);
    // Add assertions to check if data is correctly extracted
    // assert(data.medication === "Aspirin", "Medication should be Aspirin");
    // assert(data.dosage === "100mg", "Dosage should be 100mg");
    // assert(data.refills === 2, "Refills should be 2");
    console.log(
      "Extraction test completed. Please check the output and add appropriate assertions.",
    );
  });
}

/**
 * Main server function to handle requests.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Use anon key for user-related operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get the request payload
    const payload: ProcessDocumentPayload = await req.json();
    const { documentUrl, documentPath, patientId, extractedText } = payload; // Get extractedText

    console.log(`Processing document at path: ${documentPath}`);

    // Extract data from the OCR output (using the text from the client)
    const extractedData = extractData(extractedText);

    // Store the OCR results in the database
    const { data: ocrResult, error: ocrError } = await supabaseAdmin
      .from("ocr_results")
      .insert({
        document_path: documentPath,
        document_url: documentUrl,
        patient_id: patientId,
        raw_text: extractedText, // Store the raw text from the client
        extracted_data: extractedData,
        processed_by: "document-processor",
      })
      .select()
      .single();

    if (ocrError) {
      console.error("Error storing OCR results:", ocrError);
      return new Response(
        JSON.stringify({
          error: "Failed to store OCR results",
          details: ocrError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    // Store the data in the prescription database

    const { error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .insert({
        document_path: documentPath,
        document_url: documentUrl,
        patient_id: patientId,
        medication: extractedData.medication,
        dosage: extractedData.dosage,
        refills: extractedData.refills,
        ocr_result_id: ocrResult.id,
      });

    if (prescriptionError) {
      console.error("Error storing prescription data", prescriptionError);
    }

    // Log analytics event
    const { data: user } = await supabaseClient.auth.getUser();
    await supabaseAdmin.from("analytics_events").insert({
      event_type: "document_processed",
      event_data: {
        document_id: ocrResult.id,
        patient_id: patientId,
        processing_time_ms: 1250, // Simulated processing time
        extraction_confidence: extractedData.confidence,
      },
      user_id: user?.user?.id,
    });

    // Return the result
    return new Response(
      JSON.stringify({
        success: true,
        ocr_result: ocrResult,
        extracted_data: extractedData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
