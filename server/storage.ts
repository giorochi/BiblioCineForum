import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  members, 
  films, 
  filmProposals, 
  attendance, 
  admins,
  type Member, 
  type InsertMember, 
  type Film, 
  type InsertFilm,
  type FilmProposal,
  type InsertFilmProposal,
  type Admin,
  type InsertAdmin,
  type Attendance
} from "@shared/schema";
import { eq, gte, desc, and } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.znpxlyjuqhiwqwbqoxae:LuC9d!JfLd_twZP@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // Members
  createMember(member: InsertMember & { membershipCode: string; qrCode: string; expiryDate: string }): Promise<Member>;
  getMemberById(id: number): Promise<Member | undefined>;
  getMemberByUsername(username: string): Promise<Member | undefined>;
  getMemberByMembershipCode(code: string): Promise<Member | undefined>;
  getAllMembers(): Promise<Member[]>;
  updateMemberExpiry(id: number, expiryDate: string): Promise<void>;
  getMembersExpiringWithin(days: number): Promise<Member[]>;

  // Films
  createFilm(film: InsertFilm): Promise<Film>;
  getAllFilms(): Promise<Film[]>;
  getUpcomingFilms(): Promise<Film[]>;
  getPastFilms(): Promise<Film[]>;
  getFilmById(id: number): Promise<Film | undefined>;
  updateFilm(id: number, film: Partial<InsertFilm>): Promise<void>;
  deleteFilm(id: number): Promise<void>;

  // Film Proposals
  createFilmProposal(proposal: InsertFilmProposal): Promise<FilmProposal>;
  getFilmProposalsByMember(memberId: number): Promise<FilmProposal[]>;
  getAllFilmProposals(): Promise<(FilmProposal & { memberName: string })[]>;
  updateProposalStatus(id: number, status: string): Promise<void>;

  // Attendance
  markAttendance(memberId: number, filmId: number): Promise<Attendance>;
  getMemberAttendance(memberId: number): Promise<(Attendance & { filmTitle: string; filmDate: Date })[]>;
  getFilmAttendance(filmId: number): Promise<(Attendance & { memberName: string })[]>;

  // Admins
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createMember(memberData: InsertMember & { membershipCode: string; qrCode: string; expiryDate: string }): Promise<Member> {
    const [member] = await db.insert(members).values(memberData).returning();
    return member;
  }

  async getMemberById(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getMemberByUsername(username: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.username, username));
    return member;
  }

  async getMemberByMembershipCode(code: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.membershipCode, code));
    return member;
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(desc(members.createdAt));
  }

  async updateMemberExpiry(id: number, expiryDate: string): Promise<void> {
    await db.update(members).set({ expiryDate }).where(eq(members.id, id));
  }

  async getMembersExpiringWithin(days: number): Promise<Member[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return await db.select().from(members).where(gte(members.expiryDate, futureDate.toISOString().split('T')[0]));
  }

  async createFilm(film: InsertFilm): Promise<Film> {
    const [newFilm] = await db.insert(films).values(film).returning();
    return newFilm;
  }

  async getAllFilms(): Promise<Film[]> {
    return await db.select().from(films).orderBy(films.scheduledDate);
  }

  async getUpcomingFilms(): Promise<Film[]> {
    const now = new Date();
    return await db.select().from(films).where(gte(films.scheduledDate, now)).orderBy(films.scheduledDate);
  }

  async getPastFilms(): Promise<Film[]> {
    const now = new Date();
    return await db.select().from(films).where(and(films.scheduledDate < now)).orderBy(desc(films.scheduledDate));
  }

  async getFilmById(id: number): Promise<Film | undefined> {
    const [film] = await db.select().from(films).where(eq(films.id, id));
    return film;
  }

  async updateFilm(id: number, filmData: Partial<InsertFilm>): Promise<void> {
    await db.update(films).set(filmData).where(eq(films.id, id));
  }

  async deleteFilm(id: number): Promise<void> {
    await db.delete(films).where(eq(films.id, id));
  }

  async createFilmProposal(proposal: InsertFilmProposal): Promise<FilmProposal> {
    const [newProposal] = await db.insert(filmProposals).values(proposal).returning();
    return newProposal;
  }

  async getFilmProposalsByMember(memberId: number): Promise<FilmProposal[]> {
    return await db.select().from(filmProposals).where(eq(filmProposals.memberId, memberId)).orderBy(desc(filmProposals.createdAt));
  }

  async getAllFilmProposals(): Promise<(FilmProposal & { memberName: string })[]> {
    const proposals = await db
      .select({
        id: filmProposals.id,
        memberId: filmProposals.memberId,
        title: filmProposals.title,
        director: filmProposals.director,
        reason: filmProposals.reason,
        status: filmProposals.status,
        createdAt: filmProposals.createdAt,
        memberName: members.firstName
      })
      .from(filmProposals)
      .leftJoin(members, eq(filmProposals.memberId, members.id))
      .orderBy(desc(filmProposals.createdAt));
    
    return proposals.map(p => ({
      ...p,
      memberName: `${p.memberName} ${members.lastName}`
    }));
  }

  async updateProposalStatus(id: number, status: string): Promise<void> {
    await db.update(filmProposals).set({ status }).where(eq(filmProposals.id, id));
  }

  async markAttendance(memberId: number, filmId: number): Promise<Attendance> {
    const [attendanceRecord] = await db.insert(attendance).values({ memberId, filmId }).returning();
    return attendanceRecord;
  }

  async getMemberAttendance(memberId: number): Promise<(Attendance & { filmTitle: string; filmDate: Date })[]> {
    const attendanceRecords = await db
      .select({
        id: attendance.id,
        memberId: attendance.memberId,
        filmId: attendance.filmId,
        attendedAt: attendance.attendedAt,
        filmTitle: films.title,
        filmDate: films.scheduledDate
      })
      .from(attendance)
      .leftJoin(films, eq(attendance.filmId, films.id))
      .where(eq(attendance.memberId, memberId))
      .orderBy(desc(attendance.attendedAt));
    
    return attendanceRecords.map(record => ({
      ...record,
      filmDate: new Date(record.filmDate)
    }));
  }

  async getFilmAttendance(filmId: number): Promise<(Attendance & { memberName: string })[]> {
    const attendanceRecords = await db
      .select({
        id: attendance.id,
        memberId: attendance.memberId,
        filmId: attendance.filmId,
        attendedAt: attendance.attendedAt,
        memberName: members.firstName
      })
      .from(attendance)
      .leftJoin(members, eq(attendance.memberId, members.id))
      .where(eq(attendance.filmId, filmId))
      .orderBy(desc(attendance.attendedAt));
    
    return attendanceRecords.map(record => ({
      ...record,
      memberName: `${record.memberName} ${members.lastName}`
    }));
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }
}

export const storage = new DatabaseStorage();
