import {
  type User,
  type InsertUser,
  type WaitlistEntry,
  type InsertWaitlistEntry,
} from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | undefined>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;
  deleteWaitlistEntry(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [user.username, user.email, user.passwordHash]
    );
    return result.rows[0];
  }

  async createWaitlistEntry(
    entry: InsertWaitlistEntry
  ): Promise<WaitlistEntry> {
    const existingEntry = await this.getWaitlistEntryByEmail(entry.email);
    if (existingEntry) {
      throw new Error("Email already registered on the waitlist");
    }

    const result = await db.query(
      "INSERT INTO waitlist_entries (full_name, email, company, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [entry.fullName, entry.email, entry.company]
    );
    return result.rows[0];
  }

  async getWaitlistEntryByEmail(
    email: string
  ): Promise<WaitlistEntry | undefined> {
    const result = await db.query(
      "SELECT * FROM waitlist_entries WHERE email = $1",
      [email]
    );
    return result.rows[0];
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    const result = await db.query("SELECT * FROM waitlist_entries");
    return result.rows;
  }

  async deleteWaitlistEntry(id: number): Promise<boolean> {
    const result = await db.query(
      "DELETE FROM waitlist_entries WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
