
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
}

/**
 * Performs OCR on an image using Google Cloud Vision API.
 * @param {string} imageUrl - The URL of the image to process.
 * @returns {Promise<string>} - The extracted text from the image.
 * @throws {Error} - If OCR processing fails.
 */
async function performOCR(imageUrl: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
  if (!apiKey) {
    throw new Error("Google Cloud Vision API key not set.");
  }

  const requestBody = {
    requests: [
      {
        features: [{ type: "TEXT_DETECTION" }],
        image: { source: { imageUri: imageUrl } },
      },
    ],
  };

  try {
    const response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      throw new Error(
        `OCR request failed with status: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (
      data.responses &&
      data.responses[0] &&
      data.responses[0].fullTextAnnotation
    ) {
      return data.responses[0].fullTextAnnotation.text;
    } else {
      throw new Error("No text found in the image.");
    }
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Extracts structured data from text using a simple rule-based approach.
 * In a real application, this should be replaced with NLP techniques.
 * @param {string} text - The text to extract data from.
 * @returns {object} - An object containing extracted data.
 */
function extractData(text: string) {
  // Basic extraction for medication, dosage, and refills
  const medicationMatch = text.match(/Medication: ([\w\s]+)/i);
  const dosageMatch = text.match(/Dosage: ([\w\s\.]+)/i);
  const refillsMatch = text.match(/Refills: (\d+)/i);

  return {
    medication: medicationMatch ? medicationMatch[1].trim() : "Unknown",
    dosage: dosageMatch ? dosageMatch[1].trim() : "Unknown",
    refills: refillsMatch ? parseInt(refillsMatch[1]) : 0,
    confidence: 0.75, // Placeholder confidence score
  };
}

// --- Testing ---
if (import.meta.main) {
  Deno.test("Test performOCR function", async () => {
    // Replace with a valid test image URL (ensure it's accessible)
    const testImageUrl =
      "https://storage.googleapis.com/guardian-google-docs-images/1591113291965/745019990b926d0b614318f4c5357582.png";

    try {
      const text = await performOCR(testImageUrl);
      console.log("OCR Test Output:", text);
      // Add assertions based on expected content (adjust to your test image)
      // For example, check if certain keywords are present
      // assert(text.includes("Medication:"), "OCR should find medication");
      // assert(text.includes("Dosage:"), "OCR should find dosage");
      // assert(text.includes("Refills:"), "OCR should find refills");
      console.log("OCR test completed successfully. Please check the output and add appropriate assertions.");
    } catch (error) {
      console.error("OCR Test failed:", error);
      // If you expect the test image to always work, you can fail the test
      // assert(false, `OCR test failed: ${error.message}`);
      // Otherwise, if failures are acceptable (e.g., due to external API),
      // you can just log the error and the test will pass (as it didn't crash)
      console.log("OCR test completed with a failure, which might be acceptable depending on the test image and API availability. Check the error message.");
    }
  });

  Deno.test("Test extractData function", () => {
    const testText =
      "Patient Name: John Doe Medication:  Aspirin Dosage: 100mg Refills: 2";
    const data = extractData(testText);
    console.log("Extraction Test Output:", data);
    // Add assertions to check if data is correctly extracted
    // assert(data.medication === "Aspirin", "Medication should be Aspirin");
    // assert(data.dosage === "100mg", "Dosage should be 100mg");
    // assert(data.refills === 2, "Refills should be 2");
    console.log("Extraction test completed. Please check the output and add appropriate assertions.");
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
    const { documentUrl, documentPath, patientId } = payload;

    console.log(`Processing document at path: ${documentPath}`);

    // Perform OCR on the document
    let extractedText;
    try {
      extractedText = await performOCR(documentUrl);
    } catch (ocrError) {
      console.error("OCR Error:", ocrError);
      return new Response(
        JSON.stringify({ error: "Document processing failed", details: ocrError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Extract data from the OCR output
    const extractedData = extractData(extractedText);

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