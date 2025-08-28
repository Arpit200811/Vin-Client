export function validateVIN(text: string): string | null {
  // Remove any whitespace and convert to uppercase
  const cleanText = text.replace(/\s+/g, '').toUpperCase();
  
  // Look for 17-character alphanumeric sequences (excluding I, O, Q)
  const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
  const matches = cleanText.match(vinPattern);
  
  if (matches && matches.length > 0) {
    // Return the first valid VIN found
    for (const match of matches) {
      if (isValidVINFormat(match)) {
        return match;
      }
    }
  }
  
  return null;
}
function isValidVINFormat(vin: string): boolean {
  // Basic VIN validation rules
  if (vin.length !== 17) {
    return false;
  }
  // VINs cannot contain I, O, or Q
  if (/[IOQ]/.test(vin)) {
    return false;
  }
  // Additional basic validation could be added here
  // (check digit validation, position-specific rules, etc.)
  
  return true;
}

export function formatVIN(vin: string): string {
  // Format VIN for display (could add hyphens or spaces if needed)
  return vin.toUpperCase();
}
