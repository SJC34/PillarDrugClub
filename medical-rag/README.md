# Medical RAG Service

FDA-compliant medical blog generation using Retrieval-Augmented Generation (RAG).

## Features

- **FDA Source Ingestion**: Ingest and chunk FDA labels from DailyMed and other whitelisted US sources
- **Vector Search**: FAISS-based semantic search over medical documents
- **RAG Generation**: Generate patient-friendly medical content grounded in FDA labels
- **Compliance Guardrails**: Automatic checks for off-label claims, citation density, safety sections
- **Schema.org Markup**: Generate MedicalWebPage and FAQPage structured data

## Setup

1. **Install Dependencies**
```bash
cd medical-rag
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. **Run Service**
```bash
python -m app.main
# Service will start on http://localhost:8001
```

## API Documentation

Once running, visit:
- API Docs: http://localhost:8001/docs
- Health Check: http://localhost:8001/health

## API Endpoints

### Ingestion

**POST /api/ingest/url**
```json
{
  "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=..."
}
```

### Retrieval

**POST /api/retrieve**
```json
{
  "query": "metformin side effects",
  "k": 10,
  "min_chunks": 3,
  "max_age_years": 5
}
```

### Generation

**POST /api/generate**
```json
{
  "topic": "Metformin for Type 2 Diabetes: Benefits and Safety",
  "min_citations": 5
}
```

**GET /api/generate/jobs/{job_id}**

Check generation status and retrieve results.

## Compliance Requirements

All generated content must pass:
- ✅ Minimum 5 citations from whitelisted sources
- ✅ Citation density ≥1 per 150 words
- ✅ Safety sections present (Warnings, Adverse Reactions, Interactions)
- ✅ US sources only
- ✅ Required disclaimer present
- ✅ No off-label claims

## Whitelisted Domains

- dailymed.nlm.nih.gov (FDA Labels)
- fda.gov
- cdc.gov
- nih.gov
- uspreventiveservicestaskforce.org
- ahrq.gov
- idsociety.org
- acog.org
- diabetes.org

## Integration with Main App

The service runs on port 8001 and can be called from the main TypeScript/Node.js application:

```typescript
// Call Python RAG service for medical content
const response = await fetch('http://localhost:8001/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Understanding Metformin',
    min_citations: 5
  })
});
```

## Directory Structure

```
medical-rag/
├── app/
│   ├── api/          # API endpoints
│   ├── services/     # Core services (chunking, vectors, compliance)
│   ├── models.py     # Pydantic/SQLModel models
│   ├── settings.py   # Configuration
│   └── main.py       # FastAPI app
├── data/             # Local storage
│   ├── medical_blog.db
│   └── vectors/
├── tests/            # Test suite
├── requirements.txt
└── .env
```

## Testing

```bash
pytest tests/
```

## License

MIT
