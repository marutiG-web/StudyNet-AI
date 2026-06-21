import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { DB } from './src/db/db-json';

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

// Enable high-limit payload parsing for base64 study images
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// --- JWT HELPER IMPLEMENTATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'studybot_ultimate_secret_key_9876';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'studybot_ultimate_refresh_secret_key_9876';

function signAccessToken(payload: { id: string; role: 'user' | 'admin' | 'super_admin'; username: string; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ 
    ...payload, 
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes short-lived
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function signRefreshToken(payload: { id: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ 
    ...payload, 
    type: 'refresh',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days durable
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_REFRESH_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyAccessToken(token: string) {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decodedBody.type !== 'access') return null;
    if (decodedBody.exp && decodedBody.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decodedBody;
  } catch (err) {
    return null;
  }
}

function verifyRefreshToken(token: string) {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', JWT_REFRESH_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decodedBody.type !== 'refresh') return null;
    if (decodedBody.exp && decodedBody.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decodedBody;
  } catch (err) {
    return null;
  }
}

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

interface SendOTPEmailResult {
  success: boolean;
  error?: string;
  isSandboxRestriction?: boolean;
}

async function sendOTPEmail(email: string, otp: string, subjectTemplate: string): Promise<SendOTPEmailResult> {
  const rawHost = process.env.SMTP_HOST || '';
  const rawPort = process.env.SMTP_PORT || '587';
  const rawUser = process.env.SMTP_USER || '';
  const rawPass = process.env.SMTP_PASS || '';
  const rawFrom = process.env.SMTP_FROM || 'StudyNet.AI <no-reply@studynet.ai>';

  const host = rawHost.replace(/^["']|["']$/g, '').trim();
  const portStr = rawPort.replace(/^["']|["']$/g, '').trim();
  const user = rawUser.replace(/^["']|["']$/g, '').trim();
  const pass = rawPass.replace(/^["']|["']$/g, '').trim();
  const from = rawFrom.replace(/^["']|["']$/g, '').trim();

  const port = parseInt(portStr || '587');

  console.log("==================== STUDYNET OTP EMAIL DISPATCHER ====================");
  console.log(`[Email Request] Recipient: ${email} | Desired OTP: ${otp}`);

  const isSandboxEmail = email.toLowerCase().trim() === 'm.p.ghorpade2006@gmail.com';
  if (!isSandboxEmail) {
    console.log(`[Status] Sandbox Mode: Skipping SMTP delivery for non-owner address: ${email}`);
    console.log(`[Status] Secure random verification code generated: ${otp}`);
    return {
      success: false,
      error: "Resend Sandbox Mode: Recipient is not the verified owner.",
      isSandboxRestriction: true
    };
  }
  
  if (!host || !user || !pass) {
    console.log("[Status] WARNING: No SMTP environment variables discovered.");
    console.log(`[Status] To complete verifications, use the code: ${otp}`);
    console.log("=======================================================================");
    return { success: false, error: "SMTP settings not fully configured." };
  }

  const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0b0f19; padding: 40px 10px; color: #f1f5f9; text-align: center;">
        <div style="max-w: 500px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 40px; text-align: left; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Logo Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 50%; padding: 15px; margin-bottom: 12px;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1;">🎓</span>
            </div>
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">StudyNet.AI</h1>
            <p style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 4px 0 0 0;">Cognitive Student Network</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />

          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
            Hello,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
            A request was made to authenticate your student email and sign in to your study profile. Please enter the following 6-digit verification code to proceed:
          </p>

          <!-- OTP Code Display -->
          <div style="text-align: center; background-color: #090d16; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 28px 0;">
            <span style="font-size: 36px; font-weight: 900; font-family: 'Courier New', Courier, monospace; color: #818cf8; letter-spacing: 0.25em;">${otp}</span>
          </div>

          <p style="font-weight: 500; font-size: 11px; text-align: center; color: #f59e0b; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 8px; margin: 24px 0;">
            ⚠️ This code expires in 5 minutes and is valid for 3 attempts only.
          </p>

          <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin-top: 24px;">
            If you did not initiate this security verification, please ignore this email or secure your credentials.
          </p>

          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 30px 0;" />

          <!-- Footer details -->
          <div style="text-align: center; font-size: 11px; color: #475569; line-height: 1.5;">
            <p style="margin: 0;">&copy; 2026 StudyNet.AI. All rights reserved.</p>
            <p style="margin: 4px 0 0 0;">Campus Automation Platform | Secured by TLS encryption</p>
          </div>

        </div>
      </div>
    `;

  let lastErrorMsg = "";

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log(`[Status] Attempting email dispatch on primary port ${port}...`);
    await transporter.sendMail({
      from,
      to: email,
      subject: subjectTemplate,
      text: `Your StudyNet.AI verification code is: ${otp}. This code is valid for 5 minutes.`,
      html: htmlContent
    });

    console.log(`[Status] SUCCESS: Real Email dispatched to ${email} using Port ${port}`);
    console.log("=======================================================================");
    return { success: true };
  } catch (err: any) {
    lastErrorMsg = err.message || "";
    console.warn(`[Status] Primary SMTP dispatch failed on port ${port}: ${err.message}`);
    
    if (port !== 465) {
      console.log(`[Status] RETRYING: Falling back to Port 465 SSL for SMTP connection...`);
      try {
        const secureTransporter = nodemailer.createTransport({
          host,
          port: 465,
          secure: true,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        await secureTransporter.sendMail({
          from,
          to: email,
          subject: subjectTemplate,
          text: `Your StudyNet.AI verification code is: ${otp}. This code is valid for 5 minutes.`,
          html: htmlContent
        });

        console.log(`[Status] SUCCESS: Real Email dispatched to ${email} via Fallback Port 465 SSL`);
        console.log("=======================================================================");
        return { success: true };
      } catch (fallbackErr: any) {
        lastErrorMsg = fallbackErr.message || lastErrorMsg;
        console.error(`[Status] Fallback dispatch on Port 465 SSL also failed: ${fallbackErr.message}`);
      }
    }
  }

  console.log(`[Status] SMTP delivery failed completely. Details: ${lastErrorMsg}`);
  console.log("=======================================================================");

  const isSandboxRestriction = lastErrorMsg.includes("550") || 
                               lastErrorMsg.includes("only send testing emails") || 
                               lastErrorMsg.includes("verify a domain");

  return { 
    success: false, 
    error: lastErrorMsg, 
    isSandboxRestriction 
  };
}

// --- EXPRESS MIDDLEWARES ---
function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authorization header token missing.' });
  }

  const userPayload = verifyAccessToken(token);
  if (!userPayload) {
    return res.status(401).json({ success: false, isTokenExpired: true, error: 'AccessTokenExpired' });
  }

  // Refresh user object from Database to check current banned status
  const freshUser = DB.getUserById(userPayload.id);
  if (!freshUser) {
    return res.status(404).json({ success: false, error: 'User account not found.' });
  }

  // Automatically elevate role of specific developer email to super_admin
  if (freshUser.email.toLowerCase().trim() === 'm.p.ghorpade2006@gmail.com' && freshUser.role !== 'super_admin') {
    freshUser.role = 'super_admin';
    DB.updateUser(freshUser.id, { role: 'super_admin' });
  }

  if (freshUser.isBanned) {
    return res.status(403).json({ success: false, error: 'Your account has been banned by an Administrator.' });
  }

  req.user = freshUser;
  next();
}

function requireVerification(req: any, res: Response, next: NextFunction) {
  const settings = DB.getSettings();
  if (settings.enableOTPVerification && req.user.role === 'user' && !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      code: 'USER_UNVERIFIED',
      error: 'OTP Verification Required. Please verify your identity first.'
    });
  }
  next();
}

function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ success: false, error: 'Access denied. Administrator credentials required.' });
  }
  next();
}

function requireSuperAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Access denied. Super Administrator credentials required.' });
  }
  next();
}

// --- EDUCATIONAL DIAGRAM SEARCH STRATEGIES ---
function extractDiagramKeywords(text: string): string {
  // Clean punctuation
  let cleaned = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Remove common phrases
  const stopPhrases = [
    "explain the", "explain", "what is the", "what is", "how does", 
    "tell me about the", "tell me about", "describe the", "describe",
    "can you explain", "give me a", "show me a", "structure of a", "structure of the",
    "structure of", "diagram of a", "diagram of the", "diagram of", "anatomy of a",
    "anatomy of the", "anatomy of", "concept of a", "concept of the", "concept of",
    "molecular structure of", "molecular structure", "process of a", "process of the",
    "process of"
  ];

  for (const phrase of stopPhrases) {
    if (cleaned.startsWith(phrase)) {
      cleaned = cleaned.substring(phrase.length).trim();
    }
  }

  // Also strip common helper words
  const words = cleaned.split(" ");
  const stopWords = new Set([
    "a", "an", "the", "of", "and", "in", "to", "for", "with", "on", "at", "by", 
    "from", "about", "how", "what", "why", "where", "is", "are", "was", "were", "to", "can", "you", "does", "do"
  ]);

  const filteredWords = words.filter(w => !stopWords.has(w));
  
  if (filteredWords.length === 0) {
    return cleaned || "education";
  }

  // Take up to 3 meaningful words
  return filteredWords.slice(0, 3).join(" ");
}

function getSubjectSpecificQuery(userQuery: string): { query: string; subject: string } {
  const text = userQuery.toLowerCase();
  const cleaned = extractDiagramKeywords(userQuery);
  
  // 1. Chemistry
  const chemKeywords = ["chemistry", "chemical", "molecule", "molecular", "compound", "bond", "atom", "atomic", "benzene", "glucose", "methane", "water molecule", "covalent", "ionic", "alkane", "hydrocarbon", "polymer", "protein"];
  if (chemKeywords.some(kw => text.includes(kw))) {
    return { query: `${cleaned} molecular structure`, subject: "Chemistry" };
  }
  
  // 2. Biology
  const bioKeywords = ["biology", "biological", "anatomy", "cell", "organelle", "organ", "heart", "lung", "brain", "liver", "kidney", "digestive", "nervous", "respiratory", "circulatory", "photosynthesis", "mitosis", "meiosis", "dna", "rna", "plant", "flower", "leaf", "virus", "bacteria", "chloroplast", "mitochondria", "neuron", "muscle", "skeleton"];
  if (bioKeywords.some(kw => text.includes(kw))) {
    return { query: `${cleaned} anatomy diagram`, subject: "Biology" };
  }
  
  // 3. Physics
  const physicsKeywords = ["physics", "physical", "gravity", "force", "acceleration", "velocity", "thermodynamics", "circuit", "resistor", "capacitor", "inductor", "voltage", "current", "wave", "optics", "light", "lens", "laser", "pendulum", "quantum", "electromagnet", "magnetic", "electric field"];
  if (physicsKeywords.some(kw => text.includes(kw))) {
    return { query: `${cleaned} physics concept illustration`, subject: "Physics" };
  }
  
  // 4. Math
  const mathKeywords = ["math", "mathematics", "calculus", "geometry", "trigonometry", "algebra", "sine", "cosine", "tangent", "parabola", "ellipse", "hyperbola", "graph", "plot", "derivative", "integral", "matrix", "vector", "pythagorean", "triangle"];
  if (mathKeywords.some(kw => text.includes(kw))) {
    return { query: `${cleaned} math graph plot`, subject: "Mathematics" };
  }
  
  // 5. Coding / CS
  const csKeywords = ["coding", "programming", "software", "algorithm", "flowchart", "binary tree", "queue", "stack", "graph", "database", "client server", "mvc", "architecture", "network", "tcp", "ip", "dns", "http", "socket", "process", "thread", "cache"];
  if (csKeywords.some(kw => text.includes(kw))) {
    return { query: `${cleaned} architecture diagram flowchart`, subject: "Computer Science" };
  }
  
  // 6. History
  const historyKeywords = ["history", "historical", "empire", "revolution", "battle", "war", "civil war", "ww1", "ww2", "napoleon", "roman", "greece", "egypt", "medieval", "renaissance", "timeline", "map", "dynasty", "treaty"];
  if (historyKeywords.some(kw => text.includes(kw))) {
    return { query: `${cleaned} map timeline`, subject: "History" };
  }
  
  // General/Fallback
  return { query: `${cleaned} educational diagram`, subject: "General Studies" };
}

function extractMultipleAcademicConcepts(text: string): string[] {
  const lowercase = text.toLowerCase().trim();
  const concepts: string[] = [];
  
  const diffMatch = lowercase.match(/difference between\s+(.+?)\s+and\s+(.+)/);
  if (diffMatch && diffMatch[1] && diffMatch[2]) {
    concepts.push(diffMatch[1].trim(), diffMatch[2].trim());
  } else {
    const compareMatch = lowercase.match(/compare\s+(.+?)\s+and\s+(.+)/);
    if (compareMatch && compareMatch[1] && compareMatch[2]) {
      concepts.push(compareMatch[1].trim(), compareMatch[2].trim());
    } else if (lowercase.includes(" vs ")) {
      const parts = lowercase.split(" vs ");
      for (const p of parts) {
         if (p.trim()) concepts.push(p.trim());
      }
    } else if (lowercase.includes(" versus ")) {
      const parts = lowercase.split(" versus ");
      for (const p of parts) {
         if (p.trim()) concepts.push(p.trim());
      }
    }
  }
  
  const cleanedConcepts = concepts.map(c => extractDiagramKeywords(c)).filter(c => c.length >= 2);
  if (cleanedConcepts.length >= 2) {
    return cleanedConcepts;
  }
  
  const single = extractDiagramKeywords(text);
  return single.length >= 2 ? [single] : [];
}

function scoreAndFilterDiagrams(pages: any, concept: string, subject: string): Array<{ title: string, url: string, score: number }> {
  const results: Array<{ title: string, url: string, score: number }> = [];
  const conceptWords = concept.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  for (const key of Object.keys(pages)) {
    const page = pages[key];
    if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
      const imageUrl = page.imageinfo[0].url;
      const title = page.title.replace(/^File:/, '').replace(/_/g, ' ');
      const lowercaseTitle = title.toLowerCase();
      const lowercaseUrl = imageUrl.toLowerCase();
      
      // Basic formats check
      if (
        !lowercaseUrl.endsWith('.png') && 
        !lowercaseUrl.endsWith('.jpg') && 
        !lowercaseUrl.endsWith('.jpeg') && 
        !lowercaseUrl.endsWith('.svg') && 
        !lowercaseUrl.endsWith('.gif')
      ) {
         continue;
      }
      
      // Reject obvious non-educational elements or UI banners/flags
      if (
        lowercaseUrl.includes('icon') || 
        lowercaseUrl.includes('symbol') || 
        lowercaseUrl.includes('logo') ||
        lowercaseUrl.includes('button') ||
        lowercaseUrl.includes('banner') ||
        lowercaseUrl.includes('avatar') ||
        lowercaseUrl.includes('flag_of_') ||
        lowercaseTitle.includes('portrait')
      ) {
        continue;
      }
      
      let score = 0;
      
      // 1. Precise text alignment scoring
      let matchesAllWords = true;
      let matchedCount = 0;
      for (const word of conceptWords) {
        if (lowercaseTitle.includes(word)) {
          score += 8;
          matchedCount++;
        } else {
          matchesAllWords = false;
        }
      }
      
      if (conceptWords.length > 0 && matchesAllWords) {
        score += 30; // Exact concept term match bonus
      } else if (matchedCount > 0) {
        score += matchedCount * 5;
      }
      
      // Soft penalty if we match only ONE word out of a multi-word academic concept
      if (conceptWords.length >= 2 && matchedCount === 1) {
        score -= 8;
      }
      // Heavy penalty for multi-word concept if we match less than 50% of terms
      if (conceptWords.length >= 3 && matchedCount < Math.ceil(conceptWords.length / 2)) {
        score -= 15;
      }
      
      // 2. Diagram & Schematic indicators
      const diagramKeywords = [
        { term: 'diagram', pts: 18 },
        { term: 'schematic', pts: 18 },
        { term: 'anatomy', pts: 18 },
        { term: 'structure', pts: 18 },
        { term: 'molecular', pts: 18 },
        { term: 'flowchart', pts: 18 },
        { term: 'timeline', pts: 18 },
        { term: 'circuit', pts: 18 },
        { term: 'graph', pts: 12 },
        { term: 'plot', pts: 12 },
        { term: 'formula', pts: 12 },
        { term: 'chart', pts: 12 },
        { term: 'map', pts: 10 },
        { term: 'illustration', pts: 8 }
      ];
      
      for (const item of diagramKeywords) {
        if (lowercaseTitle.includes(item.term)) {
          score += item.pts;
        }
      }
      
      // 3. Vector and high quality illustration priority
      if (lowercaseUrl.endsWith('.svg')) {
        score += 10;
      } else if (lowercaseUrl.endsWith('.png')) {
        score += 5;
      } else if (lowercaseUrl.endsWith('.gif')) {
        score += 2;
      }
      
      // 4. Quality indicators - filter out photographic tags
      if (
        lowercaseTitle.includes('photo') || 
        lowercaseTitle.includes('camera') || 
        lowercaseTitle.includes('dsc_') || 
        lowercaseTitle.includes('img_') ||
        lowercaseTitle.includes('portrait') ||
        lowercaseTitle.includes('monument') ||
        lowercaseTitle.includes('statue') ||
        lowercaseTitle.includes('building')
      ) {
        score -= 25;
      }
      
      // 5. Subject keyword relevance booster
      const subjectBoosters: Record<string, string[]> = {
        'Chemistry': ['molecule', 'molecular', 'atom', 'bond', 'crystal', 'reaction', 'orbital', 'structure'],
        'Biology': ['anatomy', 'cell', 'organelle', 'organ', 'system', 'specimen', 'tissue', 'photosynthesis', 'mitosis', 'meiosis'],
        'Physics': ['force', 'vector', 'wave', 'optics', 'magnetic', 'electric', 'circuit', 'lens', 'schematic'],
        'Mathematics': ['graph', 'plot', 'axis', 'curve', 'function', 'geometry', 'matrix'],
        'Computer Science': ['flowchart', 'architecture', 'concept', 'structure', 'binary', 'tree', 'logic', 'diagram'],
        'History': ['timeline', 'map', 'historical', 'chronology']
      };
      
      const boosters = subjectBoosters[subject];
      if (boosters) {
        for (const b of boosters) {
          if (lowercaseTitle.includes(b)) {
            score += 8;
          }
        }
      }
      
      // Require a minimum relevance score of 12 to filter out generic noisy photographs
      if (score >= 12) {
        results.push({
          title: title.replace(/\.[^/.]+$/, '').trim(),
          url: imageUrl,
          score
        });
      }
    }
  }
  
  // Sort descending by relevance score
  return results.sort((a, b) => b.score - a.score);
}

async function searchWikimediaCommons(concept: string, subject: string): Promise<Array<{ title: string, url: string, score: number }>> {
  try {
    const cleanConcept = concept.toLowerCase().trim();
    if (!cleanConcept) return [];

    // Formulate sequential attempts prioritizing exact name and specific suffixes
    const searchQueries: string[] = [];
    searchQueries.push(cleanConcept);

    if (subject === "Chemistry") {
      searchQueries.push(`${cleanConcept} molecule`);
      searchQueries.push(`${cleanConcept} structure`);
    } else if (subject === "Biology") {
      searchQueries.push(`${cleanConcept} diagram`);
      searchQueries.push(`${cleanConcept} anatomy`);
    } else if (subject === "Physics") {
      searchQueries.push(`${cleanConcept} diagram`);
      searchQueries.push(`${cleanConcept} physics`);
    } else if (subject === "Mathematics") {
      searchQueries.push(`${cleanConcept} graph`);
      searchQueries.push(`${cleanConcept} plot`);
    } else if (subject === "Computer Science") {
      searchQueries.push(`${cleanConcept} flowchart`);
      searchQueries.push(`${cleanConcept} diagram`);
    } else {
      searchQueries.push(`${cleanConcept} diagram`);
    }

    const words = cleanConcept.split(/\s+/);
    if (words.length > 2) {
      searchQueries.push(words.slice(0, -1).join(" "));
    }

    let pagesToScore: any = null;

    // Run sequential queries on MediaWiki generator search
    for (const searchQuery of searchQueries) {
      const query = encodeURIComponent(searchQuery);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrlimit=12&gsrnamespace=6&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        if (data.query && data.query.pages) {
          pagesToScore = data.query.pages;
          break;
        }
      }
    }

    // Try last-resort first-word fallback ONLY if absolutely nothing of the complete multi-word concept was found,
    // and only if the single-word term has academic substance (> 3 characters)
    if (!pagesToScore && words.length > 1) {
      const fallbackTerm = words[0];
      if (fallbackTerm.length > 3) {
        const query = encodeURIComponent(fallbackTerm);
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${query}&gsrlimit=6&gsrnamespace=6&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
        const res = await fetch(url);
        if (res.ok) {
          const data: any = await res.json();
          if (data.query && data.query.pages) {
            pagesToScore = data.query.pages;
          }
        }
      }
    }

    if (!pagesToScore) {
      return [];
    }

    // Match and score retrieved files against the original, full, multi-word concept!
    return scoreAndFilterDiagrams(pagesToScore, concept, subject);
  } catch (error) {
    console.error("Wikimedia Commons search error:", error);
    return [];
  }
}

async function fetchDiagramsForQuery(content: string): Promise<Array<{ title: string; url: string }>> {
  // Check if content is a simple greeting style or is too short
  const cleanTerm = extractDiagramKeywords(content);
  if (cleanTerm.length < 2) return [];
  
  // Check greetings
  const words = cleanTerm.split(" ");
  const greetings = new Set(["hello", "hi", "hey", "yo", "greetings", "thanks", "thank", "ok", "yes", "no", "bye"]);
  if (words.every(w => greetings.has(w))) return [];

  const concepts = extractMultipleAcademicConcepts(content);
  const found: Array<{ title: string; url: string; score: number }> = [];
  
  const resultsArray = await Promise.all(
    concepts.map(async (concept) => {
      const searchObj = getSubjectSpecificQuery(concept);
      // Query using the raw specific concept on Wikimedia and the detected academic subject category
      const results = await searchWikimediaCommons(concept, searchObj.subject);
      return results;
    })
  );
  for (const results of resultsArray) {
    // Take top 2 Diagrams per concept to support comparative matching
    found.push(...results.slice(0, 2));
  }
  
  // Deduplicate and filter matches
  const uniqueUrls = new Set<string>();
  const finalDiagrams: Array<{ title: string; url: string }> = [];
  for (const f of found) {
    if (!uniqueUrls.has(f.url)) {
      uniqueUrls.add(f.url);
      finalDiagrams.push({ title: f.title, url: f.url });
    }
  }
  
  return finalDiagrams.slice(0, 4);
}

// --- GEMINI Client Lazy-Loader ---
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined in Environment Secrets.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// --- API ENDPOINTS ---

// 1. Auth Routing
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields (username, email, password) are required.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, error: 'Username must be at least 3 characters long.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid academic email address.' });
    }

    const emailClean = email.toLowerCase().trim();
    if (DB.getUserByEmail(emailClean)) {
      return res.status(400).json({ success: false, error: 'This email is already registered.' });
    }

    // Role detection based on email triggers (including superadmin)
    let role: 'user' | 'admin' | 'super_admin' = 'user';
    if (emailClean === 'superadmin@studybot.com' || emailClean === 'm.p.ghorpade2006@gmail.com') {
      role = 'super_admin';
    } else if (emailClean.includes('admin@studybot.com')) {
      role = 'admin';
    }

    const newUser = DB.createUser(username, emailClean, password, role);
    const settings = DB.getSettings();
    const shouldVerify = settings.enableOTPVerification;

    let otpData: any = {};
    if (shouldVerify) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = hashOTP(otp);
      const otpExpiry = new Date(Date.now() + 5 * 60000).toISOString();
      
      DB.updateUser(newUser.id, {
        otpHash,
        otpExpiry,
        otpAttempts: 0,
        isVerified: false,
        otpLastRequested: new Date().toISOString()
      });

      // Synchronously dispatch to check for deliverability failures
      const emailSent = await sendOTPEmail(newUser.email, otp, '🎓 StudyNet.AI - Welcome Verification OTP');
      if (emailSent.success) {
        otpData = {
          requiresVerification: true,
          userId: newUser.id,
          email: newUser.email,
          message: "OTP sent successfully to your email address."
        };
      } else {
        otpData = {
          requiresVerification: true,
          userId: newUser.id,
          email: newUser.email,
          debugOtp: otp,
          message: emailSent.isSandboxRestriction
            ? "⚠️ Resend Sandbox Mode: Email delivery is restricted to verified email addresses in Resend. Please check your registered Resend owner inbox or use the secure code below."
            : `⚠️ SMTP Deliverability Fallback: Email delivery encountered a setup constraint (${emailSent.error || 'SMTP Connection Error'}). For review, please authenticate using this secure random code.`
        };
      }
    } else {
      DB.updateUser(newUser.id, { isVerified: true });
      newUser.isVerified = true;
    }

    const token = signAccessToken({
      id: newUser.id,
      role: newUser.role,
      username: newUser.username,
      email: newUser.email
    });
    const refreshToken = signRefreshToken({ id: newUser.id });

    res.json({
      success: true,
      token,
      refreshToken,
      ...otpData,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        plan: newUser.plan,
        isVerified: newUser.isVerified
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = DB.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Automatically elevate role of specific developer email to super_admin
    if (user.email.toLowerCase().trim() === 'm.p.ghorpade2006@gmail.com' && user.role !== 'super_admin') {
      user.role = 'super_admin';
      DB.updateUser(user.id, { role: 'super_admin' });
    }

    const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hashedInput) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, error: 'This account has been banned by an administrator.' });
    }

    const settings = DB.getSettings();
    const shouldVerify = settings.enableOTPVerification || user.role === 'admin' || user.role === 'super_admin';

    if (shouldVerify) {
      // Trigger OTP dispatch on login for unverified profiles
      const otp = Math.floor(100000 + Math.random() * 900005).toString();
      const otpHash = hashOTP(otp);
      const otpExpiry = new Date(Date.now() + 5 * 60000).toISOString();
      
      DB.updateUser(user.id, {
        otpHash,
        otpExpiry,
        otpAttempts: 0,
        isVerified: false,
        otpLastRequested: new Date().toISOString()
      });
      
      // Synchronously dispatch email to check for failure
      const emailSent = await sendOTPEmail(user.email, otp, '🔒 StudyNet.AI - Security Verification OTP');
      if (emailSent.success) {
        return res.status(200).json({
          success: false,
          requiresVerification: true,
          userId: user.id,
          email: user.email,
          message: "An OTP security code has been dispatched to your email."
        });
      } else {
        return res.status(200).json({
          success: false,
          requiresVerification: true,
          userId: user.id,
          email: user.email,
          debugOtp: otp,
          message: emailSent.isSandboxRestriction
            ? "⚠️ Resend Sandbox Mode: Email delivery is restricted to verified email addresses in Resend. Please check your registered Resend owner inbox or use the secure code below."
            : `⚠️ SMTP Deliverability Fallback: Email delivery encountered a setup constraint (${emailSent.error || 'SMTP Connection Error'}). For review, please authenticate using this secure random code.`
        });
      }
    } else {
      DB.updateUser(user.id, { isVerified: true });
      user.isVerified = true;
    }

    const token = signAccessToken({
      id: user.id,
      role: user.role,
      username: user.username,
      email: user.email
    });
    const refreshToken = signRefreshToken({ id: user.id });

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isVerified: user.isVerified
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token is required.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ success: false, error: 'Invalid or expired refresh token.' });
    }

    const freshUser = DB.getUserById(payload.id);
    if (!freshUser) {
      return res.status(404).json({ success: false, error: 'User associated with token not found.' });
    }

    if (freshUser.isBanned) {
      return res.status(403).json({ success: false, error: 'Account has been banned. Cannot refresh token.' });
    }

    const newAccessToken = signAccessToken({
      id: freshUser.id,
      role: freshUser.role,
      username: freshUser.username,
      email: freshUser.email
    });

    res.json({
      success: true,
      token: newAccessToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// OTP Sending Endpoint
app.post('/api/auth/otp/send', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;
    let user;
    if (userId) {
      user = DB.getUserById(userId);
    } else if (email) {
      user = DB.getUserByEmail(email);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const now = new Date();
    // Cooldown verification (Rate Limit: 1 minute between sequential OTP code requests)
    if (user.otpLastRequested) {
      const lastReq = new Date(user.otpLastRequested);
      const diffSeconds = (now.getTime() - lastReq.getTime()) / 1000;
      if (diffSeconds < 60) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${Math.ceil(60 - diffSeconds)} seconds before requesting a new OTP.`
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOTP(otp);
    const otpExpiry = new Date(now.getTime() + 5 * 60000).toISOString();

    DB.updateUser(user.id, {
      otpHash,
      otpExpiry,
      otpAttempts: 0,
      otpLastRequested: now.toISOString()
    });

    // Synchronously dispatch to check for deliverability failure
    const emailSent = await sendOTPEmail(user.email, otp, '🔄 StudyNet.AI - Security Verification OTP (Resend)');
    if (emailSent.success) {
      res.json({
        success: true,
        message: "OTP sent successfully to your email address."
      });
    } else {
      res.json({
        success: true,
        isSandboxFallback: true,
        debugOtp: otp,
        message: emailSent.isSandboxRestriction
          ? "⚠️ Resend Sandbox Mode: Email delivery is restricted to verified email addresses in Resend. Please check your registered Resend owner inbox or use the secure code below."
          : `⚠️ SMTP Deliverability Fallback: Email delivery encountered a setup constraint (${emailSent.error || 'SMTP Connection Error'}). For review, please authenticate using this secure random code.`
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// OTP Verification Endpoint
app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, error: 'Student ID and 6-digit code are required.' });
    }

    const user = DB.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    if (user.isVerified) {
      return res.json({ success: true, isVerified: true, user, message: 'Your identity is already verified!' });
    }

    if (!user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ success: false, error: 'No active OTP verification flow found. Please request an OTP.' });
    }

    const now = new Date();
    if (now > new Date(user.otpExpiry)) {
      DB.updateUser(user.id, {
        otpHash: undefined,
        otpExpiry: undefined,
        otpAttempts: 0
      });
      return res.status(400).json({ success: false, error: 'The 6-digit verification code has expired (5-minute maximum limit). Please request a new code.' });
    }

    const currentAttempts = user.otpAttempts || 0;
    if (currentAttempts >= 3) {
      DB.updateUser(user.id, {
        otpHash: undefined,
        otpExpiry: undefined,
        otpAttempts: 0
      });
      return res.status(400).json({ success: false, error: 'Verification blocked. You exceeded the maximum failed attempts (3 attempts limit). Please request a new OTP.' });
    }

    const inputHash = hashOTP(otp.trim());
    if (user.otpHash === inputHash) {
      const updatedUser = DB.updateUser(user.id, {
        isVerified: true,
        otpHash: undefined,
        otpExpiry: undefined,
        otpAttempts: 0
      });

      console.log(`[STUDYBOT OTP VERIFIED] Verification success for: ${user.id}`);

      const token = signAccessToken({
        id: updatedUser.id,
        role: updatedUser.role,
        username: updatedUser.username,
        email: updatedUser.email
      });
      const refreshToken = signRefreshToken({ id: updatedUser.id });

      res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          plan: updatedUser.plan,
          isVerified: true
        },
        message: 'Acoustic identity verified successfully!'
      });
    } else {
      const nextAttempts = currentAttempts + 1;
      const remaining = 3 - nextAttempts;
      DB.updateUser(user.id, {
        otpAttempts: nextAttempts
      });

      if (remaining <= 0) {
        DB.updateUser(user.id, {
          otpHash: undefined,
          otpExpiry: undefined,
          otpAttempts: 0
        });
        return res.status(400).json({
          success: false,
          error: 'Verification session blocked. Too many wrong code entry attempts. Please request a new OTP!'
        });
      }

      res.status(400).json({
        success: false,
        error: `Incorrect 6-digit code. You have ${remaining} attempts remaining before numeric code expiry reset.`
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      plan: req.user.plan,
      isBanned: req.user.isBanned,
      dailyMessagesCount: req.user.dailyMessagesCount,
      lastMessageDate: req.user.lastMessageDate,
      createdAt: req.user.createdAt,
      isVerified: req.user.isVerified
    }
  });
});

// --- BOOKSTORE & LIBRARY SYSTEM ROUTING ---
app.get('/api/books', (req: any, res: Response) => {
  try {
    const books = DB.getBooks();
    res.json({ success: true, books });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/books/my', authenticateToken, (req: any, res: Response) => {
  try {
    const books = DB.getPurchasedBooksForUser(req.user.id);
    res.json({ success: true, books });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/books/buy', authenticateToken, (req: any, res: Response) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, error: 'Book ID is required.' });
    }
    const book = DB.getBookById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found.' });
    }

    const purchase = DB.buyBook(req.user.id, bookId, book.price);
    res.json({ success: true, purchase, message: `Successfully acquired: ${book.title}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/books/add', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { title, author, price, description, category, downloadUrl, totalPages, coverUrl } = req.body;
    if (!title || !author || price === undefined || !description || !category) {
      return res.status(400).json({ success: false, error: 'Title, author, price, description, and category are required.' });
    }
    const book = DB.addBook(title, author, Number(price), description, category, downloadUrl, Number(totalPages), coverUrl);
    res.json({ success: true, book });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/books/:id', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const book = DB.updateBook(id, req.body);
    res.json({ success: true, book });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/books/:id', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const success = DB.deleteBook(id);
    res.json({ success, message: success ? 'Book successfully archived.' : 'Book not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/books/purchases/all', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const purchases = DB.getAllPurchases();
    const users = DB.getUsers();
    const books = DB.getBooks();
    const enriched = purchases.map(p => {
      const u = users.find(usr => usr.id === p.userId);
      const b = books.find(bk => bk.id === p.bookId);
      return {
        ...p,
        username: u ? u.username : 'Unknown Student',
        email: u ? u.email : '',
        bookTitle: b ? b.title : 'Archived Textbook'
      };
    });
    res.json({ success: true, purchases: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Chat Routing & Message Solving
app.get('/api/chat/sessions', authenticateToken, requireVerification, (req: any, res: Response) => {
  try {
    const sessions = DB.getSessions((req.user.role === 'admin' || req.user.role === 'super_admin') ? undefined : req.user.id);
    res.json({ success: true, sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat/session/create', authenticateToken, requireVerification, (req: any, res: Response) => {
  try {
    const { title } = req.body;
    const session = DB.createSession(req.user.id, title || 'New Study Session');
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat/session/delete', authenticateToken, requireVerification, (req: any, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required.' });
    }
    // Users can only delete their own. Admin/SuperAdmin can delete any.
    const deleted = DB.deleteSession(sessionId, (req.user.role === 'admin' || req.user.role === 'super_admin') ? undefined : req.user.id);
    res.json({ success: deleted, error: deleted ? undefined : 'Session not found or authorization failed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat', authenticateToken, requireVerification, async (req: any, res: Response) => {
  try {
    const { sessionId, content, attachedImage, attachedFile, enableWebSearch } = req.body;
    if (!sessionId || !content) {
      return res.status(400).json({ success: false, error: 'Session ID and message content are required.' });
    }

    const session = DB.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Study session not found.' });
    }

    const user = req.user;
    const plan = user.plan || 'free';
    const settings = DB.getSettings();
    const todayStr = new Date().toISOString().split('T')[0];

    // Determine plan specific message limits
    let allowedDailyLimit = settings.freePlanLimit;
    if (plan === 'basic') {
      allowedDailyLimit = settings.basicPlanLimit;
    } else if (plan === 'pro') {
      allowedDailyLimit = settings.proPlanLimit;
    }

    // Role Based Access Controls & Limits Checking (Admins/SuperAdmins bypass limit checkpoints)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      let currentMessagesCount = user.dailyMessagesCount;
      if (user.lastMessageDate !== todayStr) {
        currentMessagesCount = 0;
      }

      if (currentMessagesCount >= allowedDailyLimit) {
        return res.status(429).json({
          success: false,
          error: `Daily learning threshold reached. Your ${plan.toUpperCase()} plan limit is ${allowedDailyLimit} messages. Please upgrade your subscription plan to expand your request quota!`
        });
      }

      // Increment quota count
      DB.updateUser(user.id, {
        dailyMessagesCount: currentMessagesCount + 1,
        lastMessageDate: todayStr
      });
    }

    // Check Image Upload Toggles
    if (attachedImage) {
      const allowedImage = plan === 'pro' ? settings.enableImagePro : plan === 'basic' ? settings.enableImageBasic : settings.enableImageFree;
      if (!allowedImage) {
        return res.status(403).json({
          success: false,
          error: `Image upload is disabled on the ${plan.toUpperCase()} tier. Please upgrade to a higher subscription plan to submit academic images!`
        });
      }
    }

    // Check Document Notes Upload Toggles
    if (attachedFile) {
      const allowedFile = plan === 'pro' ? settings.enableFilePro : plan === 'basic' ? settings.enableFileBasic : settings.enableFileFree;
      if (!allowedFile) {
        return res.status(403).json({
          success: false,
          error: `Lecture notes upload (.txt/PDF) is disabled on the ${plan.toUpperCase()} tier. Please upgrade your plan to index documentation!`
        });
      }
    }

    // Simulated slow latency is removed so the instructor bot replies immediately

    // Capture User Message
    const userMsg = DB.addMessage(sessionId, 'user', content, attachedImage, attachedFile);

    // Call Gemini API
    const ai = getGemini();
    let contentsPayload: any;

    if (attachedFile) {
      // Decode PDF or notes base64 content
      const base64Data = attachedFile.base64.replace(/^data:[\w/+-]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: attachedFile.type
            }
          },
          {
            text: content
          }
        ]
      };
    } else if (attachedImage) {
      // Clean base64 strip
      const base64Data = attachedImage.replace(/^data:image\/\w+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png'
            }
          },
          {
            text: content
          }
        ]
      };
    } else {
      // Memory Limit Filtering:
      // FREE: No long memory (only latest question)
      // BASIC: Chat history enabled (up to past 5 messages)
      // PRO: Full memory system (all messages)
      let filteredHistory = session.messages;
      if (plan === 'free') {
        filteredHistory = filteredHistory.slice(-1);
      } else if (plan === 'basic') {
        filteredHistory = filteredHistory.slice(-5);
      }

      contentsPayload = {
        parts: filteredHistory.map((m: any) => ({
          text: `${m.role === 'user' ? 'User Question' : 'Instructor Answer'}: ${m.content}`
        })).concat({ text: `Latest Student Question: ${content}` })
      };
    }

    // Resolve subject-specific query & run educational diagram search
    const searchQueryResult = getSubjectSpecificQuery(content);
    const foundDiagrams = await fetchDiagramsForQuery(content);

    // Professional Teacher AI behavior, response length constraints and diagram guidelines
    let systemPromptBase = settings.systemPrompt || '';
    let teachingDirective = `\n\n[CORE ACADEMIC INSTRUCTORS DIRECTIVES]:
1. Act as an expert Study Teacher AI. Answer educational questions with high-quality, professional learning patterns modeled after premium platforms such as GeeksforGeeks, MDN Web Docs, and W3Schools.
2. Direct structure requirement:
   - If the student's question is about a Coding, Algorithms, or Software Engineering topic, you MUST structure your answer precisely using the following 10 sections (use CAPITALIZED plain text headers with blank lines before/after, do NOT use asterisks, hashes, or dollar signs):
     a. CONCEPT EXPLANATION: Simplify difficult terms using highly educational and clear analogies.
     b. SYNTAX: Formal syntax pattern of the code structure.
     c. EXAMPLE CODE: Complete, non-mock, readable code block in the relevant programming language.
     d. OUTPUT: Expected clean standard output representation of the example code.
     e. DRY RUN: Walk line-by-line explaining variable changes for a hypothetical test execution.
     f. TIME COMPLEXITY: Standard Big-O notation with detailed explanations of why.
     g. SPACE COMPLEXITY: Space footprint in Big-O notation with short explanation.
     h. COMMON MISTAKES: Mistakes beginners do, with clear suggestions.
     i. INTERVIEW AND PRACTICE QUESTIONS: Highly relevant practice questions likely asked in interviews.
     j. DIAGRAM WALKTHROUGH: Briefly reference, explain, and annotate the specific diagram(s) listed in the [VERIFIED ACADEMIC IMAGES AND DIAGRAMS] section below. Walk through the elements and process flows depicted.

   - If the student's question is about a Theory, Science, Math, History, or General Academic subject, you MUST structure your answer precisely using the following 7 sections (use CAPITALIZED plain text headers with blank lines before/after, do NOT use asterisks, hashes, or dollar signs):
     a. DEFINITION: Exam-friendly precise definition.
     b. DETAILED EXPLANATION: In-depth theoretical walkthrough using clear, beginner-friendly academic language.
     c. KEY POINTS AND CHEAT SHEET: Structured bullet-point recap of the fundamental takeaways. Use simple dashes (-) or numbers.
     d. REAL LIFE ANALOGY AND EXAMPLE: Relate the concept to everyday physical systems or analogies.
     e. EXAM PREP NOTES: Critical summaries, common pitfalls, and highlighting typical exam structures.
     f. DIAGRAM AND REFERENCING VISUALS: Point directly to the diagram(s) found in the references below. You MUST walk through and describe what is visible in these diagrams, detail their exact labels, and connect them concept-by-concept. Show how the visual directly models the theory. Always explain the visual diagram briefly right after discussing it.
     g. FAQS: Answers to the top 2-3 common student questions about this exact subject.

3. NEVER output messy, low-quality ASCII art charts or fake text-based diagrams. Rely entirely on the real high-resolution images provided in the reference panel below. Ensure answers are structured professionally and prioritize academic depth over short replies.
4. IMPORTANT FORMATTING DIRECTIVE: Under no circumstances should you ever use asterisks (*), hashes (#), or dollar signs ($) in your response. No markdown bolding, no markdown headers, no math dollar formatting. Format all headers in CAPITAL LETTERS on their own line with a blank line before and after, and use simple dashes (-) or numbers for list items.`;

    if (foundDiagrams.length > 0) {
      teachingDirective += `\n\n[VERIFIED ACADEMIC IMAGES AND DIAGRAMS RELATED TO THIS TOPIC]:
The backend system has queried trusted, peer-reviewed educational repositories (like Wikimedia Commons) and retrieved the following real, high-resolution visual diagrams and labeled charts for this lesson topic ("${searchQueryResult.subject}"):
${foundDiagrams.map((d, i) => `Diagram ${i + 1}: [${d.title}] - ${d.url}`).join('\n')}

You MUST reference and explain these exact diagrams and images in your explanation! Walk the student through the structures, labels, and flow depicted in these specific URLs. Do NOT output fake ASCII charts.`;
    }

    if (plan === 'free') {
      teachingDirective += `\n\n5. The current student is on the FREE plan. Provide a basic but clear homework explanation, and include a warm notification line at the very end suggesting they can upgrade to Basic or Pro to unlock custom visual diagrams, unlimited limits, memory retention, and file attachments!`;
    } else if (plan === 'basic') {
      teachingDirective += `\n\n5. The current student is on the BASIC plan. Provide a comprehensive, detailed explanation with full multi-turn step-by-step breakdowns and analogies.`;
    } else {
      teachingDirective += `\n\n5. The current student is on the premium PRO plan. Deliver your absolute highest standard of expert academic analysis, complete with advanced visual annotations, priority responses, and premium reasoning.`;
    }

    const configPayload: any = {
      systemInstruction: systemPromptBase + teachingDirective,
      temperature: settings.chatbotTone === 'academic' ? 0.2 : settings.chatbotTone === 'rigorous' ? 0.3 : 0.7
    };

    if (enableWebSearch) {
      configPayload.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contentsPayload,
      config: configPayload
    });

    let botTextResponse = response.text || "I apologize, let's re-examine that study topic! Could you please detail your question?";
    
    // Clean all forbidden formatting symbols (*, #, $), keeping clean letters/numbers
    botTextResponse = botTextResponse.replace(/[\*#\$]/g, '');
    
    const modelMsg = DB.addMessage(sessionId, 'model', botTextResponse, undefined, undefined, foundDiagrams);

    res.json({
      success: true,
      userMessage: userMsg,
      modelMessage: modelMsg,
      dailyMessagesCount: (req.user.role === 'admin' || req.user.role === 'super_admin') ? 0 : req.user.dailyMessagesCount + 1
    });

  } catch (err: any) {
    console.error('Gemini error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI Chat assistance failed.' });
  }
});

// 3. Admin User controls
app.get('/api/admin/users', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    res.json({ success: true, users: DB.getUsers() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/toggle-ban', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }
    const updatedUser = DB.toggleUserBan(userId);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/update-quota', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { userId, dailyMessagesCount } = req.body;
    if (!userId || dailyMessagesCount === undefined) {
      return res.status(400).json({ success: false, error: 'User ID and daily count required.' });
    }
    const updatedUser = DB.updateUser(userId, { dailyMessagesCount: Number(dailyMessagesCount) });
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/update-role', authenticateToken, requireSuperAdmin, (req: any, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'User ID and role selection required.' });
    }
    if (role !== 'user' && role !== 'admin' && role !== 'super_admin') {
      return res.status(400).json({ success: false, error: 'Invalid academic role selected.' });
    }
    if (userId === 'usr_superadmin') {
      return res.status(400).json({ success: false, error: 'The SaaS main director cannot be demoted.' });
    }
    const updatedUser = DB.updateUser(userId, { role });
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/update-plan', authenticateToken, (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ success: false, error: 'Plan selection required.' });
    }
    if (plan !== 'free' && plan !== 'basic' && plan !== 'pro') {
      return res.status(400).json({ success: false, error: 'Invalid platform subscription tier.' });
    }
    const updatedUser = DB.updateUser(userId, { plan });
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/update-plan', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { userId, plan } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ success: false, error: 'User ID and plan selection required.' });
    }
    if (plan !== 'free' && plan !== 'basic' && plan !== 'pro') {
      return res.status(400).json({ success: false, error: 'Invalid platform subscription tier.' });
    }
    if (userId === 'usr_superadmin' || userId === 'usr_admin') {
      return res.status(400).json({ success: false, error: 'Main system administrative plans are bypass-restricted.' });
    }
    const updatedUser = DB.updateUser(userId, { plan });
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/update-verification', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { userId, isVerified } = req.body;
    if (!userId || isVerified === undefined) {
      return res.status(400).json({ success: false, error: 'User ID and verification state are required.' });
    }
    const targetUser = DB.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }
    const updatedUser = DB.updateUser(userId, { isVerified: !!isVerified });
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/delete', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }
    if (userId === 'usr_superadmin' || userId === 'usr_admin') {
      return res.status(400).json({ success: false, error: 'Core system administrative profiles are deletion-protected.' });
    }

    const targetUser = DB.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // Role protection - normal admin cannot delete academic admin or superadmin
    if ((targetUser.role === 'admin' || targetUser.role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Only a Super Administrator can permanently purge administrative accounts.' });
    }

    const success = DB.deleteUser(userId);
    res.json({ success, error: success ? undefined : 'Failed to exclude user from database.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin Chat Controls & Master Log
app.get('/api/admin/chats', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const allSessions = DB.getSessions();
    const users = DB.getUsers();

    // Map username back into sessions
    const enrichedSessions = allSessions.map(s => {
      const u = users.find(usr => usr.id === s.userId);
      return {
        ...s,
        username: u ? u.username : 'Unknown Student',
        email: u ? u.email : 'unknown@edu.com'
      };
    });

    res.json({ success: true, sessions: enrichedSessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/chats/delete-message', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { sessionId, messageId } = req.body;
    if (!sessionId || !messageId) {
      return res.status(400).json({ success: false, error: 'Session ID and Message ID are required.' });
    }
    const success = DB.deleteMessage(sessionId, messageId);
    res.json({ success, error: success ? undefined : 'Message not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/chats/delete-session', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required.' });
    }
    const success = DB.deleteSession(sessionId);
    res.json({ success, error: success ? undefined : 'Session not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin Settings Controls
app.get('/api/admin/settings', authenticateToken, (req: any, res: Response) => {
  try {
    // Both users and admin can fetch settings to adapt frontend voice/image buttons or tones
    res.json({ success: true, settings: DB.getSettings() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/settings', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { 
      systemPrompt, 
      enableImageAI, 
      enableVoiceAI, 
      dailyLimitPerUser, 
      chatbotTone,
      freePlanLimit,
      basicPlanLimit,
      proPlanLimit,
      enableImageFree,
      enableImageBasic,
      enableImagePro,
      enableFileFree,
      enableFileBasic,
      enableFilePro,
      enableOTPVerification
    } = req.body;

    const updated = DB.updateSettings({
      systemPrompt,
      enableImageAI: enableImageAI !== undefined ? !!enableImageAI : undefined,
      enableVoiceAI: enableVoiceAI !== undefined ? !!enableVoiceAI : undefined,
      dailyLimitPerUser: dailyLimitPerUser !== undefined ? Number(dailyLimitPerUser) : undefined,
      chatbotTone,
      freePlanLimit: freePlanLimit !== undefined ? Number(freePlanLimit) : undefined,
      basicPlanLimit: basicPlanLimit !== undefined ? Number(basicPlanLimit) : undefined,
      proPlanLimit: proPlanLimit !== undefined ? Number(proPlanLimit) : undefined,
      enableImageFree: enableImageFree !== undefined ? !!enableImageFree : undefined,
      enableImageBasic: enableImageBasic !== undefined ? !!enableImageBasic : undefined,
      enableImagePro: enableImagePro !== undefined ? !!enableImagePro : undefined,
      enableFileFree: enableFileFree !== undefined ? !!enableFileFree : undefined,
      enableFileBasic: enableFileBasic !== undefined ? !!enableFileBasic : undefined,
      enableFilePro: enableFilePro !== undefined ? !!enableFilePro : undefined,
      enableOTPVerification: enableOTPVerification !== undefined ? !!enableOTPVerification : undefined
    });

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Analytics stats endpoint
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    res.json({ success: true, stats: DB.getStats() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Direct Dynamic Image Solving Endpoint
app.post('/api/upload-image', authenticateToken, async (req: any, res: Response) => {
  try {
    const { attachedImage, question } = req.body;
    if (!attachedImage) {
      return res.status(400).json({ success: false, error: 'Base64 image stream is required.' });
    }

    const settings = DB.getSettings();
    if (!settings.enableImageAI) {
      return res.status(403).json({ success: false, error: 'Image analytical solver has been disabled by administrators.' });
    }

    const cleanBase64 = attachedImage.replace(/^data:image\/\w+;base64,/, '');
    const ai = getGemini();

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png'
            }
          },
          {
            text: question || 'Transcribe any text or problems found in this academic image, and solve it step-by-step as a friendly student tutor. Provide clean layouts and examples.'
          }
        ]
      },
      config: {
        systemInstruction: settings.systemPrompt
      }
    });

    res.json({
      success: true,
      textResult: response.text || 'We could not analyze this educational snapshot. Please try re-taking the study sample.'
    });

  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Image solver failed.' });
  }
});

// --- 7. Custom Dynamic Pages & Media Library API routes ---

// GET /api/pages - Student accessible visible list of pages, Admin gets all pages
app.get('/api/pages', (req: any, res: Response) => {
  try {
    const pages = DB.getPages();
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let isAdmin = false;
    if (token) {
      const userPayload = verifyAccessToken(token);
      if (userPayload && (userPayload.role === 'admin' || userPayload.role === 'super_admin')) {
        isAdmin = true;
      }
    }

    if (isAdmin) {
      res.json({ success: true, pages });
    } else {
      res.json({ success: true, pages: pages.filter(p => p.visible) });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pages/:slug - Get detailed page content by slug
app.get('/api/pages/:slug', (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const page = DB.getPageBySlug(slug);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Custom page not found.' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let isAdmin = false;
    if (token) {
      const userPayload = verifyAccessToken(token);
      if (userPayload && (userPayload.role === 'admin' || userPayload.role === 'super_admin')) {
        isAdmin = true;
      }
    }

    if (!page.visible && !isAdmin) {
      return res.status(403).json({ success: false, error: 'This resource page is currently under offline maintenance.' });
    }

    res.json({ success: true, page });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/pages - Create dynamic custom page (SUPER_ADMIN ONLY)
app.post('/api/admin/pages', authenticateToken, requireSuperAdmin, (req: any, res: Response) => {
  try {
    const { title, slug, content, visible, isHtml } = req.body;
    if (!title || !slug || content === undefined) {
      return res.status(400).json({ success: false, error: 'Title, unique slug, and content are required.' });
    }
    const created = DB.createPage(title, slug, content, visible !== undefined ? !!visible : true, !!isHtml);
    res.json({ success: true, page: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/pages/:id - Update dynamic custom page (ADMIN & SUPER_ADMIN allowed)
app.put('/api/admin/pages/:id', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, visible, isHtml } = req.body;
    const updated = DB.updatePage(id, { title, slug, content, visible, isHtml });
    res.json({ success: true, page: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/pages/:id - Delete dynamic custom page (SUPER_ADMIN ONLY)
app.delete('/api/admin/pages/:id', authenticateToken, requireSuperAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const success = DB.deletePage(id);
    res.json({ success, error: success ? undefined : 'Custom page not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/media - Fetch admin media assets
app.get('/api/admin/media', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const media = DB.getMedia();
    res.json({ success: true, media });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/media - Upload image/PDF/other media asset in base64
app.post('/api/admin/media', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { name, type, size, base64 } = req.body;
    if (!name || !base64) {
      return res.status(400).json({ success: false, error: 'File name and base64 stream are required.' });
    }
    const uploaded = DB.addMedia(name, type, size, base64);
    res.json({ success: true, mediaItem: uploaded });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/media/:id - Remove media asset
app.delete('/api/admin/media/:id', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const success = DB.deleteMedia(id);
    res.json({ success, error: success ? undefined : 'Media asset not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 8. Dynamic Navigation Menus & Submenus API ---

// GET /api/menus - Student accessible navigational configuration
app.get('/api/menus', (req: Request, res: Response) => {
  try {
    const menus = DB.getNavigationMenus();
    res.json({ success: true, menus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/menus - Add navigation tab/link elements (Admins and Super-Admins)
app.post('/api/admin/menus', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { label, link, order, parentId } = req.body;
    if (!label || !link) {
      return res.status(400).json({ success: false, error: 'Menu name label and destination target link are required.' });
    }
    const created = DB.createNavigationMenu(label, link, Number(order) || 0, parentId);
    res.json({ success: true, menu: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/menus/:id - Update dynamic navigation target link
app.put('/api/admin/menus/:id', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { label, link, order, parentId } = req.body;
    const updated = DB.updateNavigationMenu(id, { label, link, order: order !== undefined ? Number(order) : undefined, parentId });
    res.json({ success: true, menu: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/menus/:id - Purge dynamic navigation link option (Admins and Super-Admins)
app.delete('/api/admin/menus/:id', authenticateToken, requireAdmin, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const success = DB.deleteNavigationMenu(id);
    res.json({ success, error: success ? undefined : 'Navigation menu config item not matched.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/change-password - Direct password override target (SUPER_ADMIN ONLY)
app.post('/api/admin/users/change-password', authenticateToken, requireSuperAdmin, (req: any, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, error: 'Student/Admin ID and secure input string are required.' });
    }
    const userToPatch = DB.getUserById(userId);
    if (!userToPatch) {
      return res.status(404).json({ success: false, error: 'User account not located in campus registries.' });
    }
    const hashed = crypto.createHash('sha256').update(newPassword).digest('hex');
    DB.updateUserPassword(userId, hashed);
    res.json({ success: true, message: `Successfully updated password for ${userToPatch.email}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/media/:id - Serve direct raw decoded media element (images, pdfs, sheets!)
app.get('/api/media/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const media = DB.getMediaById(id);
    if (!media) {
      return res.status(404).send('Resource media asset not found.');
    }

    // Decode the base64 and write directly as a binary stream
    let cleanBase64 = media.base64;
    let contentType = media.type || 'application/octet-stream';

    const matchMatches = media.base64.match(/^data:([^;]+);base64,(.*)$/);
    if (matchMatches) {
      contentType = matchMatches[1];
      cleanBase64 = matchMatches[2];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send('Failed to serve media asset.');
  }
});

// --- VITE DEV AND PROD MIDDLEWARE SETUP ---
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || indexExists;

  console.log(`[Status] Mode detected: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} (dist/index.html exists: ${indexExists})`);

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Status] Vite dev middleware loaded successfully.');
    } catch (viteError: any) {
      console.error(`[Status] Failed to load Vite development middleware: ${viteError.message}. Falling back to static files.`);
      // Fallback to static if Vite fails to load
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    // Support SPA fallback for multi-page routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Status] Serving static bundle from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyBot AI Platform Node Server] booting and running at http://localhost:${PORT}`);
  });
}

startServer();
