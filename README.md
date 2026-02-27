# 🚀 Tejaskrit  
## Centralized Internship & Placement Tracking Platform

Tejaskrit is a scalable, AI-powered internship and placement management platform built to centralize opportunity discovery, resume personalization, application tracking, and institute drive coordination.

The system consists of two connected web applications:

- 🎓 **Candidate Panel** (Students)
- 🏫 **TPO Panel** (Training & Placement Officers)

Both panels are deployed separately but share the same Firebase backend.

---

## 🧩 Problem It Solves

Students face major challenges:

- Job openings are scattered across career pages, Telegram groups, and portals.
- Tailoring resumes for every job is time-consuming.
- Tracking application status across platforms is difficult.
- Staying updated about institute drives is inconsistent.

Institutes struggle with:

- Managing placement drives efficiently.
- Tracking student participation.
- Communicating updates clearly.

Tejaskrit centralizes all of this into a single intelligent system.

---

## 🏗 Architecture Overview

### 🎓 Candidate Panel

Students can:

- Register and connect to their institute
- Create a **Master Resume**
- View public and institute-verified job openings
- Generate **AI-tailored resumes (LaTeX-based)**
- Track applications through full lifecycle
- Receive real-time notifications
- Enable desktop alerts

---

### 🏫 TPO Panel

Training & Placement Officers can:

- Register and configure their institute
- Post institute-verified drives
- Monitor student applications
- View institute members
- Send announcements and updates

---

## 🧠 AI Features (Groq Integration)

Tejaskrit uses:

**Model:** `llama-3.3-70b-versatile`

AI is used for:

- Resume tailoring (Master Resume → Job-specific LaTeX)
- Real match scoring (0–100)
- Match reasoning
- Job description parsing (PDF import support)

LaTeX resumes are stored in Firestore and converted to PDF on demand.

---

## 📊 Application Tracker

Students can track:

Saved → Tailored → Applied → OA Scheduled → Interview → Offer → Joined / Rejected


### Status Control Logic

- 🏫 Institute-verified drives → Status updated only by TPO
- 🌍 Public jobs → Manual status updates allowed

