# AgroMart FRONTEND (HTML / CSS / JS prototype)

## Run locally

This project uses **ES modules** (`<script type="module">`). Open the folder through a **local static server** (required so imports resolve correctly):

```bash
cd FRONTEND
npx --yes serve -l 3000
```

Then open **http://localhost:3000** for the storefront and **http://localhost:3000/admin.html** for the admin panel. Both share the same origin so `localStorage` and `storage` events stay in sync.

Alternatives: VS Code Live Server, or `python -m http.server` from the `FRONTEND` directory.

## Data & privacy

All catalog data, settings, cart, wishlist, session, and orders are stored **only in your browser** (`localStorage`). Nothing is sent to a backend. Clearing site data resets the store to the built-in seed.

## Demo sign-in

- **demo@agromart.com** — any non-empty password (prototype).  
- **demo@agro.test** / **demo123** — fixed demo pair.

Sign up is a stub and does not create a persisted account.

## M-Pesa

Checkout saves orders with status `payment_pending`. Real payment is **not** implemented. Search the codebase for `TODO: STK Push API`.

## Layout

- **Storefront:** `index.html`, `products.html`, `product.html`, `cart.html`, `checkout.html`, `wishlist.html`, `account.html`, `sign-in.html`, `sign-up.html` + `styles.css` + `js/storefront-entry.js` and modules under `js/shared/` and `js/storefront/`.
- **Admin:** `admin.html` + `admin.css` + `js/admin-app.js` (imports the same `js/shared/store.js`).

Storage schema is documented at the top of `js/shared/store.js`.
# database setup on machine b 
. The Migration (On Machine B)
Follow these steps in order once you plug in your drive:

A. Create the new container
Open your MySQL Command Line Client and run:

SQL
CREATE DATABASE Agromartnew_db;
B. Import the data
Open your terminal (CMD or PowerShell), navigate to your USB drive folder, and run:

Bash
mysql -u root -p Agromartnew_db < agromart_dbackup.sql
C. Prepare the Code

Copy your project folder to Machine B.

Open your .env file and update the database name:

Code snippet
DB_NAME=Agromartnew_db
# Make sure DB_USER and DB_PASSWORD match Machine B's MySQL setup
3. Verification Commands
To be 100% sure the "Agromart" data moved correctly into the new name, run these two commands in your terminal:

Check the tables:

Bash
mysql -u root -p -e "USE Agromartnew_db; SHOW TABLES;"
Check the record count (Try this on your main product or user table):

Bash
mysql -u root -p -e "USE Agromartnew_db; SELECT COUNT(*) FROM your_table_name;"
💡 One Crucial Troubleshooting Tip
Sometimes, when you export a database, the .sql file includes a line at the top that says CREATE DATABASE IF NOT EXISTS [old_name] or USE [old_name].

If you get an error during import, or if it imports back into the old name instead of Agromartnew_db:

Open agromart_dbackup.sql in Notepad or VS Code.

Search (Ctrl + F) for the word USE.

If you find a line like USE agromart_old;, simply delete that line or change it to USE Agromartnew_db;.

Save the file and run the import command again.

Once that's done, just run npm install and npm start in your project folder, and you should be live!

Are you moving this to another Windows machine, or are you setting this up on a different OS this time?