# Elicitation Technique: Brainstorming

**Project:** NextChapter – Online Bookstore  
**Technique Used:** Brainstorming  
**Purpose:** To collaboratively identify and finalize the key features of the NextChapter platform.  
**Participants:** Project team members (developers, designers, analysts)  
**Method:** Conducted over multiple brainstorming sessions where ideas were generated, discussed, and either finalized, accepted, rejected, or kept on hold.

---

## Session 1 – Platform & Access Model

**Ideas Discussed:**
- Purchase vs. Subscription model
- Online books e-commerce platform vs. Online book reading platform
- Users: Author / Publisher / Admin / Regular User (confusion on roles)
- User/Admin login and profile

**Decisions:**
- ✅ Subscription model – Finalized
- ✅ Online book reading platform – Finalized
- ❌ Author/Publisher roles – Rejected (finalized with just User and Admin)
- ✅ Basic user/admin login and profile – Finalized

---

## Session 2 – Feature Exploration

**Ideas Discussed:**
- Books catalogue (display/browsing/searching/filtering)
- AI book recommendation (Reference: Netflix)
- AI translation
- AI summary (At-time generation vs. Pre-generation at upload)
- AI image generation for scenario representation
- Personalization (Language/Genre/Author) (Reference: Spotify)
- Personalized library (Continue reading, Reading list, Mark as read etc., vs. inside user profile)
- AI genre conversion of books
- Multi-lingual books
- Text-to-speech, audiobooks
- AI chatbot
- Wishlist / Mark as read
- Streaks / Challenges (Reference: games)
- Vocabulary search (Reference: Google Forms survey response)
- Admin analysis
- User self-behavior analysis
- Book download allowed or not
- Rating, review & discussion panel

**Decisions:**
- ✅ Books catalogue – Accepted
- ✅ AI book recommendation – Accepted
- ⏸️ AI translation – On Hold
- ✅ AI summary – Accepted (Pre-generation at upload)
- ✅ AI image generation – Accepted (paragraph-based, not entire book)
- ✅ Personalization – Accepted
- ❌ Personalized library (Continue reading, Reading list, etc. as a separate module) – Rejected, decided to include features within User Profile
- ⏸️ AI genre conversion – On Hold
- ✅ Multi-lingual support for books – Accepted
- ✅ Text-to-speech / Audiobooks – Accepted
- ✅ AI chatbot – Accepted
- ✅ Wishlist / Mark as read – Accepted
- ✅ Streaks / Challenges – Accepted
- ⏸️ Vocabulary search – On Hold
- ✅ Admin analysis – Accepted
- ✅ User self-behavior analysis – Accepted
- ❌ Book download – Not allowed
- ✅ Rating, review & discussion panel – Accepted

---

## Session 3 – UI/UX and Technical Decisions

**Ideas Discussed:**
- Light/Dark mode
- UI/UX colour theme (Reference: reading platforms)
- Database selection (Firebase vs. MongoDB)

**Decisions:**
- 🌗 Light/Dark/Reading mode – Discussed (to refine later)
- ✅ UI/UX colour theme – Finalized: Light warm colours
- ✅ Database selection – Finalized: Firebase (better adaptability)

---

## Summary of Outcomes

**Adopted Model:** Subscription-based, online reading platform

**Core Features Finalized:**
- User/Admin login & profiles
- Books catalogue with search & filtering
- AI-powered recommendations, summaries, chatbot, personalization, and image generation
- Multi-lingual support
- Text-to-speech / Audiobooks
- Gamification elements (streaks/challenges)
- Wishlist & reading tracker
- Rating, review & discussion panel
- Analytics for admin and users
- Controlled offline access (limited save within platform, no downloads)

**Deferred / Rejected Features:**
- ⏸️ AI translation – On Hold
- ⏸️ Vocabulary search – On Hold
- ❌ Separate personalized library module (merged into user profile)
- ⏸️ AI genre conversion – On Hold

**UI/UX & Technical Choices:**
- Light warm colour theme
- Firebase as the database solution
