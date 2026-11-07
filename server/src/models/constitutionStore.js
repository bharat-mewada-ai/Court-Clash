import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AI_SERVICE_URL } from "../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INDIAN_CONST_JSON = path.join(__dirname, "..", "..", "..", "ai-service", "data", "indian_constitution.json");
const LANDMARK_CASES_JSON = path.join(__dirname, "..", "..", "..", "ai-service", "data", "landmark_cases.json");

class ConstitutionStore {
  constructor() {
    this.constitutions = new Map();
    this.loadBuiltIn();
  }

  loadBuiltIn() {
    // 1. Load Complete Constitution of India
    if (fs.existsSync(INDIAN_CONST_JSON)) {
      try {
        const raw = fs.readFileSync(INDIAN_CONST_JSON, "utf-8");
        const data = JSON.parse(raw);
        this.constitutions.set(data.id, {
          id: data.id,
          name: data.name,
          description: data.description,
          visibility: "public",
          isBuiltIn: true,
          articlesCount: data.articles.length,
          articles: data.articles,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn(`[Constitution Store] Warning: could not read built-in constitution: ${err.message}`);
      }
    }

    // 2. Load Landmark Supreme Court Precedents
    if (fs.existsSync(LANDMARK_CASES_JSON)) {
      try {
        const rawCases = fs.readFileSync(LANDMARK_CASES_JSON, "utf-8");
        const caseData = JSON.parse(rawCases);
        this.constitutions.set(caseData.id, {
          id: caseData.id,
          name: caseData.name,
          description: caseData.description,
          visibility: "public",
          isBuiltIn: true,
          articlesCount: caseData.articles.length,
          articles: caseData.articles,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn(`[Constitution Store] Warning: could not read landmark cases: ${err.message}`);
      }
    }

    // Default Seed Custom Template: Campus Disciplinary Code
    this.constitutions.set("campus_rules", {
      id: "campus_rules",
      name: "University Student Conduct Code",
      description: "Hostel residency, digital speech, academic integrity, and campus assembly bylaws.",
      visibility: "public",
      isBuiltIn: false,
      articlesCount: 4,
      articles: [
        {
          number: "Section 1",
          title: "Academic Integrity & Cheating",
          part: "Part A - Academic Standards",
          text: "Any student discovered using unauthorized generative AI or proxy examinees on graded coursework shall receive an immediate course failure and a one-semester suspension."
        },
        {
          number: "Section 2",
          title: "Freedom of Peaceful Student Journalism",
          part: "Part B - Student Rights",
          text: "Students possess the guaranteed right to publish critical investigative reporting on campus administration, provided the publication does not incite violence or defamation."
        },
        {
          number: "Section 3",
          title: "Quiet Hours & Hostel Civility",
          part: "Part C - Residential Life",
          text: "Hostel residents must observe quiet hours between 11:00 PM and 6:00 AM. Amplified speakers or disruptive gatherings are strictly prohibited during this period."
        },
        {
          number: "Section 4",
          title: "Procedural Right to Fair Disciplinary Hearing",
          part: "Part D - Justice & Appeals",
          text: "No student shall be expelled or suspended without 48 hours notice of the formal charges, access to evidence, and the right to present oral defense before an impartial board."
        }
      ],
      createdAt: new Date().toISOString()
    });
  }

  getAll() {
    return Array.from(this.constitutions.values()).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      visibility: c.visibility,
      isBuiltIn: c.isBuiltIn,
      articlesCount: c.articles?.length || c.articlesCount || 0,
      createdAt: c.createdAt
    }));
  }

  getById(id) {
    return this.constitutions.get(id) || null;
  }

  async create({ name, description, articles, visibility = "public" }) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24);
    const id = `custom_${slug}_${Math.random().toString(36).substring(2, 6)}`;

    const newConstitution = {
      id,
      name,
      description: description || "User-authored custom constitutional charter",
      visibility,
      isBuiltIn: false,
      articlesCount: articles.length,
      articles,
      createdAt: new Date().toISOString()
    };

    // Ingest into AI Service vector store under this private namespace
    try {
      const response = await fetch(`${AI_SERVICE_URL}/constitution/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name,
          description: newConstitution.description,
          articles
        })
      });

      if (!response.ok) {
        console.warn(`[Constitution Store] AI service ingestion warning: status ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Constitution Store] Could not reach AI service for ingestion: ${err.message}`);
    }

    this.constitutions.set(id, newConstitution);
    return newConstitution;
  }

  delete(id) {
    const constItem = this.constitutions.get(id);
    if (!constItem) return false;
    if (constItem.isBuiltIn) return false; // Prevent deleting built-in Indian Constitution

    this.constitutions.delete(id);
    return true;
  }
}

export const constitutionStore = new ConstitutionStore();
