
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
  extractedText: string;
}

/**
 * Extracts structured data from text using a more comprehensive rule-based approach.
 * @param {string} text - The text to extract data from.
 * @returns {object} - An object containing extracted data.
 */
function extractData(text: string) {
  // More comprehensive regex patterns for better extraction
  const medicationMatch = text.match(/medication:?\s*([\w\s\-]+)/i) || 
                         text.match(/med:?\s*([\w\s\-]+)/i) ||
                         text.match(/prescribed:?\s*([\w\s\-]+)/i) ||
                         text.match(/drug:?\s*([\w\s\-]+)/i) ||
                         text.match(/rx:?\s*([\w\s\-]+)/i);
  
  const dosageMatch = text.match(/dosage:?\s*([\w\s\.\/\-]+)/i) || 
                     text.match(/dose:?\s*([\w\s\.\/\-]+)/i) ||
                     text.match(/take:?\s*([\w\s\.\/\-]+)/i) ||
                     text.match(/sig:?\s*([\w\s\.\/\-]+)/i) ||
                     text.match(/(\d+\s*mg|\d+\s*ml|\d+\s*tablet|\d+\s*cap|once daily|twice daily|three times daily|every \d+ hours)/i);
  
  const refillsMatch = text.match(/refill[s]?:?\s*(\d+)/i) || 
                      text.match(/repeats:?\s*(\d+)/i) ||
                      text.match(/repeat:?\s*(\d+)/i) ||
                      text.match(/qty:?\s*(\d+)/i);
  
  const patientNameMatch = text.match(/patient\s*name:?\s*([\w\s\.]+)/i) || 
                          text.match(/name:?\s*([\w\s\.]+)/i) ||
                          text.match(/patient:?\s*([\w\s\.]+)/i);
  
  const dateMatch = text.match(/date:?\s*([\w\s\.\/\-]+)/i) ||
                   text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);

  // Look for common medication names in the text when no medication is found
  let medicationName = medicationMatch ? medicationMatch[1].trim() : null;
  
  if (!medicationName) {
    const commonMeds = [
      'Lisinopril', 'Metformin', 'Amlodipine', 'Metoprolol', 'Atorvastatin',
      'Levothyroxine', 'Simvastatin', 'Omeprazole', 'Losartan', 'Albuterol',
      'Gabapentin', 'Hydrochlorothiazide', 'Sertraline', 'Amoxicillin'
    ];
    
    for (const med of commonMeds) {
      if (text.toLowerCase().includes(med.toLowerCase())) {
        medicationName = med;
        break;
      }
    }
  }

  // Calculate confidence score based on how many fields were successfully extracted
  let extractedFields = 0;
  let totalFields = 4; // medication, dosage, refills, date
  
  if (medicationName) extractedFields++;
  if (dosageMatch) extractedFields++;
  if (refillsMatch) extractedFields++;
  if (dateMatch) extractedFields++;
  
  const confidence = extractedFields / totalFields;

  return {
    medication: medicationName || "Unknown",
    dosage: dosageMatch ? dosageMatch[1].trim() : "Unknown",
    refills: refillsMatch ? parseInt(refillsMatch[1]) : 0,
    confidence: confidence,
    patient_name: patientNameMatch ? patientNameMatch[1].trim() : "Unknown",
    date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString(),
  };
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
    console.log("Process document function called");
    
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the request payload
    const payload: ProcessDocumentPayload = await req.json();
    const { documentUrl, documentPath, patientId, extractedText } = payload;

    console.log(`Processing document for patient: ${patientId}`);
    console.log(`Document path: ${documentPath}`);
    console.log(`Text length: ${extractedText.length} characters`);
    console.log("Extracted text sample:", extractedText.substring(0, 200));

    // Extract data from the OCR output
    const extractedData = extractData(extractedText);
    console.log("Extracted data:", JSON.stringify(extractedData));

    // Store the OCR results in the database
    const { data: ocrResult, error: ocrError } = await supabaseAdmin
      .from("ocr_results")
      .insert({
        document_path: documentPath,
        document_url: documentUrl,
        patient_id: patientId,
        raw_text: extractedText,
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

    console.log("OCR result stored with ID:", ocrResult.id);

    // Store the data in the prescription database
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .insert({
        document_path: documentPath,
        document_url: documentUrl,
        patient_id: patientId,
        medication: extractedData.medication,
        dosage: extractedData.dosage,
        refills: extractedData.refills,
        ocr_result_id: ocrResult.id,
        prescribed_date: extractedData.date !== "Unknown" ? extractedData.date : new Date().toLocaleDateString(),
        status: 'active'
      })
      .select()
      .single();

    if (prescriptionError) {
      console.error("Error storing prescription data:", prescriptionError);
      return new Response(
        JSON.stringify({
          error: "Failed to store prescription data",
          details: prescriptionError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("Prescription stored with ID:", prescription.id);

    // Log analytics event
    await supabaseAdmin.from("analytics_events").insert({
      event_type: "document_processed",
      event_data: {
        document_id: ocrResult.id,
        patient_id: patientId,
        processing_time_ms: 1250, // Simulated processing time
        extraction_confidence: extractedData.confidence,
      },
    });

    // Return the result
    return new Response(
      JSON.stringify({
        success: true,
        ocr_result: ocrResult,
        prescription: prescription,
        extracted_data: extractedData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error processing document", 
        message: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
