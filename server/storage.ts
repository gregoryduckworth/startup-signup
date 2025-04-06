// modify the interface with any CRUD methods
// you might need

import { 
  users, 
  waitlistEntries,
  type User, 
  type InsertUser, 
  type WaitlistEntry, 
  type InsertWaitlistEntry
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createWaitlistEntry(insertEntry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    // Check if email already exists
    const existingEntry = await this.getWaitlistEntryByEmail(insertEntry.email);
    if (existingEntry) {
      throw new Error("Email already registered on the waitlist");
    }
    
    const [entry] = await db
      .insert(waitlistEntries)
      .values({
        ...insertEntry,
        createdAt: new Date().toISOString()
      })
      .returning();
    
    return entry;
  }

  async getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | undefined> {
    const [entry] = await db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.email, email));
    
    return entry;
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    return db.select().from(waitlistEntries);
  }

  async deleteWaitlistEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(waitlistEntries)
      .where(eq(waitlistEntries.id, id))
      .returning({ id: waitlistEntries.id });
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();