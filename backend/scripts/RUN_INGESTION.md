# How to Run the Data Ingestion Script

## Step-by-Step Guide

### 1. Prepare Your Data File

You need a CSV or JSON file with your prediction_best_time data. The file should have columns like:
- `Timestamp` (or `timestamp`, `date`, `Date`)
- `Platform` (or `platform`)
- `Likes` (or `likes`)
- `Retweets` (or `retweets`)
- `Text` (or `text`, `content`)
- `Sentiment` (or `sentiment`)
- `Hashtags` (or `hashtags`, `hashtag`)
- `Country` (or `country`)

**Place your data file anywhere** - you'll provide the full path when running the script.

### 2. Make Sure MongoDB is Running

The script connects to: `mongodb://localhost:27017/melo`

Make sure MongoDB is running on your local machine:
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"
```

Or if you're using a different connection, set it in your `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/melo
```

### 3. Navigate to Backend Directory

```bash
cd /Users/tazwarhabib/Melo/backend
```

### 4. Run the Ingestion Script

**For CSV file:**
```bash
npm run ingest:best-time /path/to/your/data.csv
```

**For JSON file:**
```bash
npm run ingest:best-time /path/to/your/data.json
```

**Example:**
```bash
# If your file is in the backend directory
npm run ingest:best-time ./data/prediction_best_time.csv

# If your file is in the root directory
npm run ingest:best-time ../prediction_best_time.csv

# If your file is anywhere else, use full path
npm run ingest:best-time /Users/tazwarhabib/Downloads/prediction_best_time.csv
```

### 5. What the Script Does

1. ✅ Connects to MongoDB
2. ✅ Clears existing data (optional - you can modify this)
3. ✅ Reads your CSV/JSON file
4. ✅ Cleans and transforms the data:
   - Drops `Unnamed: 0`, `Unnamed: 0.1` columns
   - Parses timestamps
   - Adds derived fields (day, month, hour, year, etc.)
   - Calculates engagement = likes + retweets
   - Normalizes platform names and sentiment
5. ✅ Inserts data in batches
6. ✅ Creates indexes for fast queries
7. ✅ Prints summary statistics

### 6. Verify the Data

After running, you can verify the data was imported:

```bash
# Connect to MongoDB
mongosh

# Switch to melo database
use melo

# Count documents
db.prediction_best_time.countDocuments()

# See a sample document
db.prediction_best_time.findOne()

# Check by platform
db.prediction_best_time.aggregate([
  { $group: { _id: "$platform", count: { $sum: 1 } } }
])
```

## Troubleshooting

### Error: "File not found"
- Make sure the file path is correct
- Use absolute path if relative path doesn't work
- Check file permissions

### Error: "Cannot connect to MongoDB"
- Make sure MongoDB is running: `mongosh --eval "db.version()"`
- Check your `.env` file has the correct `MONGODB_URI`
- Try: `mongodb://localhost:27017/melo`

### Error: "Module not found"
- Make sure you're in the `backend` directory
- Run `npm install` if needed

### No data showing in visualizations
- Check browser console for API errors
- Check backend logs for query results
- Verify data was imported: `db.prediction_best_time.countDocuments()`

## Need Help?

If you encounter any issues:
1. Check the console output for error messages
2. Verify your data file format matches the expected structure
3. Make sure MongoDB is running and accessible
4. Check that the `.env` file has the correct `MONGODB_URI`



