import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import { createClient } from '@/lib/supabase/server';

// Initialize the Vision API client
const getVisionClient = () => {
  // Option 1: Use credentials JSON from environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      return new vision.ImageAnnotatorClient({
        credentials,
      });
    } catch (error) {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
    }
  }

  // Option 2: Use individual credential fields
  if (process.env.GOOGLE_CLOUD_PROJECT_ID && 
      process.env.GOOGLE_CLOUD_CLIENT_EMAIL && 
      process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
    return new vision.ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  // Option 3: Use default credentials (when running locally with gcloud auth or on GCP)
  return new vision.ImageAnnotatorClient();
};

export async function POST(request: NextRequest) {
  try {
    const client = getVisionClient();
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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

    // Sanitize filename (remove spaces and special characters, keep extension)
    const sanitizedFileName = file.name
      .replace(/\s+/g, '-')  // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '');  // Remove special characters except dots and hyphens
    
    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      // Continue with OCR even if upload fails
    }

    // Get public URL for the uploaded image
    let imageUrl: string | null = null;
    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    // Call Vision API for text extraction
    const [result] = await client.textDetection(buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return NextResponse.json(
        { error: 'No text detected in image' },
        { status: 400 }
      );
    }

    // The first annotation contains the full text
    const fullText = detections[0].description || '';

    // Log the raw text for debugging
    console.log('=== RAW OCR TEXT ===');
    console.log(fullText);
    console.log('===================');

    // Parse the receipt text with improved logic
    const parsedReceipt = parseReceiptText(fullText);

    console.log('=== PARSED RESULT ===');
    console.log(JSON.stringify(parsedReceipt, null, 2));
    console.log('====================');

    return NextResponse.json({
      fullText,
      imageUrl, // Include the Supabase image URL
      ...parsedReceipt,
    });

  } catch (error) {
    console.error('Error scanning receipt:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

interface ParsedReceipt {
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
}

function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const result: ParsedReceipt = {
    items: [],
  };

  // Match standalone prices
  const standalonePrice = /^\$?\s*(\d+\.?\d{0,2})$/;
  
  // Keywords to identify special lines
  const subtotalKeywords = /subtotal|sub\s*total/i;
  const taxKeywords = /\btax\b/i;
  const tipKeywords = /\btip\b|gratuity/i;
  const totalKeywords = /total\s*due|total/i;
  
  // Skip these lines entirely
  const skipPatterns = [
    /guest|gst/i,
    /table|tbl/i,
    /server|check|chk/i,
    /martin/i,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /\d{1,2}:\d{2}(am|pm)?/i,
    /thank\s*you/i,
    /dining/i,
    /suggested|recommend/i,  // Skip "suggested tip" lines
    /appreciated|appreciate/i,  // Skip "tips appreciated" lines
    /18%|20%|22%|15%|25%/,  // Skip percentage tip suggestions
    /^\d{2,3}$/,  // Just 2-3 digits (like table numbers)
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip certain patterns
    if (skipPatterns.some(pattern => pattern.test(line))) {
      continue;
    }

    const lineLower = line.toLowerCase();

    // Check for subtotal
    if (subtotalKeywords.test(line)) {
      // Price might be on same line or next line
      const priceMatch = line.match(/(\d+\.?\d{0,2})$/);
      if (priceMatch) {
        result.subtotal = parseFloat(priceMatch[1]);
      } else if (i + 1 < lines.length) {
        const nextLinePrice = lines[i + 1].match(standalonePrice);
        if (nextLinePrice) {
          result.subtotal = parseFloat(nextLinePrice[1]);
          i++; // Skip the next line
        }
      }
      continue;
    }

    // Check for tax
    if (taxKeywords.test(line)) {
      const priceMatch = line.match(/(\d+\.?\d{0,2})$/);
      if (priceMatch) {
        result.tax = parseFloat(priceMatch[1]);
      } else if (i + 1 < lines.length) {
        const nextLinePrice = lines[i + 1].match(standalonePrice);
        if (nextLinePrice) {
          result.tax = parseFloat(nextLinePrice[1]);
          i++;
        }
      }
      continue;
    }

    // Check for tip (ONLY if it's actually part of the total, not a suggestion)
    // Skip ALL tip/gratuity lines since they're almost always suggestions
    // Users will manually add their own tip
    if (tipKeywords.test(line)) {
      // Skip this line - tips are user-set only
      continue;
    }

    // Check for total
    if (totalKeywords.test(line)) {
      const priceMatch = line.match(/(\d+\.?\d{0,2})$/);
      if (priceMatch) {
        result.total = parseFloat(priceMatch[1]);
      } else if (i + 1 < lines.length) {
        const nextLinePrice = lines[i + 1].match(standalonePrice);
        if (nextLinePrice) {
          result.total = parseFloat(nextLinePrice[1]);
          i++;
        }
      }
      continue;
    }

    // Try to parse as item name, with price on next line
    // Check if next line is a standalone price
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const priceMatch = nextLine.match(standalonePrice);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        
        // Skip if price is too high (likely a total we missed)
        if (price > 500) continue;
        
        let itemName = line;
        let quantity: number | undefined = undefined;

        // Check for quantity at the start
        const qtyMatch = itemName.match(/^(\d+)\s+(.+)$/);
        if (qtyMatch) {
          const qty = parseInt(qtyMatch[1]);
          if (qty >= 1 && qty <= 20) {
            quantity = qty;
            itemName = qtyMatch[2].trim();
          }
        }

        // Clean up item name
        itemName = itemName
          .replace(/^[-*•:]+\s*/, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Validate item name (must be reasonable length and not just numbers)
        if (itemName.length >= 3 && itemName.length <= 60 && !/^\d+$/.test(itemName)) {
          result.items.push({
            name: itemName,
            price: price,
            ...(quantity && quantity > 1 && { quantity }),
          });
          
          i++; // Skip the price line since we've consumed it
        }
      }
    }
  }

  return result;
}
