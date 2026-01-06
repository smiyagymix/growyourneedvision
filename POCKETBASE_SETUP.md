# PocketBase Setup Instructions

## Quick Start

To run the full development environment (Client + PocketBase), simply run:

```bash
pnpm dev
```

This will concurrently start:
- **Vite Client** on `http://localhost:3001`
- **PocketBase** on `http://127.0.0.1:8090`

## Prerequisites

### 1. Download PocketBase

If you haven't already, download PocketBase:

1. Visit [https://pocketbase.io/docs/](https://pocketbase.io/docs/)
2. Download the executable for Windows
3. Create a `pocketbase` folder in the project root
4. Extract `pocketbase.exe` into the `pocketbase` folder

Your project structure should look like:

```
GROW-YOUR-NEED-VISION/
├── pocketbase/
│   ├── pocketbase.exe
│   └── pb_data/ (created automatically)
├── apps/
├── components/
├── package.json
└── ...
```

### 2. Initial PocketBase Setup (First Time Only)

Before running `pnpm dev` for the first time:

1. Navigate to the pocketbase folder:
   ```bash
   cd pocketbase
   ```

2. Run PocketBase manually once:
   ```bash
   pocketbase.exe serve --http=127.0.0.1:8090
   ```

3. Open `http://127.0.0.1:8090/_/` in your browser

4. Create an admin account (you'll use this to manage your database)

5. Set up the `users` collection with the following fields:
   - `name` (Text)
   - `email` (Email, unique)
   - `role` (Text) - for storing user roles (Owner, Admin, Teacher, Student, Parent, Individual)
   - `avatar` (File, optional)
   - `tenantId` (Text, optional) - for multi-tenancy

6. Stop PocketBase (Ctrl+C) and return to the project root:
   ```bash
   cd ..
   ```

Now you can use `pnpm dev` to run everything!

## Automated Setup (Recommended)

We have provided scripts to automatically set up your database schema and seed it with test data.

1. **Initialize Users**: Creates Admin, Teacher, Student, and Parent accounts.
   ```bash
   node init-users.js
   ```

2. **Initialize Data**: Creates collections (Classes, Assignments, Resources, etc.) and seeds them with sample data.
   ```bash
   node init-data.js
   ```

## Individual Commands

If you need to run services separately:

- **Client only**: `pnpm dev:client`
- **PocketBase only**: `pnpm dev:pocketbase`

## Troubleshooting

### PocketBase not found
If you get an error that `pocketbase.exe` is not found:
- Ensure the `pocketbase` folder exists in the project root
- Ensure `pocketbase.exe` is inside that folder
- Check that you're running the command from the project root

### Port already in use
- **Client (3001)**: Stop any other Vite/React dev servers
- **PocketBase (8090)**: Stop any other PocketBase instances
.
3
