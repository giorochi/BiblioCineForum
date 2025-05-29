import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: date("birth_date").notNull(),
  taxCode: text("tax_code").notNull().unique(),
  email: text("email").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  membershipCode: text("membership_code").notNull().unique(),
  qrCode: text("qr_code").notNull(),
  expiryDate: date("expiry_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const films = pgTable("films", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  director: text("director").notNull(),
  cast: text("cast").notNull(),
  plot: text("plot").notNull(),
  coverImage: text("cover_image"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const filmProposals = pgTable("film_proposals", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id),
  title: text("title").notNull(),
  director: text("director").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id),
  filmId: integer("film_id").notNull().references(() => films.id),
  attendedAt: timestamp("attended_at").notNull().defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  membershipCode: true,
  qrCode: true,
  expiryDate: true,
  isActive: true,
  createdAt: true,
});

export const insertFilmSchema = createInsertSchema(films).omit({
  id: true,
  createdAt: true,
});

export const insertFilmProposalSchema = createInsertSchema(filmProposals).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Film = typeof films.$inferSelect;
export type InsertFilm = z.infer<typeof insertFilmSchema>;
export type FilmProposal = typeof filmProposals.$inferSelect;
export type InsertFilmProposal = z.infer<typeof insertFilmProposalSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Attendance = typeof attendance.$inferSelect;
