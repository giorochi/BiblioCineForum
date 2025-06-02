import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertFilmSchema, insertFilmProposalSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "cineforum-secret-key";

// Multer configuration for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token di accesso richiesto' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error('Token verification error:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token scaduto' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Token non valido' });
      }
      return res.status(403).json({ message: 'Errore di autenticazione' });
    }
    req.user = user;
    next();
  });
};

// Generate membership code
const generateMembershipCode = (): string => {
  const prefix = "CF";
  const number = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `${prefix}${number}`;
};

// Generate username from name and random number
const generateUsername = (firstName: string, lastName: string): string => {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${cleanFirstName}${cleanLastName}${randomNum}`;
};

// Generate random password
const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generate QR code
const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

// Calculate expiry date (1 year from now)
const calculateExpiryDate = (): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create default admin if not exists
  try {
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("CineForum2024!", 10);
      await storage.createAdmin({
        username: "admin",
        password: hashedPassword
      });
      console.log("Default admin created: username=admin, password=CineForum2024!");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }

  // Auth endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check if admin
      const admin = await storage.getAdminByUsername(username);
      if (admin && await bcrypt.compare(password, admin.password)) {
        const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { id: admin.id, username: admin.username, role: 'admin' } });
      }

      // Check if member
      const member = await storage.getMemberByUsername(username);
      if (member && await bcrypt.compare(password, member.password)) {
        const token = jwt.sign({ id: member.id, username: member.username, role: 'member' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ 
          token, 
          user: { 
            id: member.id, 
            username: member.username, 
            role: 'member',
            fullName: `${member.firstName} ${member.lastName}`,
            membershipCode: member.membershipCode,
            expiryDate: member.expiryDate,
            qrCode: member.qrCode
          } 
        });
      }

      res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Member endpoints
  app.post("/api/members", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberData = insertMemberSchema.parse(req.body);
      const username = generateUsername(memberData.firstName, memberData.lastName);
      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const membershipCode = generateMembershipCode();
      const qrCode = await generateQRCode(membershipCode);
      const expiryDate = calculateExpiryDate();

      const member = await storage.createMember({
        ...memberData,
        username,
        password: hashedPassword,
        membershipCode,
        qrCode,
        expiryDate
      });

      // Return member with plain password for display
      res.json({
        ...member,
        plainPassword // Include plain password in response for admin to see
      });
    } catch (error) {
      console.error("Error creating member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      // Handle specific database constraint errors
      if (error.message === 'USERNAME_EXISTS') {
        return res.status(400).json({ message: "Username già esistente" });
      } else if (error.message === 'TAX_CODE_EXISTS') {
        return res.status(400).json({ message: "Codice fiscale già esistente" });
      } else if (error.message === 'MEMBERSHIP_CODE_EXISTS') {
        return res.status(400).json({ message: "Codice tessera già esistente" });
      } else if (error.message === 'DUPLICATE_ENTRY') {
        return res.status(400).json({ message: "Dati duplicati già esistenti" });
      }

      // Fallback for other duplicate key errors
      if (error.message?.includes('duplicate') || error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ message: "Username o codice fiscale già esistente" });
      }
      res.status(500).json({ message: "Errore nella creazione del tesserato" });
    }
  });

  app.get("/api/members", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const members = await storage.getAllMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/members/:id/renew", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberId = parseInt(req.params.id);
      const expiryDate = calculateExpiryDate();

      await storage.updateMemberExpiry(memberId, expiryDate);
      res.json({ message: "Membership renewed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to renew membership" });
    }
  });

  app.get("/api/members/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberId = parseInt(req.params.id);
      const member = await storage.getMemberById(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.put("/api/members/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberId = parseInt(req.params.id);
      const updateData = insertMemberSchema.partial().parse(req.body);

      await storage.updateMember(memberId, updateData);
      res.json({ message: "Member updated successfully" });
    } catch (error) {
      console.error("Error updating member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberId = parseInt(req.params.id);
      await storage.deleteMember(memberId);
      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  app.post("/api/members/:id/reset-password", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberId = parseInt(req.params.id);
      const newPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await storage.updateMemberPassword(memberId, hashedPassword);
      
      res.json({ 
        message: "Password reset successfully",
        newPassword: newPassword // Return plain password for admin to see
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Film endpoints
  app.post("/api/films", upload.single('coverImage'), authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filmData = insertFilmSchema.parse({
        ...req.body,
        coverImage: req.file ? `/uploads/${req.file.filename}` : null,
        scheduledDate: new Date(req.body.scheduledDate)
      });

      const film = await storage.createFilm(filmData);
      res.json(film);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create film" });
    }
  });

  app.get("/api/films", authenticateToken, async (req, res) => {
    try {
      const films = await storage.getAllFilms();

      // Add attendance count for each film
      const filmsWithStats = await Promise.all(
        films.map(async (film: any) => {
          const attendance = await storage.getFilmAttendance(film.id);
          return {
            ...film,
            attendanceCount: attendance.length
          };
        })
      );

      res.json(filmsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch films" });
    }
  });

  app.get("/api/films/upcoming", authenticateToken, async (req, res) => {
    try {
      const films = await storage.getUpcomingFilms();
      res.json(films);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming films" });
    }
  });

  app.get("/api/films/past", authenticateToken, async (req, res) => {
    try {
      const films = await storage.getPastFilms();
      res.json(films);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch past films" });
    }
  });

  app.put("/api/films/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filmId = parseInt(req.params.id);
      const filmData = insertFilmSchema.partial().parse({
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate)
      });

      await storage.updateFilm(filmId, filmData);
      res.json({ message: "Film updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update film" });
    }
  });

  app.delete("/api/films/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filmId = parseInt(req.params.id);
      await storage.deleteFilm(filmId);
      res.json({ message: "Film deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete film" });
    }
  });

  // Film proposals endpoints
  app.post("/api/proposals", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'member') {
        return res.status(403).json({ message: "Member access required" });
      }

      const proposalData = insertFilmProposalSchema.parse({
        ...req.body,
        memberId: req.user.id
      });

      const proposal = await storage.createFilmProposal(proposalData);
      res.json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  app.get("/api/proposals", authenticateToken, async (req, res) => {
    try {
      if (req.user.role === 'admin') {
        const proposals = await storage.getAllFilmProposals();
        res.json(proposals);
      } else {
        const proposals = await storage.getFilmProposalsByMember(req.user.id);
        res.json(proposals);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.patch("/api/proposals/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const proposalId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateProposalStatus(proposalId, status);
      res.json({ message: "Proposal status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  // Attendance endpoints
  app.post("/api/attendance", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { membershipCode, filmId } = req.body;

      const member = await storage.getMemberByMembershipCode(membershipCode);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Check if attendance already exists
      const existingAttendance = await storage.checkExistingAttendance(member.id, filmId);
      if (existingAttendance) {
        return res.status(400).json({ 
          message: `Presenza già registrata per ${member.firstName} ${member.lastName}`,
          memberName: `${member.firstName} ${member.lastName}`,
          alreadyMarked: true
        });
      }

      const attendance = await storage.markAttendance(member.id, filmId);
      res.json({ 
        message: "Attendance marked successfully", 
        attendance: {
          ...attendance,
          memberName: `${member.firstName} ${member.lastName}`
        }
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  app.get("/api/attendance/member/:memberId", authenticateToken, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);

      // Members can only view their own attendance, admins can view any
      if (req.user.role === 'member' && req.user.id !== memberId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const attendance = await storage.getMemberAttendance(memberId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/film/:filmId", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const filmId = parseInt(req.params.filmId);
      const attendance = await storage.getFilmAttendance(filmId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch film attendance" });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', (req: any, res: any, next: any) => {
    res.sendFile(req.path, { root: 'uploads' });
  });

  const httpServer = createServer(app);
  return httpServer;
}