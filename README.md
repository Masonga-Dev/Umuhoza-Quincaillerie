# Umuhoza Quincaillerie Website, Inventory and Sales Management System

This repository contains a full-stack platform for Umuhoza Quincaillerie.

## Project Structure

- `backend/` - Node.js + Express API server
- `frontend/` - React + Vite public website and admin dashboard

## Technology Stack

- Frontend: React, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, MySQL
- Authentication: JWT
- Image storage: Cloudinary (legacy local paths under `backend/uploads/` are still served)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (see `backend/.env.example`) with the following keys:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=umuhoza_quincaillerie
JWT_SECRET=supersecretkey

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Used only by seed-admin.js
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

Then run:

```bash
npm run dev
```

To create the initial admin user (requires `ADMIN_EMAIL` / `ADMIN_PASSWORD`):

```bash
node seed-admin.js
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Optionally create `frontend/.env.local` to point the frontend at a local backend:

```env
VITE_BACKEND_URL=http://localhost:4000
```

Without it, the frontend falls back to `https://umuhoza-backend.onrender.com`.

### 3. Database

Use `backend/src/schema.sql` to create the MySQL database and tables.

## Notes

- Customers can browse products, categories, subcategories, promotions, gallery, and contact pages.
- Admins can manage products, categories, inventory, sales, reports, homepage content, and settings.
- Product images are stored on Cloudinary; URLs are resolved through `frontend/src/utils/imgUrl.js`.
