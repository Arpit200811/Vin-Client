export function validateVIN(text: string): string | null {
  const cleanText = text.replace(/\s+/g, '').toUpperCase();
  const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
  const matches = cleanText.match(vinPattern);
  if (matches && matches.length > 0) {
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
  if (/[IOQ]/.test(vin)) {
    return false;
  }
  return true;
}
export function formatVIN(vin: string): string {
  // Format VIN for display (could add hyphens or spaces if needed)
  return vin.toUpperCase();
}
