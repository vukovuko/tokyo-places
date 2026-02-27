import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  smallint,
  doublePrecision,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  color: varchar("color", { length: 7 }).notNull(),
  icon: varchar("icon", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 1000 }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  googleMapsUrl: varchar("google_maps_url", { length: 2000 }),
  googlePlaceId: varchar("google_place_id", { length: 500 }),
  notes: text("notes"),
  visited: boolean("visited").notNull().default(false),
  rating: smallint("rating"),
  city: varchar("city", { length: 255 }),
  ward: varchar("ward", { length: 255 }),
  source: varchar("source", { length: 50 }),
  googlePhotoRef: text("google_photo_ref"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const placeCategories = pgTable(
  "place_categories",
  {
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.placeId, t.categoryId] })],
);

// Relations

export const usersRelations = relations(users, () => ({}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  placeCategories: many(placeCategories),
}));

export const placesRelations = relations(places, ({ many }) => ({
  placeCategories: many(placeCategories),
}));

export const placeCategoriesRelations = relations(
  placeCategories,
  ({ one }) => ({
    place: one(places, {
      fields: [placeCategories.placeId],
      references: [places.id],
    }),
    category: one(categories, {
      fields: [placeCategories.categoryId],
      references: [categories.id],
    }),
  }),
);
