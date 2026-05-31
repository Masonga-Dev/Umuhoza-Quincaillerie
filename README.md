# Umuhoza Quincaillerie Website, Inventory and Sales Management System

This repository contains a starter full-stack platform for Umuhoza Quincaillerie.

## Project Structure

- `backend/` - Node.js + Express API server
- `frontend/` - React + Vite public website and admin dashboard
- `uploads/` - Local storage for product, gallery, and banner images

## Technology Stack

- Frontend: React, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, MySQL
- Authentication: JWT
- Image storage: local filesystem

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` with the following keys:

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=umuhoza_quincaillerie
JWT_SECRET=supersecretkey
```

Then run:

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Database

Use `backend/src/schema.sql` to create the MySQL database and tables.

## Notes

- Customers can browse products, categories, promotions, gallery, and contact pages.
- Admins can manage products, categories, inventory, sales, reports, homepage content, and settings.
- All product images are stored locally under `uploads/`.
