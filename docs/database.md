## Database options

The project uses Prisma and can target either SQLite (default for local development) or a managed Postgres instance when deployed.

### Local development (SQLite)

```env
DATABASE_URL="file:./prisma/data.db"
```

No additional setup is required. Data is saved to `prisma/data.db`.

### Serverless Postgres (production)

1. Provision a Postgres database (Vercel Postgres, Neon, Supabase, etc.).
2. Copy the connection string and set the environment variable:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
   ```

3. Run the migrations:

   ```bash
   npx prisma migrate deploy
   ```

4. Optional: seed or inspect data with Prisma Studio (`npx prisma studio`).

> When deploying to Vercel, add the two variables above in the dashboard so data persists across builds.
