# AGROMART Backend - Setup Guide

## Quick Setup Instructions

### Step 1: Database Setup
1. Open MySQL command line or MySQL Workbench
2. Run the following command to create the database and tables:
```sql
SOURCE /path/to/database.sql;
```

Or manually:
```sql
CREATE DATABASE IF NOT EXISTS agromart_db;
USE agromart_db;
-- Then paste contents of database.sql
```

### Step 2: Environment Configuration
Create a `.env` file in the BACKEND folder with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=agromart_db
DB_PORT=3306
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key_change_in_production
CORS_ORIGIN=http://localhost:5000,http://localhost:3000
```

**Remember to:**
- Replace `your_password` with your actual MySQL password
- Change JWT_SECRET for production
- Update CORS_ORIGIN with your frontend URL

### Step 3: Install Dependencies
```bash
cd BACKEND
npm install
```

### Step 4: Start the Server
**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### Step 5: Verify Installation
- Open browser: `http://localhost:3000/api/health`
- Should see: `{"status":"ok","timestamp":"...","environment":"development"}`

---

## Testing the API

### Using Postman or curl:

**Get all products:**
```bash
curl http://localhost:3000/api/products
```

**Create an order:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "mobile": "+254712345678",
    "county": "Nairobi",
    "addressLine": "123 Test Street",
    "items": [
      {"productId": "seed-maize", "name": "Maize Seeds", "quantity": 1, "unitPrice": 2500}
    ],
    "subtotal": 2500
  }'
```

---

## Database Tables Overview

### Products Table
- Contains 12 sample agricultural products
- Categories: Seeds, Fertilizers, Livestock, Feed, Tools, Pesticides

### Categories Table
- Pre-populated with 6 agricultural categories

### Orders Table
- Tracks customer orders with status and payment status

### Users Table
- Stores customer accounts (email, name, password hash)

### Cart & Wishlist Tables
- Links users to products they're interested in

---

## Troubleshooting

### "Cannot find module" error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### MySQL connection refused
- Make sure MySQL is running
- Check username/password in .env
- Verify database name matches

### Port 3000 is in use
```bash
# Use a different port
PORT=3001 npm start
```

### CORS errors in frontend
- Check CORS_ORIGIN in .env
- Make sure it includes your frontend URL

---

## File Structure Explanation

```
BACKEND/
├── config/database.js       - MySQL connection pool setup
├── models/                  - Database query functions
│   ├── productModel.js
│   ├── orderModel.js
│   ├── userModel.js
│   ├── cartModel.js
│   └── wishlistModel.js
├── routes/                  - API endpoints
│   ├── products.js
│   ├── orders.js
│   ├── users.js
│   ├── cart.js
│   └── wishlist.js
├── server.js                - Main Express app
├── package.json             - Dependencies
├── .env                     - Configuration (not in git)
├── database.sql             - Database schema
└── README.md                - Full documentation
```

---

## Next Steps

1. ✅ Database created with sample data
2. ✅ API endpoints ready for use
3. Next: Connect frontend to these endpoints
4. Next: Add payment gateway integration
5. Next: Deploy to production server

---

## Support

For detailed API documentation, see [README.md](./README.md)
