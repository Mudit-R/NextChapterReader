import os
import mimetypes
import httpx

SUPABASE_URL = "https://xrufzgezmqjfwjehqgal.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydWZ6Z2V6bXFqZndqZWhxZ2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTUwMTQsImV4cCI6MjEwMzE3MTAxNH0.PdOWUw4CJg621zbs395Npk-2aZ9lwThLEIP4Q_4oqI8"
BUCKET = "Book-storage"
PDF_DIR = os.path.join(os.path.dirname(__file__), "frontend", "public", "pdfs")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def upload_all():
    print(f"Scanning {PDF_DIR} for PDFs...")
    pdf_files = [f for f in os.listdir(PDF_DIR) if f.endswith(".pdf")]
    print(f"Found {len(pdf_files)} PDF files.")

    client = httpx.Client(timeout=60.0)
    uploaded = {}

    for fname in pdf_files:
        fpath = os.path.join(PDF_DIR, fname)
        size_mb = os.path.getsize(fpath) / (1024 * 1024)
        print(f"Uploading {fname} ({size_mb:.2f} MB)...")
        
        with open(fpath, "rb") as f:
            file_data = f.read()

        upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{fname}"
        content_type = mimetypes.guess_type(fname)[0] or "application/pdf"
        
        upload_headers = {
            **headers,
            "Content-Type": content_type,
            "x-upsert": "true"
        }

        r = client.post(upload_url, headers=upload_headers, content=file_data)
        if r.status_code in (200, 201):
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{fname}"
            uploaded[fname] = public_url
            print(f"Successfully uploaded {fname} -> {public_url}")
        else:
            print(f"Failed to upload {fname}: {r.status_code} {r.text}")

    return uploaded

if __name__ == "__main__":
    upload_all()
