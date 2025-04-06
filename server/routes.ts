import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistEntrySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { sendWaitlistConfirmation } from "./mail";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Route to get all waitlist entries
  app.get("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const entries = await storage.getAllWaitlistEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching waitlist entries:", error);
      res.status(500).json({ message: "Failed to fetch waitlist entries" });
    }
  });

  // Route to add an entry to the waitlist
  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertWaitlistEntrySchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const validationError = fromZodError(validatedData.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      }
      
      // Check if email already exists
      const existingEntry = await storage.getWaitlistEntryByEmail(validatedData.data.email);
      if (existingEntry) {
        return res.status(409).json({ message: "Email already registered on the waitlist" });
      }
      
      // Create new waitlist entry
      const newEntry = await storage.createWaitlistEntry(validatedData.data);
      
      // Send confirmation email
      try {
        const emailSent = await sendWaitlistConfirmation(
          validatedData.data.fullName, 
          validatedData.data.email
        );
        console.log(`Confirmation email to ${validatedData.data.email}: ${emailSent ? 'sent' : 'failed'}`);
      } catch (emailError) {
        // Log the error but don't fail the request
        console.error("Error sending confirmation email:", emailError);
      }
      
      res.status(201).json({
        message: "Successfully joined the waitlist!",
        entry: newEntry
      });
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });
  
  // Route to delete a waitlist entry by ID
  app.delete("/api/waitlist/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const deleted = await storage.deleteWaitlistEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Waitlist entry not found" });
      }
      
      res.status(200).json({ message: "Waitlist entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting waitlist entry:", error);
      res.status(500).json({ message: "Failed to delete waitlist entry" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
