# Twilio Messaging Setup Guide

This guide will help you set up Twilio for the Messaging feature in Melo.

## Prerequisites

- Twilio account with active phone number
- Twilio Account SID and Auth Token

## Environment Variables

Add the following variables to your `backend/.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+18509898481
```

## Default Credentials (Already Configured)

The application has default Twilio credentials configured in the code:
- **Account SID**: `YOUR_TWILIO_ACCOUNT_SID`
- **Auth Token**: `YOUR_TWILIO_AUTH_TOKEN`
- **Phone Number**: `+18509898481`

If you want to use different credentials, add them to your `.env` file as shown above.

## Features

The Messaging feature allows you to:

1. **Manage Contacts**
   - Add, edit, and delete contacts
   - Store phone numbers, emails, and notes
   - View all contacts in a list

2. **Send SMS Messages**
   - Send text messages to any phone number
   - Messages are stored in the database

3. **Send MMS Messages**
   - Send messages with images or videos
   - Upload media files and attach them to messages
   - Supports images (JPG, PNG, GIF, WebP) and videos

## Phone Number Format

Phone numbers should be in E.164 format:
- **US/Canada**: `+1234567890` or `1234567890` (will auto-add +1)
- **International**: `+[country code][number]`

Examples:
- `+1234567890` ✅
- `1234567890` ✅ (will be converted to +11234567890)
- `+441234567890` ✅ (UK number)

## Twilio MMS Limitations

- **File Size**: Maximum 5MB per media file
- **Supported Formats**: 
  - Images: JPG, PNG, GIF, WebP
  - Videos: MP4, 3GP (check Twilio documentation for latest supported formats)
- **Multiple Media**: You can send up to 10 media files in a single MMS

## Troubleshooting

### "Invalid phone number format"
- Ensure the phone number is in E.164 format
- For US numbers, you can use `1234567890` or `+11234567890`

### "Failed to send SMS/MMS"
- Check your Twilio account balance
- Verify the phone number is valid and can receive SMS/MMS
- Check Twilio console for error logs

### "Media upload failed"
- Ensure file size is under 5MB for MMS
- Check that the file format is supported
- Verify the upload directory has write permissions

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control. The default credentials in the code are for development purposes only. For production, always use environment variables.

## Testing

1. Start both backend and frontend servers
2. Navigate to `/messaging` in your application
3. Add a contact with a valid phone number
4. Select the contact and send a test message

## Support

For Twilio-specific issues, refer to:
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio MMS Documentation](https://www.twilio.com/docs/sms/send-messages#send-an-mms-message)
- [Twilio Console](https://console.twilio.com/)







