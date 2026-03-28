/**
 * Mock OCR Service for Land Document Verification
 * In a real-world scenario, this would integrate with AWS Textract, Google Cloud Vision,
 * or utilize Tesseract.js to extract text from documents (PDFs/Images) and 
 * perform name matching / data validation.
 */
export const verifyDocumentWithOCR = async (documentPath, expectedName) => {
  // Simulate an async OCR process (network delay / processing time)
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`[OCR MOCK] Analyzing document: ${documentPath}`);
  console.log(`[OCR MOCK] Looking for name: ${expectedName}`);

  // For MVC/Demonstration purposes, we will return a mock success response
  // We can randomize it slightly to show failure cases if needed, but for now
  // returning success makes testing easier unless the name contains 'reject'.
  
  if (expectedName.toLowerCase().includes('reject')) {
    return {
      success: false,
      confidence: 30,
      extractedText: "Some random text. Name not found. Document unclear.",
      message: "OCR failed to match the owner's name on the document."
    };
  }

  return {
    success: true,
    confidence: 85 + Math.floor(Math.random() * 10), // Random confidence 85-94%
    extractedText: `... Name: ${expectedName} ... Survey No. 123 ...`,
    message: "Name matched successfully via OCR."
  };
};
