import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient({
  // Google Cloud automatically uses GOOGLE_APPLICATION_CREDENTIALS environment variable
  // Make sure you have this set up in your environment
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Perform text detection on the image
    const [result] = await client.textDetection(buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return NextResponse.json(
        { error: 'No text found in the image' },
        { status: 400 }
      );
    }

    // The first annotation contains the entire text
    const fullText = detections[0]?.description || '';

    // Parse the receipt text to extract line items
    const parsedReceipt = parseReceiptText(fullText);

    return NextResponse.json({
      success: true,
      fullText,
      items: parsedReceipt.items,
      subtotal: parsedReceipt.subtotal,
      tax: parsedReceipt.tax,
      tip: parsedReceipt.tip,
      total: parsedReceipt.total,
    });

  } catch (error) {
    console.error('Receipt scanning error:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

interface ParsedReceipt {
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
}

function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const items: ReceiptItem[] = [];
  let subtotal: number | null = null;
  let tax: number | null = null;
  let tip: number | null = null;
  let total: number | null = null;

  // Regular expressions for matching prices
  const priceRegex = /\$?\s*(\d+\.\d{2})/;
  const subtotalRegex = /subtotal|sub\s*total/i;
  const taxRegex = /tax|hst|gst|pst/i;
  const tipRegex = /tip|gratuity/i;
  const totalRegex = /total|amount|balance/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check for total, subtotal, tax, tip
    const priceMatch = line.match(priceRegex);
    
    if (priceMatch) {
      const amount = parseFloat(priceMatch[1]);

      if (totalRegex.test(lowerLine) && !subtotalRegex.test(lowerLine)) {
        total = amount;
      } else if (subtotalRegex.test(lowerLine)) {
        subtotal = amount;
      } else if (taxRegex.test(lowerLine)) {
        tax = amount;
      } else if (tipRegex.test(lowerLine)) {
        tip = amount;
      } else {
        // This might be a regular item
        // Try to extract item name (everything before the price)
        const itemName = line.replace(priceRegex, '').trim();
        
        // Skip if the line looks like metadata (date, receipt number, etc.)
        if (itemName.length > 1 && !/(receipt|order|#|date|time)/i.test(itemName)) {
          // Check if there's a quantity indicator (e.g., "2x" or "x2")
          const quantityMatch = itemName.match(/(\d+)\s*x|x\s*(\d+)/i);
          const quantity = quantityMatch ? parseInt(quantityMatch[1] || quantityMatch[2]) : 1;
          
          items.push({
            name: itemName.replace(/(\d+)\s*x|x\s*(\d+)/i, '').trim(),
            price: amount,
            quantity,
          });
        }
      }
    }
  }

  return {
    items,
    subtotal,
    tax,
    tip,
    total,
  };
}
