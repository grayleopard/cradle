
# Cradle - Safe Baby Gear Marketplace

Cradle is a hyper-local, safety-first marketplace for baby and kids' gear. It uses Google Gemini AI to automatically verify items against CPSC recall databases and analyze deal quality.

## 🚀 Key Features

- **AI Safety Guard:** Every listing is analyzed via Gemini 3.1 Flash for potential recalls.
- **Smart Escrow System:** Payments are held securely until the buyer inspects the item.
- **AI Concierge:** Real-time shopping assistant (Text & Voice).
- **PWA Ready:** Installable on iOS and Android via "Add to Home Screen".

## 📦 Quick Start (GitHub & Deployment)

### 1. Push to your GitHub
If you see a `Permission denied (publickey)` error, use the **HTTPS** method below:

```bash
# Initialize repo
git init
git add .
git commit -m "Initial MVP commit"

# Set remote using HTTPS (Replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/cradle-app.git

# If you already added origin and it failed, run this instead:
# git remote set-url origin https://github.com/YOUR_USERNAME/cradle-app.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [Vercel](https://vercel.com).
2. Connect your GitHub account.
3. Import the `cradle-app` repository.
4. **Environment Variables**: Add your `VITE_GEMINI_API_KEY` (from AI Studio) in the project settings.
5. Click **Deploy**.

## 🛠 Tech Stack
- React 19, TypeScript, Tailwind CSS
- Google Gemini API (@google/genai)
- Supabase (Backend/Auth)
- Cloudinary (Image Hosting)

## 📱 Mobile Testing
1. Open your deployed Vercel URL in Safari (iOS) or Chrome (Android).
2. Tap **Share** (iOS) or **Menu** (Android).
3. Select **"Add to Home Screen"**.
4. Test the **Swipe-to-Back** gesture on any Item Detail page by swiping from the very left edge.
