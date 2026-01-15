# WhatsApp Content API Implementation

This implementation supports Twilio's WhatsApp Content API for sending template-based messages.

## Features

1. **Regular WhatsApp Messages**: Send text and media messages
2. **Content API Templates**: Send pre-approved WhatsApp message templates with variables

## Usage

### Regular WhatsApp Message

```javascript
// Frontend
await sendWhatsApp({
  to: '+64204363320',
  body: 'Hello, this is a regular WhatsApp message!',
  mediaUrl: ['https://example.com/image.jpg'] // Optional
})
```

### Content API Template Message

```javascript
// Frontend
await sendWhatsApp({
  to: '+64204363320',
  contentSid: 'HX350d429d32e64a552466cafecbe95f3c',
  contentVariables: '{"1":"12/1","2":"3pm}'
})
```

### Backend API Call

```bash
POST /api/messaging/send-whatsapp
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "+64204363320",
  "contentSid": "HX350d429d32e64a552466cafecbe95f3c",
  "contentVariables": "{\"1\":\"12/1\",\"2\":\"3pm\"}"
}
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN_2
TWILIO_PHONE_NUMBER=+18509898481
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Default Values

If not set in `.env`, the code uses these defaults:
- Account SID: `YOUR_TWILIO_ACCOUNT_SID`
- Auth Token: `YOUR_TWILIO_AUTH_TOKEN_2`
- WhatsApp Number: `+14155238886`

## Content API Template Setup

1. **Create a Template in Twilio Console**:
   - Go to Twilio Console → Messaging → Content Templates
   - Create a new template with placeholders (e.g., `{{1}}`, `{{2}}`)
   - Get the Content SID (starts with `HX`)

2. **Use the Template**:
   - Pass `contentSid` with your template ID
   - Pass `contentVariables` as a JSON string mapping placeholder numbers to values
   - Example: `'{"1":"12/1","2":"3pm"}'` fills `{{1}}` with "12/1" and `{{2}}` with "3pm"

## Example Implementation

The implementation matches the Node.js Twilio SDK pattern:

```javascript
// Original Twilio SDK code
client.messages.create({
    from: 'whatsapp:+14155238886',
    contentSid: 'HX350d429d32e64a552466cafecbe95f3c',
    contentVariables: '{"1":"12/1","2":"3pm"}',
    to: 'whatsapp:+64204363320'
})

// Our implementation (via API)
POST /api/messaging/send-whatsapp
{
  "to": "+64204363320",
  "contentSid": "HX350d429d32e64a552466cafecbe95f3c",
  "contentVariables": "{\"1\":\"12/1\",\"2\":\"3pm\"}"
}
```

## Notes

- **Phone Number Format**: All phone numbers are automatically formatted to E.164 format (`+1234567890`)
- **WhatsApp Format**: The service automatically adds `whatsapp:` prefix to phone numbers
- **Content Variables**: Must be a valid JSON string. Use double quotes for keys and values.
- **Template Approval**: WhatsApp templates must be pre-approved by WhatsApp before use
- **Sandbox**: For testing, use Twilio's WhatsApp Sandbox number `+14155238886`

## Error Handling

Common errors:
- `63007`: WhatsApp not enabled for this number
- `21211`: Invalid phone number format
- `21608`: Recipient has opted out
- Content API errors: Invalid Content SID or malformed contentVariables JSON






