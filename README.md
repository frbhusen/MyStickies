# My Stickies Platform

Production-oriented starter for a custom e-commerce platform built for My Stickies.

## Stack

- Backend: Django + Django REST Framework
- Database: SQLite (file-based, no server required)
- Frontend: React (Vite)
- Deployment: Ubuntu + Gunicorn + Nginx

## Repository Layout

- `backend/` Django project, API apps, and deployment settings
- `frontend/` React storefront and custom admin dashboard

## Core Product Rules

- Guest checkout only
- Cart stored in browser `localStorage`
- Nested categories with unlimited depth
- Product variations can have different prices
- No inventory or stock-out logic
- Google Drive image support for manual links and synced folders

## Run Locally

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### 3. Open the app

- Storefront: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/`
- Admin dashboard: `http://localhost:5173/admin/login`

## Required Environment Variables

Backend `.env` (local or production, both use SQLite):

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_DB_ENGINE=django.db.backends.sqlite3
DJANGO_DB_NAME=db.sqlite3
MY_STICKIES_SHIPPING_FEE=100
```

For production on Ubuntu:

```env
DJANGO_SECRET_KEY=your-long-random-secret-key
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=mystickies.tech,www.mystickies.tech
DJANGO_DB_ENGINE=django.db.backends.sqlite3
DJANGO_DB_NAME=db.sqlite3
CORS_ALLOWED_ORIGINS=https://mystickies.tech,https://www.mystickies.tech
MY_STICKIES_SHIPPING_FEE=100
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

In production, the frontend defaults to same-origin `/api`, so a build-time API URL is optional unless you want to point the app at a different backend host.

## Deployment (Ubuntu)

These are the tested steps to deploy the project on an Ubuntu server using PostgreSQL, Gunicorn and Nginx. Adjust hostnames, paths and secrets for your environment.

- **Server packages** (no database server needed with SQLite)

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip build-essential nginx nodejs npm
```

- **Place the app on the server**

```bash
sudo mkdir -p /var/www/my-stickies
sudo chown -R $USER:$USER /var/www/my-stickies
git clone <your-repo-url> /var/www/my-stickies
```

- **Backend (Django) setup**

```bash
cd /var/www/my-stickies/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit backend/.env with production values (DJANGO_SECRET_KEY, DB creds, ALLOWED_HOSTS, etc.)
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

```bash
cd /var/www/my-stickies/frontend
npm install
npm run build
# built files will be in frontend/dist
```

- **Gunicorn systemd unit**

Copy the provided unit file at `deploy/systemd/gunicorn.service` to `/etc/systemd/system/gunicorn.service` and then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
sudo systemctl status gunicorn
```

- **Nginx**

Copy the Nginx server block from `deploy/nginx/mystickies.conf` to `/etc/nginx/sites-available/mystickies`, update `server_name`, then enable it and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/mystickies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- **HTTPS (Certbot)**

After DNS points to the server, install Certbot and obtain certificates:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Notes:
- The project already uses WhiteNoise for static files and the `collectstatic` step places assets in `backend/staticfiles`.
- The Nginx template in `deploy/nginx/mystickies.conf` is configured to proxy `/api/` to Gunicorn and serve the frontend `dist` directory; update `server_name` and file paths to match your server.

## Updating The Server After GitHub Push

See [deploy/manual-update-guide.md](deploy/manual-update-guide.md) for the manual pull-and-refresh steps.

