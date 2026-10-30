# Zenith • Minimalist Daily Task Planner & StudySync

Zenith is a modern, minimalist productivity web application designed for mindful daily organization, deep focus, and collaborative study planning. Built with a mobile-first philosophy, it combines an elegant local-first to-do list with a real-time study synchronization workspace.

---

## 🌿 Highlights

- **Distraction-Free Aesthetics**: Warm, calm tones (`#FAF8F5`), minimalist cards, and modern typography tailored for clarity and mindful execution.
- **Local-First Performance**: Works seamlessly offline out of the box. Add, organize, prioritize, and complete tasks with zero latency and zero mandatory account setup.
- **Progressive Web App (PWA)**:
  - Add to Home Screen support for iOS (Safari) and Android (Chrome).
  - Native standalone display mode with notch and safe-area optimization (`env(safe-area-inset-*)`).
  - Service worker precaching and custom offline fallback.
- **StudySync Workspace & Collaboration**:
  - Connect with study partners and accountability teammates via user discovery.
  - Real-time study room messaging and study check-ins powered by Socket.IO.
  - Share study materials, PDF notes, and assignment documents up to 25MB.
  - Live activity status and message read receipts.
- **Smart Notification Reminders & Audio Chimes**:
  - Discreet, melodic bell chimes on incoming partner updates.
  - Disguised productivity notifications (*"New task added: Daily rhythm item synchronized"*) to keep your workflow focused and unobtrusive.
- **Responsive & Touch-Optimized**: Swipe gestures, smooth transitions with Framer Motion, and mobile keyboard-aware layout (`100dvh`).

---

## 🛠️ Technology Stack

### Client
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Animations**: Framer Motion, Canvas Confetti
- **PWA**: `vite-plugin-pwa` (Workbox)
- **Networking**: Axios, Socket.IO Client

### Server
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Real-Time Engine**: Socket.IO
- **Security**: JWT Authentication, bcryptjs password hashing
- **File Management**: Multer

---

## 📁 Project Structure

```text
sttudysynccumchatroom/
├── client/
│   ├── public/
│   │   ├── icons/            # PWA icons (192x192, 512x512, apple-touch)
│   │   ├── favicon.svg       # Minimalist SVG favicon
│   │   └── offline.html      # Service worker offline fallback
│   ├── src/
│   │   ├── components/       # Reusable UI & PWA components
│   │   ├── context/          # Auth & Socket.IO Context Providers
│   │   ├── hooks/            # Custom hooks (PWA install prompt, etc.)
│   │   ├── pages/            # Task list, Auth, Discovery & Workspace views
│   │   ├── services/         # API & REST communication
│   │   └── utils/            # Notification sounds & date formatters
│   ├── index.html
│   └── vite.config.js
├── server/
│   ├── config/               # Database connection config
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth & file upload middleware
│   ├── models/               # Mongoose schemas (User, Task, Chat, etc.)
│   ├── routes/               # API endpoint routing
│   ├── socket/               # Socket.IO real-time event handlers
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- npm (v9 or newer)

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install client and server packages
   npm --prefix client install
   npm --prefix server install
   ```

2. **Configure Environment Variables**:
   A template configuration is provided in `server/.env.example`. Create `server/.env` with your settings:
   ```env
   PORT=5000
   MONGODB_URI=
   JWT_SECRET=zenith_production_secret_key_change_me
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```
   > *Note: If `MONGODB_URI` is left blank during local development, an embedded database server is automatically initialized.*

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   - Frontend Application: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---

## 📱 PWA Installation

### Android / Chrome
Tap the **"Install"** button on the top banner or open Chrome menu (⋮) and select **"Add to Home screen"** / **"Install App"**.

### iPhone / Safari
1. Tap the **Share** icon at the bottom of the Safari toolbar.
2. Scroll down and choose **"Add to Home Screen"**.
3. Tap **"Add"** in the top right corner.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
