# SecretePlace Deployment Guide

Deploy your frontend on **Vercel** and backend on **Render**.

---

## Prerequisites

- GitHub account (for both Vercel and Render)
- Push your project to GitHub

---

## 1. Backend Deployment (Render)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name:** `secreteplace-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free (or paid for better uptime)

### Step 3: Set Environment Variables
In Render Dashboard, go to your service → **Environment**

Add these variables:
- `NODE_ENV` = `production`
- `PORT` = (Render sets this automatically, but add for clarity) `3000`
- `CLIENT_URL` = `https://your-vercel-frontend.vercel.app` (set after frontend is deployed)
- `SESSION_SECRET` = Generate a secure random string (use a password generator)

### Step 4: Get Backend URL
After deployment, you'll get a URL like:
```
https://secreteplace-backend.onrender.com
```

**Keep this URL for the frontend setup.**

---

## 2. Frontend Deployment (Vercel)

### Step 1: Push to GitHub (if not done)
Ensure your code is pushed to GitHub.

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **Add New...** → **Project**
4. Select your GitHub repository
5. Vercel will auto-detect and configure the project
6. Click **Deploy**

### Step 3: Update Frontend API Endpoint
Before or after deployment, update your frontend files to point to the backend:

**File: `Public/index-script.js`** (or your main frontend script)

Find where you define the socket connection:
```javascript
const socket = io(/* API URL should be here */);
```

Update to use an environment variable or the Render backend URL:
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : 'https://secreteplace-backend.onrender.com'; // Use your Render URL

const socket = io(API_URL);
```

### Step 4: Verify Frontend is Working
1. Once Vercel deployment completes, you'll get a URL like:
   ```
   https://secreteplace.vercel.app
   ```
2. Update the Render backend environment variable:
   - Go to Render Dashboard
   - Edit your backend service
   - Set `CLIENT_URL` = `https://secreteplace.vercel.app`

---

## 3. Final Steps

### Update Backend CORS
After frontend is deployed, update backend environment:
- `CLIENT_URL` should point to your Vercel frontend

### Test the Connection
1. Visit your Vercel frontend URL
2. Try to sign up / login
3. Check browser console for any CORS errors
4. Check Render logs for backend errors

---

## Important Notes

### Data Storage
- **Current Setup:** Uses JSON files (users.json, rooms.json, messages.json)
- **Problem:** Render has ephemeral storage - files reset on restart
- **Solution Options:**
  1. Add a database (PostgreSQL, MongoDB)
  2. Use Render's persistent disk (paid feature)
  3. Accept that data resets on redeploy (fine for demo)

### Environment Variables for Render
Make sure to set:
- `SESSION_SECRET` - Change this! Use a 32+ character random string
- `CLIENT_URL` - Your Vercel frontend URL
- `NODE_ENV` - Set to `production`

### CORS Security
The app currently uses:
```javascript
cors: {
    origin: CLIENT_URL,
    credentials: true
}
```

This is secure - it only allows your Vercel frontend to connect.

---

## Troubleshooting

### CORS Errors
**Problem:** `Access to XMLHttpRequest blocked by CORS policy`
**Solution:** 
1. Check `CLIENT_URL` env var matches your Vercel URL
2. Restart the Render service

### Connection Timeout
**Problem:** Frontend can't connect to backend
**Solution:**
1. Verify Render backend is running (check logs)
2. Check that `CLIENT_URL` is correct in Render
3. Test the backend URL directly in browser

### Session Not Persisting
**Problem:** Login session resets
**Solution:**
1. Check `SESSION_SECRET` is set in Render
2. Ensure cookies are being sent (`credentials: true` in frontend)
3. Set `secure: true` in production (already done in code)

---

## Deployment Checklist

- [ ] Push code to GitHub
- [ ] Deploy backend on Render
- [ ] Set backend environment variables
- [ ] Get backend URL from Render
- [ ] Deploy frontend on Vercel
- [ ] Update frontend to point to backend URL
- [ ] Update Render `CLIENT_URL` to frontend Vercel URL
- [ ] Test login/signup functionality
- [ ] Test chat functionality
- [ ] Check browser console for errors
- [ ] Check Render logs for errors

---

## Next Steps (Optional)

1. **Add Database:** Consider PostgreSQL/MongoDB for persistent data
2. **Add SSL/HTTPS:** Already handled by Render & Vercel
3. **Monitor Logs:** Use Render dashboard to monitor backend logs
4. **Custom Domain:** Connect custom domain to Vercel
5. **CI/CD:** GitHub Actions for automated deployment

