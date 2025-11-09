# 🚀 Deploy DoorSmashOrPass to Vercel - Complete Guide

## Project Overview

**DoorSmashOrPass** is a full-stack campus food delivery platform with:
- **Frontend**: React + Vite (TypeScript)
- **Backend**: FastAPI (Python) with multiple APIs
- **Database**: Supabase (PostgreSQL)
- **AI Features**: Pydantic AI with Google Gemini, ElevenLabs Voice
- **Payment**: Stripe integration

**Repository**: student-eats-ai  
**Current Branch**: mainhoe  
**GitHub**: icedmoch/student-eats-ai

---

## 📁 Project Structure

```
student-eats-ai/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Route pages
│   │   ├── components/         # React components
│   │   ├── integrations/       # Supabase client
│   │   └── lib/                # Utilities, API clients
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Python FastAPI backend
│   ├── main.py                 # Main Orders/Menu API (port 8000)
│   ├── chatbot_api.py          # AI Chatbot API (port 8002)
│   ├── nutrition_api.py        # Nutrition tracking API
│   ├── orders_api.py           # Order management
│   ├── scraper.py              # UMass dining hall scraper
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variables template
│
├── lambda/                      # AWS Lambda scraping service
│   ├── lambda_function.py
│   └── Dockerfile
│
└── package.json                # Root dependencies
```

---

## 🎯 Deployment Architecture

### Option 1: Monorepo Deployment (Recommended)
Deploy frontend and backend together using Vercel's monorepo support.

### Option 2: Separate Deployments
- **Frontend**: Deploy as standard Vite app
- **Backend**: Deploy as Vercel Serverless Functions (Python)

---

## 📋 Prerequisites

1. **Vercel Account** with CLI installed
2. **Supabase Project** already set up with:
   - Tables: `profiles`, `orders`, `order_items`, `food_items`, `meal_entries`, `chat_history`
   - RLS policies enabled
   - Anon and service role keys
3. **API Keys**:
   - Google Gemini API key (`GOOGLE_API_KEY`)
   - ElevenLabs API key (`ELEVENLABS_API_KEY`)
   - Stripe API keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
   - Supabase URL and keys

---

## 🔧 Environment Variables

### Frontend (.env in frontend/)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key
VITE_API_URL=https://your-api-url.vercel.app  # Backend API URL
```

### Backend (.env in backend/)
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# AI Services
GOOGLE_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# API Configuration
NUTRITION_API_BASE=http://localhost:8000  # Will be updated to Vercel URL
ORDERS_API_BASE=http://localhost:8000

# Stripe
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional
PORT=8000
```

---

## 📦 Backend APIs to Deploy

### 1. Main API (`main.py`) - Port 8000
**Endpoints**:
- `/api/food-items` - Menu search
- `/api/orders` - Order management
- `/health` - Health check

**Dependencies**:
- FastAPI, Supabase, Stripe
- No external service dependencies

### 2. Chatbot API (`chatbot_api.py`) - Port 8002
**Endpoints**:
- `/chat` - AI chatbot interaction
- `/history/{user_id}` - Chat history

**Dependencies**:
- Pydantic AI, Google Gemini
- Requires: `GOOGLE_API_KEY`
- Calls: Nutrition API, Orders API

### 3. Nutrition API (`nutrition_api.py`) - Embedded in main.py
**Endpoints**:
- `/api/nutrition/profiles/{user_id}` - User profiles
- `/api/nutrition/totals/user/{user_id}` - Daily totals
- `/api/nutrition/meals` - Meal logging

**Dependencies**:
- Supabase only

---

## 🚀 Vercel Deployment Steps

### Step 1: Prepare the Project

#### A. Create `vercel.json` in root
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/main.py",
      "use": "@vercel/python",
      "config": {
        "maxDuration": 30
      }
    },
    {
      "src": "backend/chatbot_api.py",
      "use": "@vercel/python",
      "config": {
        "maxDuration": 60
      }
    }
  ],
  "routes": [
    {
      "src": "/api/chat(.*)",
      "dest": "backend/chatbot_api.py"
    },
    {
      "src": "/api/(.*)",
      "dest": "backend/main.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.11"
  }
}
```

#### B. Update `frontend/package.json`
Add build output directory configuration:
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  }
}
```

#### C. Create `backend/vercel.json` (API-specific config)
```json
{
  "builds": [
    {
      "src": "*.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

---

### Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

---

### Step 3: Login to Vercel

```bash
vercel login
```

---

### Step 4: Link Project

```bash
# In project root
vercel link
```

Follow prompts:
- Set up and deploy? **Yes**
- Scope: Select your account
- Link to existing project? **No** (for new project)
- Project name: `doorsmashpass` or `student-eats-ai`
- Directory: `.` (root)

---

### Step 5: Configure Environment Variables

#### Via Vercel Dashboard:
1. Go to project settings
2. Navigate to **Environment Variables**
3. Add all variables from both frontend and backend `.env` files
4. Select environments: **Production**, **Preview**, **Development**

#### Via CLI:
```bash
# Set environment variables
vercel env add SUPABASE_URL production
vercel env add SUPABASE_KEY production
vercel env add GOOGLE_API_KEY production
vercel env add ELEVENLABS_API_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# ... add all other variables
```

---

### Step 6: Deploy to Production

```bash
# Deploy to production
vercel --prod
```

Or for preview:
```bash
vercel
```

---

## 🔄 Backend API Adaptation for Vercel

### Convert FastAPI to Vercel Serverless

#### Option A: Create `api/` folder structure
```
backend/
├── api/
│   ├── index.py          # Main API (from main.py)
│   ├── chat.py           # Chatbot API (from chatbot_api.py)
│   └── nutrition.py      # Nutrition API
└── requirements.txt
```

#### Option B: Use Vercel Python Runtime directly

Create `backend/api/index.py`:
```python
from main import app
from mangum import Mangum

handler = Mangum(app)
```

Install Mangum:
```bash
pip install mangum
```

Update `requirements.txt`:
```
mangum==0.17.0
```

---

## 📝 Critical Configuration Updates

### 1. Update CORS Settings in Backend

In `main.py` and `chatbot_api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local dev
        "https://yourapp.vercel.app",  # Production
        "https://*.vercel.app"  # All preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Update Frontend API URLs

In `frontend/src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:8002';
```

### 3. Update Supabase Configuration

Ensure frontend uses environment variables:
```typescript
// frontend/src/integrations/supabase/client.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## 🧪 Testing Deployment

### Test Endpoints:
```bash
# Health check
curl https://your-app.vercel.app/health

# API endpoints
curl https://your-app.vercel.app/api/food-items

# Chatbot
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","user_id":"test-id"}'
```

### Frontend:
Navigate to: `https://your-app.vercel.app`

---

## 🐛 Common Issues & Solutions

### Issue 1: Package Size Limits
**Error**: "Serverless Function size exceeds limit"

**Solution**: Use `vercel-python` optimization
```json
{
  "functions": {
    "api/**/*.py": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### Issue 2: Python Dependencies Installation
**Error**: Dependencies not installing

**Solution**: Create `requirements.txt` in `api/` folder
```bash
cd backend
pip freeze > api/requirements.txt
```

### Issue 3: CORS Errors
**Error**: "Access-Control-Allow-Origin"

**Solution**: Add Vercel domain to CORS origins (see above)

### Issue 4: Environment Variables Not Loading
**Error**: Missing API keys

**Solution**: 
- Check Vercel dashboard > Project > Settings > Environment Variables
- Redeploy after adding variables: `vercel --prod --force`

### Issue 5: Chatbot API Timeout
**Error**: Function execution timeout

**Solution**: Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/chat.py": {
      "maxDuration": 60
    }
  }
}
```

---

## 📊 Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Frontend builds successfully
- [ ] Backend APIs respond to health checks
- [ ] Supabase connection working
- [ ] Stripe webhooks configured (update URL to Vercel)
- [ ] ElevenLabs voice features working
- [ ] Chatbot responding correctly
- [ ] Order creation flow working
- [ ] Nutrition tracking functional
- [ ] Custom domain configured (optional)

---

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Supabase RLS**: Ensure Row Level Security policies are active
3. **API Keys**: Use Vercel's encrypted environment variables
4. **CORS**: Restrict to specific domains in production
5. **Stripe Webhooks**: Use webhook signing secret validation

---

## 📈 Monitoring & Logs

### View Logs:
```bash
vercel logs [deployment-url]
```

### Vercel Dashboard:
- **Analytics**: Traffic and performance metrics
- **Speed Insights**: Core Web Vitals
- **Functions**: Serverless function logs and metrics

---

## 🔄 Continuous Deployment

### GitHub Integration:
1. Connect GitHub repository to Vercel
2. Enable automatic deployments
3. Every push to `main`/`mainhoe` triggers deployment
4. Pull requests create preview deployments

### Deploy Hooks:
Create deploy hooks for manual or scheduled deployments:
```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/[hook-id]
```

---

## 💰 Cost Considerations

### Vercel Pricing:
- **Hobby Plan (Free)**: 
  - 100 GB bandwidth
  - 100 serverless function executions per day
  - Suitable for MVP/testing

- **Pro Plan ($20/month)**:
  - 1 TB bandwidth
  - Unlimited serverless functions
  - Team collaboration
  - Recommended for production

### Expected Usage:
- **Frontend**: Static hosting (minimal cost)
- **Backend APIs**: Serverless functions (pay per execution)
- **Chatbot**: Higher execution time (consider timeouts)

---

## 🎯 Optimization Tips

1. **Code Splitting**: Vite handles this automatically
2. **API Response Caching**: Cache menu data
3. **Database Indexing**: Optimize Supabase queries
4. **CDN**: Vercel's Edge Network handles this
5. **Image Optimization**: Use Vercel Image Optimization

---

## 📚 Additional Resources

- [Vercel Python Documentation](https://vercel.com/docs/functions/runtimes/python)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Supabase + Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-vercel)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## 🆘 Support

If deployment issues persist:
1. Check Vercel deployment logs
2. Review function execution logs
3. Test APIs locally first
4. Verify environment variables
5. Contact Vercel support (Pro plan)

---

## ✅ Final Deployment Command

```bash
# Full production deployment
vercel --prod

# With environment variables
vercel --prod -e GOOGLE_API_KEY=your-key -e SUPABASE_URL=your-url

# Force rebuild
vercel --prod --force
```

---

**🎉 Your DoorSmashOrPass application should now be live on Vercel!**

**Production URL**: `https://your-project.vercel.app`

---

## 📝 Post-Deployment Updates Needed

### Update Frontend Environment
```bash
VITE_API_URL=https://your-project.vercel.app
VITE_CHATBOT_URL=https://your-project.vercel.app/api
```

### Update Backend Inter-API Communication
```python
# In chatbot_api.py
NUTRITION_API_BASE = os.getenv("NUTRITION_API_BASE", "https://your-project.vercel.app")
ORDERS_API_BASE = os.getenv("ORDERS_API_BASE", "https://your-project.vercel.app")
```

### Update Stripe Webhooks
1. Go to Stripe Dashboard
2. Update webhook endpoint: `https://your-project.vercel.app/api/webhook/stripe`

---

**Built with ❤️ for HackUMass XIII**  
**Deployment Guide Version**: 1.0  
**Last Updated**: November 9, 2025
