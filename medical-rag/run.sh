#!/bin/bash

# Medical RAG Service startup script

echo "🔧 Setting up Medical RAG Service..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please configure OPENAI_API_KEY in .env file"
fi

# Start service
echo "🚀 Starting Medical RAG Service on port 8001..."
python -m app.main
