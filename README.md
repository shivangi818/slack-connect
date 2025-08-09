# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.  
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.  
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.  
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can eject at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them.  
All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them.

You don’t have to ever use eject. The curated feature set is suitable for small and middle deployments.  
However, we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).  

To learn React, check out the [React documentation](https://reactjs.org/).

---

# 🛠 Slack Connect Assignment – Custom Setup Guide

## 📂 Project Structure

slack-connect-assignment/
│
├── backend/
│ ├── src/
│ ├── .env
│
└── frontend/
├── src/
├── public/


---

## 1️⃣ Backend Setup

cd backend
npm install
npm run dev

Runs backend at: `http://localhost:5000`

**Sample `.env`:**

CLIENT_ID=YOUR_SLACK_CLIENT_ID
CLIENT_SECRET=YOUR_SLACK_CLIENT_SECRET
REDIRECT_URI=https://<your-ngrok-id>.ngrok.io/api/oauth/callback
PORT=5000

💡 `<your-ngrok-id>` ngrok chalane ke baad HTTPS forwarding URL se lo.

---

## 2️⃣ Frontend Setup

cd frontend
npm install --legacy-peer-deps
npm start

Runs at: `http://localhost:3000`

---

## 3️⃣ Ngrok Config (Backend + Frontend single session)

1. Create `ngrok.yml` file:
tunnels:
backend:
addr: 5000
proto: http
frontend:
addr: 3000
proto: http


2. Run:
ngrok start --all --config=C:\Users\shiva\OneDrive\Desktop\slack-connect\ngrok.yml


3. Ngrok HTTPS (backend) URL ko `.env` + Slack App Redirect URL me lagao.

---

## 🔐 Slack App OAuth Setup

- **Redirect URL:**  
https://<your-ngrok-id>.ngrok.io/api/oauth/callback

- **Bot Token Scopes:**  
chat:write
channels:read
users:read
channels:history


---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/oauth/start` | Start OAuth Flow |
| GET | `/api/oauth/callback` | OAuth Callback |
| GET | `/api/channels` | List Channels |
| POST | `/api/send-message` | Send Message |
| POST | `/api/schedule-message` | Schedule Message |
| GET | `/api/list-scheduled` | View Scheduled Messages |
| DELETE | `/api/delete-scheduled/:id?channel=...` | Delete Scheduled Message |

---

## 🔄 Usage Flow

1. Open frontend → **Connect to Slack**
2. OAuth authorize
3. Select channel → Send/Schedule message
4. View/Delete scheduled messages

---

## ✅ Final Checklist

- [ ] Backend + Frontend run without errors  
- [ ] `.env` & Slack App URL match  
- [ ] OAuth works  
- [ ] All API features tested  
- [ ] Repo contains backend, frontend, ngrok.yml, README

---
---

## 📊 Application Flow Diagram

flowchart LR
    A[User (Browser)] -->|Interact with UI| B[Frontend (React App)]
    B -->|API Request| C[Backend (Node.js/Express)]
    C -->|Validates & Refreshes Token| D[Slack OAuth Server]
    D -->|Returns Token| C
    C -->|Performs Action via Slack API| E[Slack Platform]
    E -->|API Response| C
    C -->|Sends Response| B
    B -->|Updates UI| A

---
