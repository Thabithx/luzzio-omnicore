#!/bin/bash

BASE_URL="http://localhost:5001/api"

echo "1. Seeding Database (Creating Admin)..."
curl -s -X POST "$BASE_URL/seed"
echo -e "\n"

echo "2. Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@luzzio.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Admin Token obtained."
echo ""

echo "3. Fetching Categories..."
CATEGORIES=$(curl -s -X GET "$BASE_URL/categories")
CAT_ID=$(echo $CATEGORIES | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Using Category ID: $CAT_ID"
echo ""

echo "4. Creating a Product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Test Jacket\",
    \"description\": \"A high quality test jacket.\",
    \"price\": 500,
    \"category\": \"$CAT_ID\",
    \"stock\": 10
  }")

PROD_ID=$(echo $PRODUCT_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Created Product ID: $PROD_ID"
echo ""

echo "5. Retrieving Products..."
curl -s -X GET "$BASE_URL/products" | grep "Test Jacket" && echo "Product found in list."
echo ""

if [ ! -z "$PROD_ID" ]; then
  echo "6. Deleting Product..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/products/$PROD_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "Delete Response: $DELETE_RESPONSE"
fi
