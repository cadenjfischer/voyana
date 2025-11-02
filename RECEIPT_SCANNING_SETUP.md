# Google Cloud Vision API Setup for Receipt Scanning

## Quick Setup Steps

### 1. Get Your Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the Vision API:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "voyana-receipt-scanner")
   - Click "Create and Continue"
   - Grant role: "Cloud Vision API User"
   - Click "Continue" then "Done"

5. Create a Key:
   - Click on your new service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Click "Create" (a JSON file will download)

### 2. Add Credentials to Your Project

**Option A: Using the JSON file (Recommended)**

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Add it to your `.env.local` file on a single line:

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Option B: Using Individual Fields**

Alternatively, you can extract these fields from the JSON and add them separately:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

### 3. Restart Your Development Server

After adding the credentials, restart your Next.js dev server:

```bash
npm run dev
```

### 4. Deploy to Vercel

When deploying to Vercel:

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add the same `GOOGLE_APPLICATION_CREDENTIALS_JSON` variable
4. Paste the full JSON as the value
5. Redeploy your site

## Testing

1. Go to your budget page
2. Click "Scan receipt"
3. Upload a photo of a receipt
4. The API should scan and itemize the receipt

## Troubleshooting

### "Failed to scan receipt"
- Check that the Vision API is enabled in your Google Cloud project
- Verify your credentials are correctly copied (no line breaks in the JSON)
- Check the browser console for detailed error messages

### "Module not found: @google-cloud/vision"
- Run `npm install @google-cloud/vision`
- Restart your dev server

### "Authentication error"
- Make sure the service account has "Cloud Vision API User" role
- Check that private key includes the line breaks (`\n`)
- Verify the JSON is valid (no missing quotes or commas)

## Cost

Google Cloud Vision API pricing:
- First 1,000 text detection requests per month: FREE
- After that: $1.50 per 1,000 requests

For typical usage (scanning receipts occasionally), you'll likely stay within the free tier.

## Security Note

⚠️ **Never commit your `.env.local` file or credentials to Git!**

The `.env.local` file should already be in your `.gitignore`.
