# Quick Start: Run Data Ingestion

## Option 1: Using npm script (Recommended)

```bash
cd /Users/tazwarhabib/Melo/backend
npm run ingest:best-time <path-to-your-data-file>
```

**Example:**
```bash
npm run ingest:best-time /Users/tazwarhabib/Downloads/prediction_best_time.csv
```

## Option 2: Using the helper script

```bash
cd /Users/tazwarhabib/Melo/backend/scripts
./run-ingestion.sh <path-to-your-data-file>
```

## Where is your data file?

If you don't know where your data file is, you can:

1. **Check common locations:**
   ```bash
   # Search for CSV files
   find ~/Downloads -name "*.csv" 2>/dev/null
   find ~/Desktop -name "*.csv" 2>/dev/null
   ```

2. **If you need to download it:**
   - Place it anywhere on your computer
   - Use the full path when running the script

3. **If you have a JSON file instead:**
   - The script supports both CSV and JSON
   - Just use the JSON file path instead

## What happens when you run it?

1. ✅ Connects to MongoDB (`mongodb://localhost:27017/melo`)
2. ✅ Reads your data file
3. ✅ Cleans and transforms the data
4. ✅ Inserts into `prediction_best_time` collection
5. ✅ Creates indexes
6. ✅ Shows summary statistics

## After running:

1. Open your browser
2. Go to the Analytics page
3. Click on any "Best Time Analytics" section
4. You should see visualizations!

## Need help?

If you get an error, check:
- ✅ MongoDB is running (`mongosh --eval "db.version()"`)
- ✅ File path is correct
- ✅ File format is CSV or JSON
- ✅ File has the required columns (Timestamp, Platform, etc.)



