# 🎯 Brand Profile System Documentation

## Overview

The brand profile system allows users to save their brand information (Brand Name, Industry, Company Description, Tone of Voice, Knowledge Products, and Target Audience) which is then automatically used by the AI to generate personalized content.

## How It Works

### 1. Brand Profile Storage

Brand profiles are **saved by unique user ID** in the MongoDB `users` collection. Each user has their own brand profile stored in their user document with the following fields:

- `brandName` - The name of the brand/company
- `industry` - The industry the brand operates in
- `aboutMe` - Company description/brand description
- `toneOfVoice` - Brand's communication style (calm, warm, mindful, etc.)
- `knowledgeProducts` - Array of products/services the brand offers
- `targetAudience` - Array of target audience segments

### 2. Profile Update

Users can update their brand profile through:
- **Settings/Brands Page** (`/settings`)
- **API Endpoint**: `PUT /api/auth/profile`

The profile is saved immediately to the database and linked to the user's unique ID.

### 3. AI Content Generation with Brand Profile

When generating AI content, the system automatically:

1. **Retrieves the user's brand profile** from the database using their unique user ID
2. **Builds a system prompt** that includes all brand profile information
3. **Generates content** that aligns with the brand's identity

### 4. Where Brand Profile is Used

The brand profile is automatically used in:

#### ✅ Chat Conversations (`POST /api/chat`)
- All chat responses are personalized based on the brand profile
- The AI understands the brand's industry, tone, products, and audience
- Responses reflect the brand's communication style

#### ✅ Content Plan Generation (`POST /api/chat/generate-plan`)
- Generated content plans align with the brand's industry
- Posts are created in the brand's tone of voice
- Content targets the specified audience segments
- Products/services are naturally incorporated

#### ✅ Image Generation (`POST /api/chat/generate-image`)
- Image prompts can reference brand context
- Generated images align with brand identity

### 5. System Prompt Structure

The AI receives a comprehensive system prompt that includes:

```
You are an AI assistant for [Brand Name] in the [Industry] industry.

Company Description: [Company Description]

Your tone of voice should be [Tone Description].

You have knowledge about these products/services: [Products List].

Your target audience includes: [Audience Segments].

Please respond in a helpful and professional manner that aligns with the brand identity and company description. All content should reflect the brand's values, industry, and target audience.
```

## Database Schema

### User Model (Brand Profile Fields)

```typescript
{
  _id: ObjectId,           // Unique user ID
  email: string,
  brandName?: string,       // Brand/Company name
  industry?: string,        // Industry sector
  aboutMe?: string,         // Company description
  toneOfVoice?: string,     // Communication style
  knowledgeProducts?: string[],  // Products/services array
  targetAudience?: string[],     // Target audience array
  // ... other user fields
}
```

## API Endpoints

### Update Brand Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Body: {
  brandName: string,
  industry: string,
  aboutMe: string,
  toneOfVoice: string,
  knowledgeProducts: string[],
  targetAudience: string[]
}
```

### Get User Profile (includes brand profile)
```
GET /api/auth/me
Authorization: Bearer <token>
```

## Example Usage Flow

1. **User creates account** → User document created with unique `_id`
2. **User fills brand profile** → Profile data saved to user document
3. **User asks AI question** → System retrieves user's brand profile
4. **AI generates response** → Response personalized using brand profile
5. **User generates content plan** → Plan aligns with brand identity
6. **User posts to LinkedIn** → Content reflects brand values

## Benefits

✅ **Personalized AI Responses** - All AI content matches brand identity
✅ **Consistent Brand Voice** - Tone of voice maintained across all content
✅ **Industry-Specific Content** - Content relevant to brand's industry
✅ **Targeted Messaging** - Content speaks to the right audience
✅ **Product Integration** - Brand products naturally included in content
✅ **Automatic Context** - No need to repeat brand info in every request

## Technical Implementation

### Backend Services

- **`geminiService.ts`** - Builds system prompts from brand profile
- **`contentPlanService.ts`** - Uses brand profile for content plans
- **`chat.ts` routes** - Retrieves brand profile for each user request

### Data Flow

```
User Request
    ↓
Get User by ID (from JWT token)
    ↓
Extract Brand Profile Fields
    ↓
Build UserContext Object
    ↓
Pass to AI Service
    ↓
AI Generates Personalized Content
```

## Notes

- Brand profile is **automatically saved** when users update their settings
- Profile is **linked to unique user ID** - each user has their own profile
- Profile data is **always up-to-date** - retrieved fresh for each AI request
- If profile is incomplete, AI still works but with less personalization
- All brand profile fields are optional - users can fill what they want








