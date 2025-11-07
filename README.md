# NextChapter - React + Vite + Tailwind + Supabase

A modern online bookstore built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

- **Landing Page** with hero section and book categories
- **Responsive Design** optimized for mobile and desktop
- **Supabase Integration** for backend and authentication
- **Tailwind CSS** for beautiful, custom styling
- **Framer Motion** for smooth animations

## 📦 Tech Stack

- **React 18** - UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service
- **React Router** - Client-side routing
- **Framer Motion** - Animation library

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
NextChapter-React/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Header.jsx
│   │   ├── HeroSection.jsx
│   │   └── BookSection.jsx
│   ├── pages/            # Page components
│   │   └── LandingPage.jsx
│   ├── lib/              # Utilities
│   │   └── supabaseClient.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies
```

## 🎨 Design

The landing page is designed based on the Figma prototype:
- Clean, modern interface
- Cream and coral color scheme
- Featured hero section
- Book categories (Comedy, Thriller, etc.)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📝 Next Steps

- [ ] Set up Supabase database tables
- [ ] Implement authentication (login/signup)
- [ ] Create personalization flow
- [ ] Add book search functionality
- [ ] Integrate with Supabase for real book data

## 🤝 Contributing

Feel free to contribute to this project!

## 📄 License

MIT License

