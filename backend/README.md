# Simple SIMRS Backend

This document details the backend architecture, directory layout, environment configuration, and execution workflows for Simple SIMRS. You can run the service within Docker containers, connect to PostgreSQL 17, execute Codeception test suites, and audit static types with PHPStan.

## System Architecture

Simple SIMRS backend operates as a web and API application service built on the Yii 2 framework:

- **Framework Core**: Yii 2.0.54 running on PHP 8.4
- **Database Engine**: PostgreSQL 17 via PDO PostgreSQL driver (`pdo_pgsql`)
- **Web Server**: Apache HTTP Server with mod_rewrite enabled and `/var/www/html/web` document root
- **Mail Delivery**: Symfony Mailer integration (`yiisoft/yii2-symfonymailer`)
- **Testing and Quality**: Codeception 5, PHPStan static analyzer, and PHP_CodeSniffer

## Directory Structure

The backend organizes application files into standard Yii 2 basic structure:

```text
backend/
├── commands/           # Console commands and CLI controllers (HelloController)
├── config/             # Application configuration files
│   ├── console.php     # Console application configuration
│   ├── db.php          # PostgreSQL connection definition
│   ├── params.php      # Global configuration parameters
│   ├── test_db.php     # Test database connection configuration
│   ├── test.php        # Test application configuration
│   └── web.php         # Web application components, routes, and modules
├── controllers/        # Web and API controllers (SiteController)
├── mail/               # Email view templates and layout files
├── models/             # Domain models and forms (User, LoginForm, ContactForm)
├── runtime/            # Runtime-generated caches, logs, and debug profiles
├── tests/              # Codeception test suites
│   ├── Acceptance/     # End-to-end acceptance tests (PhpBrowser and WebDriver)
│   ├── Functional/     # Functional application tests
│   ├── Support/        # Helper traits and test actors
│   └── Unit/           # Unit tests
├── views/              # Server-rendered layouts and error view templates
├── web/                # Public entry point and public web assets
│   ├── assets/         # Published asset bundles
│   ├── index.php       # Production entry script
│   └── index-test.php  # Test entry script
├── Dockerfile          # PHP 8.4 Apache container definition
├── codeception.yml     # Codeception test framework configuration
├── composer.json       # PHP dependencies and composer scripts
├── phpcs.xml.dist      # PHP_CodeSniffer code style rules
├── phpstan.neon        # PHPStan static analysis configuration
└── yii                 # Yii CLI executable script
```

## Environment Configuration

The backend reads runtime parameters from environment variables defined in the root `.env` file:

| Variable | Description | Default Value |
|---|---|---|
| `APP_ENV` | Application environment mode | `development` |
| `COOKIE_VALIDATION_KEY` | Secret key for HTTP request cookie validation | Set a unique random 32-byte string |
| `DB_HOST` | PostgreSQL host address | `postgres` |
| `DB_PORT` | PostgreSQL port number | `5432` |
| `DB_NAME` | PostgreSQL database name | `simrs_db` |
| `DB_USER` | PostgreSQL database username | `postgres` |
| `DB_PASSWORD` | PostgreSQL database user password | Empty or password string |

Configure these values in the root `.env` file before booting the service.

## Running with Docker

Run the backend container using the root `docker-compose.yml` file:

1. **Start the backend and database containers**:
   ```bash
   docker compose up -d backend
   ```

2. **Check container status**:
   ```bash
   docker compose ps backend
   ```

3. **View live container logs**:
   ```bash
   docker compose logs -f backend
   ```

The container exposes port `8080` mapped to internal Apache port `80`. Open `http://localhost:8080` to verify that the service responds.

## Running Locally Without Docker

Run the application locally when you have PHP 8.4, Composer, and PostgreSQL installed on your host machine:

1. **Install PHP dependencies**:
   ```bash
   composer install
   ```

2. **Generate cookie validation key**:
   ```bash
   composer run-script post-install-cmd
   ```

3. **Verify directory permissions**:
   Ensure that the `runtime/` and `web/assets/` directories are writable by your web server process:
   ```bash
   chmod 777 runtime web/assets
   ```

4. **Start the built-in development server**:
   ```bash
   php yii serve --port=8080
   ```

## Testing and Quality Verification

The backend repository includes automated tests and static code quality tools.

### Running Codeception Tests

Execute automated test suites using the following commands:

- **Run all unit and functional tests**:
  ```bash
  composer tests
  ```

- **Run unit tests only**:
  ```bash
  vendor/bin/codecept run Unit
  ```

- **Run functional tests only**:
  ```bash
  vendor/bin/codecept run Functional
  ```

- **Run acceptance tests with built-in server**:
  ```bash
  vendor/bin/codecept run Acceptance --env php-builtin
  ```

### Static Analysis and Code Standards

Audit code quality and style compliance using the bundled scripts:

- **Run PHPStan static analysis**:
  ```bash
  composer static
  ```

- **Check PHP_CodeSniffer styling standards**:
  ```bash
  composer cs
  ```

- **Fix PHP_CodeSniffer styling violations automatically**:
  ```bash
  composer cs-fix
  ```
