
interface MedicalApiResponse {
  count: number;
  terms: string[];
}

export async function searchMedications(query: string): Promise<string[]> {
  try {
    // Clinical Tables Search Service API
    const url = `https://clinicaltables.nlm.nih.gov/api/drugs/v3/search?terms=${encodeURIComponent(query)}&ef=DISPLAY_NAME`;
    
    const response = await fetch(url);
    const data = await response.json() as [number, string[], Array<string[]>, {}[]];
    
    // API returns data in the format [count, terms, [...], [...]]
    // We only need the terms array
    return data[1] || [];
  } catch (error) {
    console.error('Error searching medications:', error);
    return [];
  }
}

export async function getCommonMedications(): Promise<string[]> {
  // Return a list of common medications for initial display
  return [
    "Acetaminophen",
    "Amoxicillin",
    "Atorvastatin",
    "Azithromycin",
    "Cephalexin",
    "Ciprofloxacin",
    "Hydrochlorothiazide",
    "Ibuprofen",
    "Levothyroxine",
    "Lisinopril",
    "Metformin",
    "Omeprazole",
    "Prednisone",
    "Sertraline"
  ];
}
