# Simple SIMRS

This document provides the project overview, system architecture, setup commands, and service references for Simple SIMRS. You can launch the full multi-tier environment using Docker Compose, access the React frontend and Yii 2 backend services, and navigate dedicated subproject guides.

## Project Overview

Simple SIMRS is an open-source Hospital Information Management System (Sistem Informasi Manajemen Rumah Sakit, or SIMRS) designed for clinical healthcare facilities.

The repository uses a dual-service architecture separated into an independent web client and an application backend:

- **Frontend Client**: Built with React 19, Vite 8, and TypeScript 6, using the Astryx Design System v0.7.17 from Meta for accessible light-mode healthcare interfaces.
- **Backend Service**: Built with the Yii 2 framework running on PHP 8.4 and Apache, providing business domain logic and database connectivity.
- **Relational Database**: Powered by PostgreSQL 17 with automatic container health monitoring and persistent data volumes.
- **Container Orchestration**: Managed via Docker Compose on an isolated bridge network (`app-network`).

## Repository Layout

The repository organizes source code, documentation, and container definitions into distinct directories:

```text
.
├── backend/            # Yii 2 backend service (PHP 8.4, Apache, PostgreSQL)
├── docker/             # Supplemental container configuration files
├── docs/               # Project documentation and architectural records
├── frontend/           # React 19 web application (Vite 8, Astryx Design System)
├── .env.example        # Environment variable template
├── docker-compose.yml  # Multi-container orchestration definition
└── README.md           # Root repository overview and setup guide
```

## System Requirements

Prepare your local machine with the following tools before running the project:

- **Containerized Execution (Recommended)**: Docker Engine version 24.0 or newer and Docker Compose v2.
- **Direct Host Execution (Optional)**: Node.js 22 or newer, PHP 8.4 with PostgreSQL extensions (`pdo_pgsql`), Composer 2, and PostgreSQL 17.

## Getting Started with Docker Compose

Launch the complete application stack with the following steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/simple-simrs.git
   cd simple-simrs
   ```

2. **Create your environment configuration**:
   Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment secrets**:
   Open `.env` and set values for database credentials and cookie validation:
   ```env
   APP_ENV=development
   COOKIE_VALIDATION_KEY=your_generated_32_byte_secret_key
   POSTGRES_DB=simrs_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   DB_HOST=postgres
   DB_PORT=5432
   DB_NAME=simrs_db
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   ```

4. **Start all service containers**:
   ```bash
   docker compose up -d
   ```

5. **Verify container health**:
   ```bash
   docker compose ps
   ```

## Application Service Endpoints

Once containers finish initializing, access the active endpoints below:

| Service | Target URL | Description |
|---|---|---|
| **Frontend Client** | `http://localhost:5173` | React 19 single-page application |
| **Backend Service** | `http://localhost:8080` | Yii 2 web and API server |
| **PostgreSQL Database** | `localhost:5432` | Relational database instance |

## Demo Credentials

Test the frontend authentication and patient workflows using these default credentials:

- **Username**: `admin`
- **Password**: `admin123`
- **Assigned Persona**: Dr. Hendra Pratama, Sp.PD (Specialist in Internal Medicine)

## Project Documentation Index

Explore detailed documentation for each layer of the application:

- [Frontend Documentation](frontend/README.md): Architecture, feature modules, and component patterns
- [Frontend Agent Guide](frontend/AGENTS.md): Design system rules and Astryx component conventions for developers and AI agents
- [Design System Specification](frontend/DESIGN.md): Visual tokens, WCAG contrast standards, color palette, and layout guidelines
- [Backend Documentation](backend/README.md): Yii 2 configuration, database connection, testing suites, and CLI tools

## License

This project is licensed under open-source terms. See the individual subproject directories for third-party component licenses.
