FROM python:3.12-slim

# System dependencies: psycopg2 build deps + Tesseract OCR (Thai+English) + poppler for PDF->image
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    tesseract-ocr tesseract-ocr-tha tesseract-ocr-eng poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Wait for Postgres, migrate, then run the dev server.
# For a real production deploy swap this for gunicorn (see README "Phase 11").
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
