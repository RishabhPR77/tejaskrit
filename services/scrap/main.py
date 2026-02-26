from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import requests
import re
import html
import os
import firebase_admin
from firebase_admin import credentials, firestore

# --- FIREBASE SETUP ---
# Initialize Firebase using your downloaded JSON key
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI(title="Tech Jobs Scraper & Firebase API")

# --- SECURITY: API KEY SETUP ---
API_KEY = os.getenv("SCRAPER_API_KEY", "my-development-secret-key-123")
api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_KEY:
        return api_key
    raise HTTPException(status_code=403, detail="Invalid or missing API Key")

# --- SCRAPER CONFIGURATION ---
TARGET_COMPANIES = ['figma', 'discord', 'dropbox', 'duolingo']
TECH_KEYWORDS = [
    'software', 'developer', 'engineer', 'data', 'analytics', 'analyst', 
    'machine learning', 'python', 'full stack', 'frontend', 'backend', 
    'cloud', 'devops', 'security', 'it', 'artificial intelligence', 'ai', 'react'
]

# --- SCRAPER HELPER FUNCTIONS ---
def clean_html_text(raw_html):
    if not raw_html: return "Not specified"
    unescaped_html = html.unescape(raw_html)
    soup = BeautifulSoup(unescaped_html, 'html.parser')
    for class_name in ['content-intro', 'content-conclusion', 'content-pay-transparency']:
        for section in soup.find_all('div', class_=class_name):
            section.decompose() 
    return soup.get_text(separator=' ', strip=True)

def extract_tags(title, description):
    combined_text = (title + " " + description).lower()
    found_tags = [kw.title() for kw in TECH_KEYWORDS if re.search(rf'\b{re.escape(kw)}\b', combined_text)]
    return list(set(found_tags))

# --- API ENDPOINTS ---
@app.get("/")
def health_check():
    return {"status": "API is running. Access /sync-jobs with your API key to update Firebase."}

@app.get("/sync-jobs")
def sync_scraped_jobs_to_firebase(api_key: str = Depends(get_api_key)):
    """Secured endpoint that scrapes jobs and PUSHES them to Firebase FAST."""
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        upload_count = 0
        
        # --- THE FIX: Create a Firebase Batch ---
        batch = db.batch()

        for company in TARGET_COMPANIES:
            url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true"
            response = requests.get(url)
            
            if response.status_code == 200:
                for job in response.json().get('jobs', []):
                    title = job.get('title', '')
                    title_lower = title.lower()
                    
                    # Strict Tech Filter
                    if not any(re.search(rf'\b{re.escape(kw)}\b', title_lower) for kw in TECH_KEYWORDS):
                        continue 
                    
                    job_id = str(job.get('id'))
                    external_id = f"gh-{job_id}"
                    raw_html = job.get('content', '')
                    clean_description = clean_html_text(raw_html)
                    
                    job_document = {
                        "title": title,
                        "company": company.capitalize(),
                        "location": job.get('location', {}).get('name', 'Remote'),
                        "jobType": "Internship" if 'intern' in title_lower else "Full-time",
                        "applyUrl": job.get('absolute_url'),
                        "jdText": clean_description,
                        "tags": extract_tags(title, clean_description),
                        "source": "scraped",
                        "sourceMeta": {"sourceId": "scrape_sources/greenhouse", "externalId": external_id},
                        "visibility": "public",
                        "instituteId": None,
                        "ownerUid": None,
                        "status": "open",
                        "postedAt": job.get('updated_at', now_iso),
                        "lastSeenAt": now_iso,
                        "createdAt": now_iso,
                        "updatedAt": now_iso,
                        "normalized": {"companyLower": company.lower(), "titleLower": title_lower}
                    }
                    
                    # --- ADD TO BATCH INSTEAD OF SAVING DIRECTLY ---
                    doc_ref = db.collection('jobs').document(external_id)
                    batch.set(doc_ref, job_document)
                    upload_count += 1

        # --- COMMIT ALL JOBS TO FIREBASE AT ONCE ---
        if upload_count > 0:
            batch.commit()

        return {
            "status": "success",
            "message": f"Successfully scraped and pushed {upload_count} jobs to Firebase Firestore in one batch!",
            "synced_count": upload_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))