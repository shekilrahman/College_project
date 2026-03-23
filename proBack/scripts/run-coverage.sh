#!/bin/bash

# Simple script to run coverage and notify the user
echo "🚀 Running Code Coverage Suite..."

# Ensure we are in the correct directory
cd "$(dirname "$0")/.."

# Run the coverage command
npm run test:coverage

if [ $? -eq 0 ]; then
  echo "✅ Coverage report generated successfully!"
  echo "📊 Local report available at: proBack/coverage/lcov-report/index.html"
else
  echo "❌ Coverage run failed. Please check the logs above."
  exit 1
fi
