#!/bin/bash

# Script to update all react-native-reanimated imports to use our wrapper

echo "🔄 Starting batch update of react-native-reanimated imports..."

# Find all TypeScript/JavaScript files in src directory and replace imports
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
  # Check if file contains react-native-reanimated import
  if grep -q "from ['\"]react-native-reanimated['\"]" "$file"; then
    echo "📝 Updating: $file"

    # Calculate the relative path depth to utils folder
    # Count the number of directory levels
    depth=$(echo "$file" | sed 's|[^/]||g' | wc -c)
    depth=$((depth - 2))  # Subtract 2 for "src/" prefix

    # Build the relative path
    relative_path=""
    for ((i=0; i<$depth; i++)); do
      relative_path="../$relative_path"
    done
    relative_path="${relative_path}utils/reanimatedWrapper"

    # Perform the replacement
    sed -i '' "s|from ['\"]react-native-reanimated['\"]|from '$relative_path'|g" "$file"

    echo "✅ Updated: $file -> $relative_path"
  fi
done

echo "🎉 Batch update complete!"