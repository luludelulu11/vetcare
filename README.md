# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# 🐾 VetCare (Veterinary Management System)

VetCare is a full-stack web application designed to simplify the management of veterinary clinics by centralizing client, pet, consultation, and clinical history information into a modern and intuitive platform.

The project follows a **client-server architecture**, separating the React frontend from the Express.js backend while using **Azure MySQL** as the database.

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
- JWT Authentication
- bcrypt
- multer
- mysql2
- Nodemailer

## Database

- Azure Database for MySQL
- MySQL 8

## Deployment

- Netlify (Frontend)
- Azure App Service (Backend)
- Azure MySQL Flexible Server

---

# 📂 Project Structure

```text
VetCare
│
├── backend
│   ├── controllers
│   ├── middleware
│   ├── routes
│   ├── services
│   ├── db.js
│   └── server.js
│
├── src
│   ├── assets
│   ├── components
│   ├── mock
│   ├── pages
│   ├── utils
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── README.md
```

---

# ✨ Features

## 🔐 Authentication

- Secure JWT Authentication
- Password encryption using bcrypt
- Demo Mode without backend
- Protected routes

---

## 📊 Dashboard

Provides a complete overview of the veterinary clinic including:

- Registered Clients
- Registered Pets
- Clinical Consultations
- Pending Alerts
- Quick Navigation Cards

---

## 👤 Client Management

- Register new clients
- Edit client information
- Activate / Deactivate clients
- Search clients
- View pets associated with each owner

---

## 🐶 Pet Management

- Register pets
- Edit information
- Activate / Deactivate pets
- Owner association
- Weight
- Breed
- Age
- Sex
- Clinical observations

---

## 🩺 Clinical Consultations

Create complete veterinary consultations including:

- Visit Reason
- Diagnosis
- Observations
- Severity
- Follow-up Date
- Follow-up Reason

Additionally supports:

- Vaccinations
- Medications
- Laboratory Analysis
- Consultation Types

---

## 📖 Clinical History

Displays:

- Complete medical history
- Patient information
- Owner information
- Previous consultations
- Last visit
- Number of consultations

Each consultation can be opened individually.

---

## 🚨 Alerts

Automatically manages alerts for:

- Upcoming appointments
- Vaccination reminders
- Follow-up consultations

---

# 🧪 Demo Mode

VetCare includes a complete demonstration mode that allows the application to be showcased without requiring a backend server or database connection.

Enable Demo Mode by setting:

```env
VITE_DEMO=true
```

When enabled:

- No HTTP requests are executed.
- All pages consume mock data.
- Authentication is simulated.
- Navigation behaves exactly like the production application.

Mock data is located in:

```text
src/mock/demoData.js
```

---

# 🗄 Database Model

```text
Clients
    │
    ├── Pets
            │
            ├── Consultations
                    │
                    ├── Vaccinations
                    ├── Medications
                    ├── Laboratory Analysis
                    └── Alerts
```

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
React stores Token
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
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

EMAIL_USER=
EMAIL_PASS=
```

---

# 🚀 Running the Project

## Install dependencies

```bash
npm install
```

## Start frontend

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Start backend

```bash
npm start
```

---

# ☁ Deployment


---

# 🔒 Security

- JWT Authentication
- Password hashing (bcrypt)
- Environment variables
- CORS Protection
- Secure TLS connection to Azure MySQL
- Input validation
- Express middleware protection

---

# 📈 Future Improvements



---

# 👨‍💻 Author

**Lucero Fernández **


