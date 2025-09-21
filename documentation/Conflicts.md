# Conflicts Within Single Epics and Their Resolution

---

## Epic 1: User Authentication & Profile Management  

**Conflict 1: Social Login vs Security Notifications**  
**Issue:**  
Social login (US3) may bypass some custom security notifications (US8), leading to inconsistent alerts for unusual activity.  

**Resolution:**  
Integrate social login providers into the same notification system so that security events (new device, suspicious login) are logged and alerted regardless of login method.  

**Conflict 2: Remember User vs Secure SignOut**  
**Issue:**  
US44 (Remember User) keeps sessions persistent, while US5 (Secure SignOut) requires full termination of active sessions. This may confuse users if they expect one but experience the other.  

**Resolution:**  
Provide a clear setting: "Remember Me" applies only to login convenience, not to overriding secure sign-out. On sign-out, all remembered sessions are invalidated.  

---

## Epic 2: Admin & Content Management  

**Conflict 1: Bulk Book Upload vs AI-Powered Content Moderation**  
**Issue:**  
US45 (Bulk Operations for Book Upload) may clash with US46 (AI-Powered Content Moderation). Large batch uploads could bypass moderation checks or delay content approval.  

**Resolution:**  
Apply moderation pipelines automatically to each batch item before final publishing. Bulk uploads go through queued verification without skipping moderation.  

**Conflict 2: Analytics & Trends vs Retention Data Analysis**  
**Issue:**  
US13 (Analytics & Trends) and US34 (Analyzing Retention Data) may produce overlapping metrics with different methodologies, confusing admins.  

**Resolution:**  
Unify analytics under a single data warehouse. Provide customizable dashboards so admins can filter by retention vs general analytics without duplication.  

---

## Epic 3: Catalogue Browsing & Discovery  

**Conflict 1: Basic Search vs Advanced Search Filters**  
**Issue:**  
US25 (Basic Search) may return broad results, while US49 (Advanced Search Filters) expects refined outcomes. Inconsistent UX between the two may frustrate users.  

**Resolution:**  
Use a **progressive search model**: basic search as default, with option to "Refine Results" that opens advanced filters without changing the underlying search engine.  

**Conflict 2: Trending Books vs New Releases**  
**Issue:**  
US26 (Trending Books) and US27 (New Releases) may overlap in results, leading to duplicate book listings.  

**Resolution:**  
Display them as distinct sections. If a new release is also trending, tag it with a “🔥 Trending & New” badge instead of duplicating.  

---

## Epic 4: Book Access & Reading Tools  

**Conflict 1: Automatic Marking a Book as Read vs Continue Reading Shortcut**  
**Issue:**  
US15 (Automatic Marking a Book as Read) may mark a book as finished before the user intends, breaking US52 (Continue Reading Shortcut).  

**Resolution:**  
Mark as "Completed" only when reaching the last chapter/page. Allow user override for edge cases (skimming, abandoning a book).  

**Conflict 2: Offline Reading vs Cross-Device Sync**  
**Issue:**  
US53 (Offline Reading Access) and US18 (Cross-Device Sync) may conflict if offline progress does not sync correctly once online.  

**Resolution:**  
Implement **sync queues** that reconcile changes once the device reconnects, with user resolution for conflicts (e.g., "keep local vs keep server").  

---

## Epic 5: Community & Engagement  

**Conflict 1: Discussing About the Book vs Reporting Inappropriate Content**  
**Issue:**  
US21 (Discussions) encourages open engagement, while US51 (Reporting) may lead to excessive false positives, discouraging participation.  

**Resolution:**  
Introduce transparent moderation rules and allow community-based voting before admin intervention for non-critical flags.  

**Conflict 2: Ratings vs Reviews**  
**Issue:**  
US19 (Rating the Book) and US20 (Uploading Reviews) may confuse users if ratings and reviews aren’t clearly linked.  

**Resolution:**  
Tie ratings and reviews together. Posting a review should optionally include a rating, and standalone ratings should still be visible in aggregated averages.  

---

## Epic 6: AI Features & Personalization  

**Conflict 1: AI Summary Generation vs User Notes**  
**Issue:**  
US37 (AI Summary) may overshadow manual notes (US22 in another epic, but relevant here for personalization overlap). Users may feel AI-generated content dilutes personal interpretation.  

**Resolution:**  
Keep AI summaries **adjacent** to notes, not merged. Allow users to toggle or merge if desired.  

**Conflict 2: Smart Suggestions vs Adaptive Learning**  
**Issue:**  
US36 (Smart Suggestions) and US43 (Adaptive Learning) may use different algorithms, producing contradictory recommendations.  

**Resolution:**  
Adopt a layered AI pipeline: Smart Suggestions provide quick recommendations, while Adaptive Learning refines them over time using long-term data.  
---

## Epic 7: Payments & Subscription Management  

**Conflict 1: Trial/Free Plans vs Subscribing to a Plan**  
**Issue:**  
US50 (Trial/Free Plans) may discourage immediate subscription (US28), leading to unclear upgrade flows.  

**Resolution:**  
Define clear upgrade paths. Once a trial expires, users are prompted to subscribe with transparent comparison of benefits.  

**Conflict 2: Secure Payments vs Order History**  
**Issue:**  
US30 (Secure Payments) and US32 (Order History) may show discrepancies if payment fails but the order is still logged.  

**Resolution:**  
Log all transactions with explicit status: "Pending," "Failed," "Successful." Order history reflects accurate state, not just payment attempt.  

---
