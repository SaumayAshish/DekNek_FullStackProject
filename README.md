PortfolioAI – AI-Powered Stock Portfolio Intelligence

An end-to-end full-stack web application that helps users track NIFTY50 stocks, analyze portfolio performance, and receive AI-driven investment recommendations powered by machine learning.

🌐 Live Demo
🔗 Frontend (Vercel):
https://dek-nek-full-stack-project.vercel.app
🔗 Backend API (Render):
https://deknek-fullstackproject.onrender.com
🔗 GitHub Repository:
https://github.com/SaumayAshish/DekNek_FullStackProject
📌 Features
📊 Portfolio Management
Add & manage stock holdings
Track real-time portfolio performance
View profit/loss analytics
📈 Market Data Integration
Live NIFTY50 stock data
Historical price tracking
Dynamic stock search
🤖 AI Recommendations
ML-based stock suggestions (XGBoost)
Explainable AI using SHAP
Portfolio optimization insights
🔐 Authentication
User signup/login (JWT-based)
Secure session management
⚡ Modern UI/UX
Built with Next.js
Responsive & fast interface
Smooth navigation using App Router
🏗️ Tech Stack
🔹 Frontend
Next.js (App Router)
React
Tailwind CSS
Axios
🔹 Backend
Node.js
Express.js
JWT Authentication
REST APIs
🔹 ML Service
Python
FastAPI / Flask
XGBoost
SHAP
🔹 Deployment
Frontend: Vercel
Backend: Render
ML Service: Render
⚙️ Project Structure
DekNek_FullStackProject/
│
├── frontend/        # Next.js frontend
├── backend/         # Express backend
├── ml-service/      # ML microservice (Python)
└── README.md
🛠️ Local Setup
1️⃣ Clone Repository
git clone https://github.com/SaumayAshish/DekNek_FullStackProject.git
cd DekNek_FullStackProject
2️⃣ Setup Frontend
cd frontend
npm install
npm run dev

Create .env.local:

NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_ML_URL=http://localhost:8000
3️⃣ Setup Backend
cd backend
npm install
npm start

Create .env:

PORT=5001
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret
4️⃣ Setup ML Service
cd ml-service
pip install -r requirements.txt
uvicorn src.app:app --reload
🔗 API Endpoints (Sample)
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/portfolio
POST   /api/portfolio/add
GET    /api/stocks/:symbol
POST   /api/portfolio/ai/recommend
🚀 Deployment
Frontend (Vercel)
Set environment variable:
NEXT_PUBLIC_API_URL=https://deknek-fullstackproject.onrender.com/api
Backend (Render)
Root directory: backend
Start command:
npm start
ML Service (Render)
Root directory: ml-service
Start command:
uvicorn src.app:app --host 0.0.0.0 --port 10000
⚠️ Notes
Render free tier may sleep → first API call can take ~30 seconds
Use incognito or clear cache if frontend behaves inconsistently
Ensure environment variables are set correctly in production

<img width="1903" height="929" alt="image" src="https://github.com/user-attachments/assets/4707283a-7b0b-473c-b38b-51245bb65d2b" />

<img width="446" height="708" alt="image" src="https://github.com/user-attachments/assets/2665ac24-9845-4a13-844c-f50cf3b8902d" />

<img width="415" height="525" alt="image" src="https://github.com/user-attachments/assets/1ef9401d-c9f1-4253-b53c-93fa2dc6d390" />

🎯 Future Enhancements
Real-time WebSocket updates
Advanced portfolio optimization
Multi-market support (US + Global)
Deployment with Docker/Kubernetes
👨‍💻 Author

Saumay Ashish

🔗 LinkedIn: https://www.linkedin.com/in/saumay-ashish
💻 GitHub: https://github.com/SaumayAshish
⭐ Acknowledgements
Open-source financial data APIs
ML libraries (XGBoost, SHAP)
Next.js & modern web ecosystem
📜 License

This project is for educational and demonstration purposes.

🚀 Final Note

This project demonstrates:

Full-stack development
API integration
ML model deployment
Cloud-based architecture
