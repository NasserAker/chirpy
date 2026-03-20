# 🐦 Chirpy

A fully-featured RESTful API server built with **Node.js**, **TypeScript**, **Express**, and **PostgreSQL** (via Drizzle ORM). Chirpy is a Twitter-like microblogging backend with authentication, JWT-based authorization, refresh tokens, and a membership program called **Chirpy Red**.

---

## 📦 Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + Argon2 password hashing
- **Testing**: Vitest

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL running locally
- `openssl` (for generating secrets)

### Installation

```bash
git clone https://github.com/your-username/chirpy.git
cd chirpy
npm install
```

### Environment Variables

Create a `.env` file in the root of the project:

```env
DB_URL=postgres://username:password@localhost:5432/chirpy
JWT_SECRET=your_generated_jwt_secret
POLKA_KEY=your_polka_api_key
```

To generate a secure `JWT_SECRET`:

```bash
openssl rand -base64 64
```

### Database Setup

Run migrations to set up the database schema:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Running the Server

```bash
npm run dev
```

The server will start at `http://localhost:8080`.

---

## 🗂️ Project Structure

```
src/
├── app/                    # Static file serving
├── db/
│   ├── auth.ts             # JWT, password hashing, token extraction
│   ├── index.ts            # Drizzle DB instance
│   ├── queries.ts          # All database queries
│   ├── schema.ts           # Drizzle schema definitions
│   └── MigrationConfig.ts  # Migration configuration
├── handlers/
│   ├── chirpsHandler.ts    # Chirp CRUD handlers
│   ├── usersHandler.ts     # User registration, login, update
│   ├── refreshHandler.ts   # Token refresh and revocation
│   ├── polkaWebhookHandler.ts # Polka payment webhook
│   ├── hitsHandler.ts      # File server hit counter
│   ├── health.ts           # Health check
│   └── errorHandler.ts     # Global error handler
├── config.ts               # Environment config loader
├── customErrors.ts         # Custom error classes
├── middleware.ts            # Logging, hit counter middleware
└── index.ts                # Express app entry point
```

---

## 📡 API Reference

### Health

| Method | Endpoint        | Description         | Auth |
|--------|-----------------|---------------------|------|
| GET    | `/api/healthz`  | Health check        | None |

---

### Users

| Method | Endpoint      | Description              | Auth         |
|--------|---------------|--------------------------|--------------|
| POST   | `/api/users`  | Register a new user      | None         |
| PUT    | `/api/users`  | Update email & password  | Access Token |
| POST   | `/api/login`  | Login and get tokens     | None         |

#### POST `/api/users` — Register
**Request Body:**
```json
{
  "email": "lane@example.com",
  "password": "your_password"
}
```
**Response `201`:**
```json
{
  "id": "uuid",
  "email": "lane@example.com",
  "createdAt": "2021-07-01T00:00:00Z",
  "updatedAt": "2021-07-01T00:00:00Z",
  "isChirpyRed": false
}
```

#### POST `/api/login` — Login
**Request Body:**
```json
{
  "email": "lane@example.com",
  "password": "your_password"
}
```
**Response `200`:**
```json
{
  "id": "uuid",
  "email": "lane@example.com",
  "createdAt": "2021-07-01T00:00:00Z",
  "updatedAt": "2021-07-01T00:00:00Z",
  "isChirpyRed": false,
  "token": "<access_jwt>",
  "refreshToken": "<refresh_token>"
}
```

#### PUT `/api/users` — Update User
Requires `Authorization: Bearer <access_token>` header.

**Request Body:**
```json
{
  "email": "new@example.com",
  "password": "new_password"
}
```

---

### Authentication

| Method | Endpoint       | Description                        | Auth          |
|--------|----------------|------------------------------------|---------------|
| POST   | `/api/refresh` | Get a new access token             | Refresh Token |
| POST   | `/api/revoke`  | Revoke a refresh token             | Refresh Token |

- **Access tokens** expire after **1 hour**
- **Refresh tokens** expire after **60 days**
- Pass refresh tokens in the `Authorization: Bearer <refresh_token>` header

---

### Chirps

| Method | Endpoint                 | Description          | Auth         |
|--------|--------------------------|----------------------|--------------|
| POST   | `/api/chirps`            | Create a chirp       | Access Token |
| GET    | `/api/chirps`            | Get all chirps       | None         |
| GET    | `/api/chirps/:chirpId`   | Get a chirp by ID    | None         |
| DELETE | `/api/chirps/:chirpId`   | Delete a chirp       | Access Token |

#### POST `/api/chirps` — Create Chirp
Requires `Authorization: Bearer <access_token>` header.

**Request Body:**
```json
{
  "body": "Hello Chirpy!"
}
```
- Max length: **140 characters**
- Profanity filter: words `kerfuffle`, `sharbert`, `fornax` are replaced with `****`

#### GET `/api/chirps` — Get All Chirps
Supports optional query parameters:

| Param      | Values         | Default | Description                        |
|------------|----------------|---------|------------------------------------|
| `authorId` | UUID string    | —       | Filter chirps by author            |
| `sort`     | `asc` / `desc` | `asc`   | Sort by `created_at`               |

**Examples:**
```
GET /api/chirps
GET /api/chirps?sort=desc
GET /api/chirps?authorId=uuid&sort=desc
```

#### DELETE `/api/chirps/:chirpId`
Requires `Authorization: Bearer <access_token>` header. Only the author of the chirp can delete it. Returns `403` if the user is not the author.

---

### Webhooks

| Method | Endpoint                | Description                  | Auth    |
|--------|-------------------------|------------------------------|---------|
| POST   | `/api/polka/webhooks`   | Handle Polka payment events  | API Key |

Requires `Authorization: ApiKey <polka_key>` header.

**Request Body:**
```json
{
  "event": "user.upgraded",
  "data": {
    "userId": "uuid"
  }
}
```

- If `event` is `user.upgraded`, the user is upgraded to **Chirpy Red**
- Any other event returns `204` immediately
- Invalid or missing API key returns `401`

---

### Admin

| Method | Endpoint          | Description                  | Auth |
|--------|-------------------|------------------------------|------|
| GET    | `/admin/metrics`  | View file server hit count   | None |
| POST   | `/admin/reset`    | Reset hit count & users      | None |

---

## 🔐 Authentication Flow

```
1. Register → POST /api/users
2. Login    → POST /api/login  → receive access token + refresh token
3. Use access token (1hr) in Authorization: Bearer header for protected routes
4. When access token expires → POST /api/refresh with refresh token
5. To logout → POST /api/revoke with refresh token
```

---

## ❌ Error Responses

All errors follow this shape:
```json
{
  "error": "Human readable error message"
}
```

| Status | Meaning                          |
|--------|----------------------------------|
| 400    | Bad request / missing fields     |
| 401    | Unauthorized / invalid token     |
| 403    | Forbidden (not the resource owner) |
| 404    | Resource not found               |
| 500    | Internal server error            |

---

## 🧪 Running Tests

```bash
npm run test
```

Tests cover:
- Password hashing and verification (Argon2)
- JWT creation and validation
- Expired token rejection
- Wrong secret rejection
- Malformed token rejection

---

## 📝 Scripts

| Script          | Description                        |
|-----------------|------------------------------------|
| `npm run dev`   | Compile TypeScript and start server |
| `npm run test`  | Run Vitest test suite              |

---

## 🔒 Security Notes

- Passwords are hashed using **Argon2** before storage — never stored in plain text
- JWTs are signed with a secret stored in `.env` — never committed to Git
- Refresh tokens are stored in the database and can be revoked at any time
- The `.env` file is excluded from version control via `.gitignore`
- Polka webhook endpoint is protected by an API key
