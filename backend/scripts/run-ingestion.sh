#!/bin/bash

# Helper script to run the data ingestion
# Usage: ./run-ingestion.sh <path-to-data-file>

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📊 Best Time Analytics Data Ingestion"
echo "======================================"
echo ""

# Check if file path is provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide the path to your data file"
  echo ""
  echo "Usage:"
  echo "  ./run-ingestion.sh <path-to-data-file>"
  echo ""
  echo "Examples:"
  echo "  ./run-ingestion.sh ./data/prediction_best_time.csv"
  echo "  ./run-ingestion.sh /Users/tazwarhabib/Downloads/data.csv"
  echo ""
  exit 1
fi

DATA_FILE="$1"

# Check if file exists
if [ ! -f "$DATA_FILE" ]; then
  echo "❌ Error: File not found: $DATA_FILE"
  echo ""
  echo "Please check the file path and try again."
  exit 1
fi

echo "✅ File found: $DATA_FILE"
echo ""

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."
cd "$BACKEND_DIR"

# Run the ingestion script
echo "🚀 Starting data ingestion..."
echo ""

npm run ingest:best-time "$DATA_FILE"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Ingestion completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Refresh your Analytics page in the browser"
  echo "2. Navigate to Best Time Analytics sections"
  echo "3. Visualizations should now show data"
else
  echo ""
  echo "❌ Ingestion failed. Please check the error messages above."
  exit $EXIT_CODE
fi



