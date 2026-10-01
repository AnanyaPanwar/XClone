# XClone — Full-Stack Social Media Platform

XClone is a full-stack social media web application inspired by X (formerly Twitter), built with **React + Vite** on the frontend and **Django REST Framework** on the backend.

The project includes authentication, user profiles, tweets, image uploads, likes, comments, user search, OTP-based authentication flows, password reset, dark/light mode, and production deployment.

---

## 🚀 Live Demo

https://xclone-qeio.onrender.com


---

## ✨ Features

### 🔐 Authentication

* User registration
* Username and password login
* JWT authentication
* Access and refresh tokens
* Login OTP functionality
* Forgot password functionality
* Password reset using OTP
* Password validation
* Secure authentication flow

### 📝 Tweets

* Create tweets
* Edit own tweets
* Delete own tweets
* Maximum tweet length of 300 characters
* Image/photo uploads
* Tweet timestamps
* Search tweets by text
* Search tweets by username

### ❤️ Likes

* Like tweets
* Unlike tweets
* Real-time like count
* User-specific `liked_by_me` state
* Prevents duplicate likes

### 💬 Comments

* Add comments to tweets
* Edit own comments
* Delete own comments
* Comment timestamps
* Nested comment API structure

### 👤 Profiles

* User profiles
* Profile avatar
* Bio
* Public user profiles
* Current user's profile editing
* User profile search
* Profile navigation

### 🎨 UI

* Dark mode
* Light mode
* Responsive social-media style layout
* Login/Register flows
* Forgot password flow
* Profile navigation
* Browser back/forward support for Home and Profile navigation

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Axios
* JavaScript
* CSS

### Backend

* Python
* Django
* Django REST Framework
* Simple JWT
* SQLite
* Django CORS Headers

### Authentication

* JWT
* Django authentication
* OTP-based login
* OTP-based password reset

### Deployment

* Render
* Gunicorn
* Vite production build

---

## 📁 Project Structure

```text
XClone/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── XClone/
│   ├── manage.py
│   │
│   ├── XClone/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── ...
│   │
│   ├── tweet/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── tests.py
│   │   └── ...
│   │
│   ├── templates/
│   ├── static/
│   ├── media/
│   ├── requirements.txt
│   ├── build.sh
│   ├── manage.py
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

# 🔧 Backend Setup

## 1. Clone the repository

```bash
git clone https://github.com/AnanyaPanwar/XClone.git
cd XClone
```

---

## 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

---

## 3. Install backend dependencies

```bash
cd XClone
pip install -r requirements.txt
```

---

## 4. Configure environment variables

Create a `.env` file inside the Django project directory:

```text
XClone/.env
```

Example:

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True

DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

> Never commit `.env` or any secret/API key to GitHub.

---

## 5. Run migrations

```bash
python manage.py migrate
```

---

## 6. Run the Django development server

```bash
python manage.py runserver
```

Backend will be available at:

```text
http://127.0.0.1:8000
```

---

# 💻 Frontend Setup

Open a new terminal and go to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_URL=http://127.0.0.1:8000/api/
```

Start the frontend:

```bash
npm run dev
```

Frontend will normally run at:

```text
http://localhost:5173
```

---

# 🔑 API Endpoints

## Authentication

### Register

```http
POST /api/auth/register/
```

### Login

```http
POST /api/auth/login/
```

### Refresh JWT

```http
POST /api/token/refresh/
```

---

## OTP

### Request Login OTP

```http
POST /api/otp/request/
```

### Verify Login OTP

```http
POST /api/otp/verify/
```

---

## Password Reset

### Request Password Reset

```http
POST /api/password/forgot/
```

### Reset Password

```http
POST /api/password/reset/
```

---

## Tweets

### Get Tweets

```http
GET /api/tweets/
```

### Create Tweet

```http
POST /api/tweets/
```

### Update Tweet

```http
PATCH /api/tweets/<id>/
```

### Delete Tweet

```http
DELETE /api/tweets/<id>/
```

### Search Tweets

```http
GET /api/tweets/?q=<search>
```

### Like / Unlike Tweet

```http
POST /api/tweets/<id>/like/
```

---

## Comments

### Get Comments

```http
GET /api/tweets/<tweet_id>/comments/
```

### Create Comment

```http
POST /api/tweets/<tweet_id>/comments/
```

### Update Comment

```http
PATCH /api/tweets/<tweet_id>/comments/<comment_id>/
```

### Delete Comment

```http
DELETE /api/tweets/<tweet_id>/comments/<comment_id>/
```

---

## Profiles

### Get Current User Profile

```http
GET /api/profile/me/
```

### Update Current User Profile

```http
PATCH /api/profile/me/
```

### Get Public User Profile

```http
GET /api/users/<username>/
```

### Search Users

```http
GET /api/users/search/?q=<username>
```

---

# 🗄️ Database Models

The backend contains the following main models:

### User

Uses Django's built-in authentication user model.

### Profile

Stores:

* Avatar
* Bio
* User information

A profile is automatically created for users using a Django signal.

### Tweet

Stores:

* User
* Tweet text
* Optional photo
* Created timestamp
* Updated timestamp

### Like

Stores:

* User
* Tweet

A unique constraint prevents the same user from liking the same tweet multiple times.

### Comment

Stores:

* User
* Tweet
* Comment text
* Created timestamp

### OTP

Stores:

* User
* OTP code
* Purpose
* Creation timestamp
* Used status

OTP codes expire after 10 minutes.

---

# 🔒 Security

The project includes:

* JWT authentication
* Protected API endpoints
* Ownership checks for tweets
* Ownership checks for comments
* Password validation
* Environment-based secrets
* CORS configuration
* Generic responses for OTP/password-reset requests
* `.env` excluded from Git

Users can only edit or delete their own tweets and comments.

---

# 🧪 Testing

Backend tests are included using Django's testing framework.

Run:

```bash
python manage.py test tweet
```

The project currently includes tests covering authentication, tweets, comments, likes, profiles, search, OTP, and password reset functionality.

---

# 🌐 Deployment

The project is deployed using **Render**.

### Backend

```text
Django + Gunicorn
```

Start command:

```bash
python -m gunicorn XClone.wsgi:application --workers 1 --threads 2 --timeout 120
```

Build script:

```bash
./build.sh
```

The build script installs dependencies, collects static files, and runs migrations.

### Frontend

```text
React + Vite
```

Build command:

```bash
npm install && npm run build
```

---

# 📧 Email / OTP Note

The application uses Gmail SMTP for email functionality during local development.

```text
smtp.gmail.com
Port: 587
TLS: Enabled
```

The Gmail SMTP setup works locally.

The production backend is deployed on Render's Free Web Service. Render Free blocks outbound SMTP traffic on ports `25`, `465`, and `587`, so Gmail SMTP-based OTP/password-reset email is not available from the deployed Free service.

This does **not** affect the rest of the application.

---

# 🖼️ Media Files

User profile avatars and tweet images are handled through Django media files.

Local media files are stored in:

```text
media/
```

The deployed application serves media through Django.

> Render's default filesystem is ephemeral, so uploaded media should not be considered permanent storage in the current deployment.

---

# 🎯 Project Purpose

XClone was built as a full-stack portfolio project to demonstrate practical experience with:

* React frontend development
* REST API development
* Django backend development
* JWT authentication
* Database modeling
* CRUD operations
* File uploads
* Search functionality
* API integration
* Authentication flows
* OTP systems
* Password reset
* Testing
* Deployment
* Environment configuration
* Git and GitHub workflow

---

# 👩‍💻 Author

**Ananya Panwar**

GitHub:

https://github.com/AnanyaPanwar/XClone
