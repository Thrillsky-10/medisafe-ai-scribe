
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as pdfMake from "https://esm.sh/pdfmake@0.2.7/build/pdfmake.min.js";
import * as pdfFonts from "https://esm.sh/pdfmake@0.2.7/build/vfs_fonts.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set up Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize pdfMake with virtual fonts
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Parse the request body
    const body = await req.json();
    const { 
      patient,
      medications,
      prescriptionDate,
      notes,
      signature,
      doctorSettings
    } = body;
    
    console.log("Generating PDF for patient:", patient.name);
    
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileName = `prescription_${patient.id}_${timestamp}.pdf`;
    const filePath = `prescriptions/${fileName}`;
    
    // Create PDF definition
    const docDefinition = createPrescriptionDoc(
      patient,
      medications,
      prescriptionDate,
      notes,
      signature,
      doctorSettings
    );
    
    // Generate the PDF
    const pdfDoc = (pdfMake as any).createPdf(docDefinition);
    
    // Get PDF as base64
    const pdfBase64 = await new Promise<string>((resolve) => {
      pdfDoc.getBase64((data: string) => {
        resolve(data);
      });
    });
    
    // Convert base64 to Uint8Array
    const base64Data = pdfBase64.split(',')[1] || pdfBase64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Upload PDF to Supabase Storage
    const { data, error } = await supabase.storage
      .from('prescription-documents')
      .upload(filePath, bytes, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('prescription-documents')
      .getPublicUrl(filePath);
    
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrlData.publicUrl,
        path: filePath
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate prescription PDF"
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  }
});

// Function to create PDF definition
function createPrescriptionDoc(
  patient: any,
  medications: any[],
  prescriptionDate: string,
  notes: string,
  signature: string,
  doctorSettings: any
) {
  const formattedDate = new Date(prescriptionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Set hospital info based on settings or defaults
  const hospitalName = doctorSettings?.hospital_name || "General Hospital";
  const hospitalAddress = doctorSettings?.hospital_address || "123 Medical Center Blvd, Healthcare City";
  const hospitalPhone = doctorSettings?.hospital_phone || "555-123-4567";
  const doctorName = doctorSettings?.doctor_name || "Dr. Medical Professional";
  const doctorQualifications = doctorSettings?.doctor_qualifications || "MD";
  
  // Generate a prescription ID
  const prescriptionId = `RX-${Date.now().toString().slice(-8)}`;
  
  // Create the PDF definition
  return {
    content: [
      // Header with hospital info
      {
        columns: [
          // Hospital logo would go here if available
          doctorSettings?.logo_url ? {
            image: doctorSettings.logo_url,
            width: 100,
            margin: [0, 0, 20, 0]
          } : {},
          {
            stack: [
              { text: hospitalName, style: 'header' },
              { text: hospitalAddress, style: 'subheader' },
              { text: `Phone: ${hospitalPhone}`, style: 'subheader' }
            ],
            alignment: 'center'
          },
          {
            text: `Prescription ID: ${prescriptionId}`,
            alignment: 'right',
            margin: [0, 5, 0, 0]
          }
        ]
      },
      
      // Divider
      { 
        canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2*40, y2: 5, lineWidth: 1 }],
        margin: [0, 10, 0, 10]
      },
      
      // Patient Info Section
      {
        text: 'Patient Information',
        style: 'sectionHeader',
        margin: [0, 0, 0, 5]
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: `Name: ${patient.name}`, margin: [0, 0, 0, 5] },
              { text: `Mobile: ${patient.mobile}`, margin: [0, 0, 0, 5] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: `Date: ${formattedDate}`, margin: [0, 0, 0, 5] },
              { text: `Patient ID: ${patient.id}`, margin: [0, 0, 0, 5] }
            ]
          }
        ],
        margin: [0, 0, 0, 15]
      },
      
      // Rx Symbol
      {
        text: 'Rx',
        style: 'rxSymbol',
        margin: [0, 0, 0, 10]
      },
      
      // Medications
      {
        text: 'Medications:',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      ...medications.map((med, index) => ({
        margin: [0, 0, 0, 10],
        stack: [
          { 
            text: `${index + 1}. ${med.name}`, 
            style: 'medicationName',
            margin: [0, 0, 0, 5]
          },
          {
            margin: [15, 0, 0, 0],
            stack: [
              { text: `Dosage: ${med.dosage}`, margin: [0, 0, 0, 3] },
              { text: `Frequency: ${med.frequency}`, margin: [0, 0, 0, 3] },
              { text: `Duration: ${med.duration}`, margin: [0, 0, 0, 3] }
            ]
          }
        ]
      })),
      
      // Notes section if provided
      notes ? {
        stack: [
          { 
            text: 'Special Instructions:', 
            style: 'sectionHeader',
            margin: [0, 10, 0, 5]
          },
          {
            text: notes,
            margin: [0, 0, 0, 15],
            style: 'notes'
          }
        ]
      } : {},
      
      // Signature section
      {
        columns: [
          {},
          {
            stack: [
              {
                text: 'Doctor\'s Signature:',
                margin: [0, 20, 0, 5],
                alignment: 'right'
              },
              signature.startsWith('data:image') || signature.startsWith('http') ? {
                image: signature,
                width: 150,
                alignment: 'right',
                margin: [0, 0, 0, 5]
              } : {
                text: signature,
                style: 'signature',
                alignment: 'right',
                margin: [0, 10, 0, 5]
              },
              {
                text: doctorName,
                alignment: 'right'
              },
              {
                text: doctorQualifications,
                style: 'qualifications',
                alignment: 'right'
              }
            ],
            width: '50%'
          }
        ]
      },
      
      // Footer
      {
        text: 'This is a digital prescription generated electronically.',
        style: 'footer',
        margin: [0, 50, 0, 0]
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      subheader: {
        fontSize: 10,
        color: '#666'
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        decoration: 'underline'
      },
      rxSymbol: {
        fontSize: 16,
        bold: true,
        italics: true
      },
      medicationName: {
        fontSize: 12,
        bold: true
      },
      notes: {
        fontSize: 10,
        italics: true
      },
      signature: {
        fontSize: 14,
        italics: true,
        font: 'Times'
      },
      qualifications: {
        fontSize: 10,
        italics: true
      },
      footer: {
        fontSize: 8,
        color: '#777',
        alignment: 'center'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  };
}
