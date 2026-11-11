# Text2SQL2BI
A lightweight Text-to-SQL BI platform inspired by Chat2DB.
Convert natural language into SQL queries, execute SQL safely, and support data visualization dashboards.

## ✨ Features
- **Dual PostgreSQL connection pools & account isolation**
  - Admin account: manage system metadata, dashboards, query history
  - Read-only account: execute AI-generated SQL, only SELECT permission for security
- Async PostgreSQL powered by `psycopg3` connection pool
- Vector store supported by Qdrant for table schema embedding & retrieval
- Redis for cache and task queue
- FastAPI backend with clean layered structure
- Health check endpoint for database availability monitoring
- CORS configuration, ready for Vue3 + Vite frontend
- Lazy connection initialization: database connections created on first request
- Docker Compose one-click bootstrap for all middleware

## 🛠 Tech Stack
### Backend
- Python 3.11+
- FastAPI
- Pydantic Settings
- psycopg[binary,pool] (async PostgreSQL)
- Uvicorn

### Middleware
- PostgreSQL 16
- Redis 7
- Qdrant Vector Database

### Frontend
- Vue3 + Vite

## 📁 Project Structure
text2sql2bi/
├── .env.example
├── docker-compose.yml
├── docker/
│   └── init.sql             # Initialize read-only database user
├── backend/
│   ├── pyproject.toml
│   └── app/
│       ├── main.py          # FastAPI entry & lifespan lifecycle
│       ├── api/
│       │   ├── router.py
│       │   └── routes/
│       │       └── health.py
│       └── core/
│           ├── config.py    # Settings managed by pydantic-settings
│           └── database.py  # Dual async connection pools
└── frontend/
├── package.json
├── vite.config.ts
└── src/

```

## 🚀 Quick Start
### 1. Start middleware services (Postgres / Redis / Qdrant)
```bash
docker compose up -d
# Check status
docker compose ps
```

Wait until all services show `healthy`.

### 2. Start FastAPI Backend

```
cd backend
# Create virtual environment
python -m venv .venv
# Activate venv (Windows)
.venv\Scripts\activate
# Install dependencies in editable mode
pip install -e ".[dev]"
# Copy env template
copy .env.example .env
# Start server (fix Windows psycopg async event loop issue)
uvicorn app.main:app --loop asyncio.SelectorEventLoop --reload
```

- Backend: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 3. Start Frontend

```
cd frontend
npm install
npm run dev
```

Frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173)

> 
> Startup order: Docker services → Backend → Frontend

## ⚙️ Core Design

1. **Permission Isolation**
   - `bi`: Admin user, for system table CRUD
   - `bi_reader`: Read-only user, used for all AI-generated SQL execution
2. **Dual Async Connection Pool**
   - Meta pool: system metadata operation
   - Query pool: safe SQL execution
3. **Configuration Management**
   - `pydantic-settings` + `lru_cache` for singleton settings, auto load `.env`
4. **Lifespan Hook**
   - Release database connections gracefully on application shutdown
5. **Health Check**
   - Separate endpoint to detect database connectivity

## 📌 Known Issue (Windows)

> 
> Psycopg cannot use the 'ProactorEventLoop' for async mode.
> Solution: launch uvicorn with selector event loop

```
uvicorn app.main:app --loop asyncio.SelectorEventLoop
```

## 📜 License

MIT
