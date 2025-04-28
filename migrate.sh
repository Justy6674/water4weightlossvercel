#!/bin/bash

# Remove old remote
git remote remove origin

# Clean git and reinitialize
rm -rf .git
git init

# Stage and commit all files
git add .
git commit -m "Initial commit: Water4Weightloss Vercel rebuild"

# Add new remote
git remote add origin https://github.com/Justy6674/water4weightlossvercel.git

# Push to main (force push to overwrite remote)
git branch -M main
git push -f -u origin main

echo "Migration complete! 🚀"
echo "Repository: https://github.com/Justy6674/water4weightlossvercel" 