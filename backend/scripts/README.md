# Data Ingestion Scripts

## Ingest Prediction Best Time Data

This script ingests and cleans data for the `prediction_best_time` collection.

### Usage

```bash
npm run ingest:best-time <path-to-data-file>
```

### Supported Formats

- **JSON**: Array of objects or single object
- **CSV**: Comma-separated values with headers

### Data Cleaning

The script automatically:

1. **Drops unwanted columns**: Removes `Unnamed: 0`, `Unnamed: 0.1`, etc.
2. **Parses timestamps**: Converts to proper Date objects
3. **Adds derived fields**:
   - `day`: Day of week (Monday, Tuesday, etc.)
   - `month`: Month name (January, February, etc.)
   - `hour`: Hour of day (0-23)
   - `year`: Year extracted from timestamp
   - `dayOfMonth`: Day of month (1-31)
   - `engagementScore`: Calculated as `likes + retweets`
4. **Normalizes data**:
   - Platform names (instagram, twitter, linkedin, facebook)
   - Sentiment values (positive, negative, neutral)
   - Hashtags (splits into array)
5. **Creates indexes** for optimal query performance

### Example

```bash
# From JSON file
npm run ingest:best-time ./data/prediction_best_time.json

# From CSV file
npm run ingest:best-time ./data/prediction_best_time.csv
```

### Required Fields

The input data should have (case-insensitive):
- `Timestamp` or `timestamp` or `date` or `Date`
- `Platform` or `platform`
- `Likes` or `likes` (optional, defaults to 0)
- `Retweets` or `retweets` (optional, defaults to 0)
- `Text` or `text` or `content` (optional)
- `Sentiment` or `sentiment` (optional, defaults to 'neutral')
- `Hashtags` or `hashtags` or `hashtag` (optional)
- `Country` or `country` (optional)

### Output

The script will:
- Clear existing data in the collection (optional - can be modified)
- Insert cleaned records in batches
- Create indexes
- Print summary statistics

### Indexes Created

- `{ platform: 1, timestamp: 1 }` - Time-series queries
- `{ platform: 1, day: 1, hour: 1 }` - Day×Hour heatmaps
- `{ platform: 1, hour: 1 }` - Best hours
- `{ platform: 1, day: 1 }` - Best days
- `{ country: 1, platform: 1 }` - Country insights
- `{ sentiment: 1, platform: 1 }` - Sentiment analysis
- `{ sentiment: 1, platform: 1, hour: 1 }` - Sentiment-aware timing
- `{ country: 1, platform: 1, hour: 1 }` - Country recommendations
- `{ engagementScore: -1 }` - Top posts



