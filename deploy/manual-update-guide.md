# My Stickies Manual Update Guide

Use this guide when you push changes to GitHub and want to update the Ubuntu server manually.

## 1. Push your local changes

From your development machine:

```bash
git add .
git commit -m "Describe your change"
git push origin main
```

## 2. Connect to the server

Open SSH to the Ubuntu server:

```bash
ssh root@YOUR_SERVER_IP
```

## 3. Pull the latest code

Go to the project folder and fetch the newest commit from GitHub:

```bash
cd /var/www/my-stickies
git fetch origin main
git reset --hard origin/main
```

If your server uses a different branch, replace `main` with that branch name.

## 4. Update the backend

Activate the virtual environment and install any new Python packages:

```bash
cd /var/www/my-stickies/backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

If the update changed admin users, models, or permissions, check the database or create a new superuser if needed:

```bash
python manage.py createsuperuser
```

## 5. Update the frontend

The frontend bundle is static. If you need to change the API target on the server, edit `/var/www/my-stickies/frontend/dist/runtime-config.js` instead of rebuilding:

```js
window.__MY_STICKIES_RUNTIME__ = {
	API_BASE_URL: 'https://mystickies.tech/api',
}
```

If you changed frontend code, rebuild on your development machine and copy the new `dist/` folder to the server.

## 6. Restart the backend service

Restart the Gunicorn systemd service:

```bash
sudo systemctl restart mystickies-gunicorn
sudo systemctl status mystickies-gunicorn --no-pager
```

If your service file uses a different name, replace `mystickies-gunicorn` with that name.

## 7. Reload Nginx

Check the config and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Verify the site

Open the site in a browser and test the API:

```bash
curl -I http://mystickies.tech
curl -I http://mystickies.tech/api/
```

If you use HTTPS:

```bash
curl -I https://mystickies.tech
curl -I https://mystickies.tech/api/
```

## 9. If something breaks

Check the backend service logs:

```bash
sudo journalctl -u mystickies-gunicorn -n 200 --no-pager
```

Check the Nginx error log:

```bash
sudo tail -n 200 /var/log/nginx/error.log
```

## Short version

When you update the app, the manual sequence is:

```bash
cd /var/www/my-stickies
git fetch origin main
git reset --hard origin/main

cd backend
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

sudo systemctl restart mystickies-gunicorn
sudo systemctl reload nginx
```