# SiteWatchAI - Construction Safety Monitor

SiteWatchAI is an advanced, AI-powered construction site monitoring platform designed to ensure worker safety, detect hazards in real-time, and streamline compliance. The platform consists of a modern React frontend and a powerful Python/FastAPI backend utilizing computer vision (YOLO) for comprehensive safety gear detection and hazard identification.

## 🌟 Key Features

*   **Real-time AI Monitoring**: Uses YOLO (Ultralytics) to analyze video feeds and detect workers, proper Personal Protective Equipment (PPE) like helmets and vests, falls, and unsafe zone breaches.
*   **Comprehensive Dashboards & Analytics**: Track compliance rates, incident trends, and worker statistics through interactive charts and analytics pages.
*   **Incident Management**: Automatically logs safety violations and hazards in MongoDB, complete with timestamps and incident details.
*   **Automated Alerts**: Integrates with Twilio to send instant WhatsApp notifications to administrators when safety violations occur or when contact inquiries are submitted.
*   **Organization & Worker Management**: Multi-tenant architecture ensuring that an organization's data, workers, and camera feeds are strictly isolated. Administrators can manage their workforce effectively.
*   **Inventory & Stock Management**: Built-in tools for tracking construction site inventory and safety equipment stocks.
*   **Automated Reports**: Generate and export safety and compliance reports for record-keeping and regulatory bodies.
*   **Interactive Chatbot**: Integrated chatbot widget to assist users navigating the platform.
*   **Secure Payment Integration**: Fully integrated with the **PayHere** payment gateway (Sri Lanka) for seamless, secure organization onboarding and lifetime access purchases.
*   **Modern UI/UX**: Built with React, Tailwind CSS, and Framer Motion for a stunning, responsive, and dark-themed premium user experience.

---

## 🏗️ Technology Stack

### Frontend (`/frontend`)
*   **Framework**: React.js (via Vite)
*   **Styling**: Tailwind CSS
*   **Animations**: Framer Motion
*   **Routing**: React Router DOM (Protected & Public Routes)
*   **Icons**: Lucide React & React Icons
*   **Payments**: PayHere JS SDK

### Backend (`/backend`)
*   **Framework**: FastAPI (Python)
*   **Database**: MongoDB (via PyMongo)
*   **AI/Computer Vision**: Ultralytics YOLOv11 (`ppe_model.pt`), OpenCV, Shapely (for unsafe zone polygons)
*   **Video Processing**: FFmpeg (H.264 conversion)
*   **Authentication**: JWT (JSON Web Tokens), bcrypt
*   **Messaging**: Twilio SDK (WhatsApp API)

---

## 🚀 Full Application Workflow & Architecture

### 1. Onboarding & Payment Flow
1.  A site owner visits the **Landing Page** and decides to register their organization.
2.  They navigate to the **Pricing Page**, fill out their details, and initiate payment.
3.  The frontend requests a secure MD5 hash from the backend (`/api/payment/generate-hash`).
4.  The PayHere checkout modal opens. Upon successful payment, PayHere sends an asynchronous webhook to the backend (`/api/payment/notify`) to verify the transaction.
5.  The user is redirected to the **Registration Page** to finalize their account creation and login credentials.

### 2. Authentication & Organization Isolation
1. Users log in via the `/login` route.
2. The backend authenticates credentials and issues a JWT token.
3. The platform uses this token to isolate organization data. Dashboard, workers, incidents, and video feeds are strictly scoped to the logged-in user's organization.

### 3. AI Video Monitoring & Safety Detection Flow
1.  Administrators navigate to the **Upload Page** to submit construction site video feeds.
2.  The FastAPI server receives the video and spawns a background processing thread.
3.  The system uses **OpenCV** and the **YOLOv11** model (`ppe_model.pt`) to process the video frame-by-frame. It performs a 5-step detection pipeline:
    *   **People Detection**: Identifies all individuals in the frame.
    *   **Helmet Detection**: Checks if identified workers are wearing hard hats.
    *   **Vest Detection**: Checks for high-visibility safety vests.
    *   **Fall Detection**: Identifies if a worker has fallen or is in distress.
    *   **Unsafe Zone Breaches**: Uses spatial geometry (`Shapely`) to detect if workers have crossed into restricted/dangerous zones.
4.  Processed videos are converted to browser-playable H.264 format using FFmpeg.
5.  The system generates a comprehensive `detection_results.json` and logs all violations as incidents in MongoDB.

### 4. Incident Management & Notifications
1.  When a violation (e.g., missing helmet, unauthorized access) is detected, an incident record is created.
2.  *(If configured)* A **Twilio WhatsApp alert** is triggered and sent immediately to the site administrator, ensuring rapid response to safety hazards.
3.  Users can review all logged events on the **Incidents Page**.

### 5. Compliance & Analytics
1.  The **Analytics Page** aggregates incident data to provide insights into site safety trends over time.
2.  The **Compliance Page** tracks overall safety scores and adherence to protocols, helping organizations maintain regulatory standards.

### 6. Stock & Inventory Management
1.  The platform includes a **Stocks Page** where administrators can manage construction materials and safety equipment inventory.
2.  Users can track stock levels, add new items, and monitor resource allocation across the site.

### 7. Automated Reporting
1.  The **Reports Page** allows administrators to generate detailed summaries of safety performance, incidents, and compliance metrics.
2.  These reports can be exported for internal reviews or external audits.

### 8. Contact & Support (Chatbot)
1.  Users can fill out the form on the **Contact Page** for support. The backend securely connects to Twilio and sends the inquiry directly to the Admin's WhatsApp number.
2.  A floating **Chatbot Widget** is available globally across the frontend to provide instant assistance and navigation help.

---

## ⚙️ Local Development Setup

### Prerequisites
*   Node.js (v16+)
*   Python (3.9+)
*   FFmpeg (Installed and added to system PATH for video conversion)
*   MongoDB Instance (Local or Atlas)
*   Twilio Account (for WhatsApp alerts)
*   PayHere Sandbox Account (for payment testing)

### 1. Clone & Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

Create a `.env` file in the `/backend` directory:
```env
PORT=8000
MONGO_URI="your_mongodb_connection_string"

TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TWILIO_WHATSAPP_SENDER="whatsapp:+14155238886"
ADMIN_WHATSAPP_NUMBER="whatsapp:+94760429021"

PAYHERE_MERCHANT_ID="your_payhere_sandbox_id"
PAYHERE_MERCHANT_SECRET="your_payhere_sandbox_secret"
```

Start the backend server:
```bash
python run.py
# Server will run on http://localhost:8000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
# Server will run on http://localhost:5173
```

### 3. Running Offline Inference (Optional)
To run the AI pipeline on a standalone video without the web interface:
```bash
python main.py --video videos/sample.mp4
```

---

## 🔒 Security Notes
*   **Payment Hashes**: Payment hashes are strictly generated on the backend. Never expose your PayHere Merchant Secret to the frontend.
*   **Environment Variables**: The `.env` file should never be committed to version control. Ensure it is included in your `.gitignore`.
*   **Twilio Sandbox**: If testing WhatsApp messages via Twilio Sandbox, ensure the receiving phone number has opted in by texting the specific `join <keyword>` command to the Twilio number.
*   **Route Protection**: The frontend uses `ProtectedRoute` wrappers to ensure unauthenticated users cannot access sensitive dashboard pages, and `adminOnly` flags to restrict administrative actions.
