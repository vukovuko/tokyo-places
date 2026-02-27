import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function seedUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.\n" +
        "Add them to your .env file:\n" +
        "  ADMIN_EMAIL=your@email.com\n" +
        "  ADMIN_PASSWORD=yourpassword",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool, { schema });

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        role: "admin",
      })
      .returning();
    console.log(`Created admin user: ${user.email}`);
  }

  await pool.end();
}

seedUser().catch((err) => {
  console.error("Seed user failed:", err);
  process.exit(1);
});
