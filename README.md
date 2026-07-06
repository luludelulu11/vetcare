# 🐾 VetCare

VetCare is a full-stack web application designed to simplify the management of veterinary clinics by centralizing client, pet, consultation, and clinical history information into a modern and intuitive platform.

The application follows a **client-server architecture**, separating the React frontend from the Express.js backend while using **PostgreSQL** managed through **Prisma ORM**.

---

# 🚀 Tech Stack

## Frontend

- React 19
- Vite
- React Router DOM
- CSS Modules
- SweetAlert2
- Lucide React
- React DatePicker

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt
- multer
- Nodemailer

---

# 🗄 Database

- PostgreSQL
- Prisma ORM
- Neon PostgreSQL (Production)
- Docker PostgreSQL (Local Development)

---

# ☁ Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Netlify |
| Backend | Node.js |
| Database | Neon PostgreSQL |

---

# 📂 Project Structure

```text
VetCare
│
├── backend
│   ├── prisma
│   │   ├── migrations
│   │   └── schema.prisma
│   ├── routes
│   ├── uploads
│   ├── prisma.config.ts
│   ├── server.js
│   └── .env
│
├── src
│   ├── assets
│   ├── components
│   ├── pages
│   ├── utils
│   ├── mock
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── README.md
```

---

# ✨ Features

## Authentication

- JWT Authentication
- Password hashing with bcrypt
- Protected routes
- Demo Mode

---

## Dashboard

- Registered clients
- Registered pets
- Clinical consultations
- Pending alerts
- Quick access cards

---

## Client Management

- Register clients
- Edit client information
- Activate / deactivate clients
- Search clients
- View pets by owner

---

## Pet Management

- Register pets
- Edit information
- Activate / deactivate pets
- Owner association
- Breed
- Weight
- Age
- Sex
- Clinical observations

---

## Clinical Consultations

- Visit reason
- Diagnosis
- Observations
- Severity
- Follow-up
- Vaccinations
- Medications
- Laboratory analysis
- Consultation types

---

## Clinical History

- Complete medical history
- Previous consultations
- Owner information
- Patient information
- Consultation history

---

## Alerts

- Appointment reminders
- Vaccination reminders
- Follow-up reminders

---

# 🧪 Demo Mode

Enable demo mode with:

```env
VITE_DEMO=true
```

When enabled:

- No backend requests are executed.
- Authentication is simulated.
- Mock data is used.
- Navigation behaves like production.

---

# 🔑 Authentication Flow

```text
User Login
      │
      ▼
Express API
      │
      ▼
Credential Validation
      │
      ▼
JWT Generation
      │
      ▼
React stores token
      │
      ▼
Authenticated Requests
```

---

# ⚙ Environment Variables

## Frontend

```env
VITE_API_URL=http://localhost:5000
VITE_DEMO=false
```

## Backend

```env
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/vetcare?sslmode=require"

JWT_SECRET="your_jwt_secret"

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER="your_email@gmail.com"
MAIL_PASS="your_app_password"
MAIL_FROM="VetCare <your_email@gmail.com>"
```

---

# 🐳 Docker Setup

Run PostgreSQL locally:

```bash
docker run --name vetcare-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345 \
  -e POSTGRES_DB=vetcare \
  -p 5432:5432 \
  -d postgres:16
```

---

# 🛠 Prisma Setup

Generate Prisma Client:

```bash
cd backend
npx prisma generate
```

Development migrations:

```bash
cd backend
npx prisma migrate dev
```

Production migrations:

```bash
cd backend
npx prisma migrate deploy
```

---

# ☁ Production Database

The production environment uses **Neon PostgreSQL**.

Configure the connection through:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/vetcare?sslmode=require"
```

No source code changes are required to switch between local and production environments.

---

# 🚀 Running the Project

Install dependencies:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

Start backend:

```bash
npm start
```

Create production build:

```bash
npm run build
```

---

# 🔒 Security

- JWT Authentication
- Password hashing
- Environment variables
- CORS protection
- Secure PostgreSQL connection
- Prisma ORM
- Input validation

---

# 📈 Future Improvements

- AI-assisted diagnosis
- SMS notifications
- Cloud file storage
- Virtual vaccination card
- Digital pet ID
- Appointment prioritization
- Password recovery
- Grooming module

---

# 👨‍💻 Author

**Lucero Fernández**