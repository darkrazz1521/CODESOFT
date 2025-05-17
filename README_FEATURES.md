# Devyntra Blog Platform – Feature Overview

## 1. User Authentication
- **Signup with Email Verification:**  
  Users register with name, email, and password. An OTP is sent to their email for verification before account activation.
- **Login:**  
  Users log in with email and password. JWT tokens are used for authentication.
- **Logout:**  
  Users can log out, which clears their session and JWT token from local storage.

## 2. Blog Creation & Management
- **Write Blog:**  
  Authenticated users can create new blog posts with title, cover image, category, content, and tags.
- **Edit Blog:**  
  Users can edit their own blogs. The edit form is pre-filled with existing data.
- **Delete Blog:**  
  Users can delete their own blogs.
- **Drafts & Publishing:**  
  Blogs can be saved as drafts or published. Users can view stats for total, draft, and published blogs.

## 3. Dashboard
- **Personalized Welcome:**  
  Shows the logged-in user's name.
- **Blog Stats:**  
  Displays total blogs, drafts, and published posts.
- **Blog Table:**  
  Lists all user blogs with search and category filter, and actions for edit/delete.
- **Bulk Delete Drafts:**  
  Users can delete all their drafts at once.

## 4. Blog Browsing & Reading
- **Home Page:**  
  - **Featured Posts:** Shows latest published blogs.
  - **Recommended Reads:** Shows most viewed blogs.
  - **Categories:** Quick filter buttons for popular categories.
  - **About, Newsletter, Testimonials, Social Links:** Informational and engagement sections.
- **Categories Page:**  
  - Lists all categories.
  - Clicking a category shows all published blogs in that category.
- **Blog Post Page:**  
  - Displays full blog post with cover image, author, date, category, and view count.
  - **Like Button:** Users can like/unlike posts (requires login).
  - **Comments:** Users can add comments (requires login). All comments are shown below the post.

## 5. Animations & UI
- **Animated Cards:**  
  Blog cards animate into view as you scroll, both on the home and categories pages.
- **Hero Image Animation:**  
  The main hero image animates into view on page load/scroll.
- **Responsive Design:**  
  The site is mobile-friendly and adapts to different screen sizes.

## 6. Newsletter & Contact
- **Newsletter Subscription:**  
  Users can enter their email to subscribe (UI only, backend integration optional).
- **Contact Page:**  
  Simple contact form and social media links.

## 7. Security & Best Practices
- **JWT Authentication:**  
  All blog creation, editing, and deletion require a valid JWT token.
- **Email Verification:**  
  Prevents spam and ensures valid user accounts.
- **Password & Token Handling:**  
  Passwords are stored in the database (consider hashing for production). JWT tokens are stored in local storage and sent with API requests.

## 8. Backend Features
- **MongoDB Data Storage:**  
  All users, blogs, comments, likes, and views are stored in MongoDB.
- **REST API:**  
  Clean API endpoints for all CRUD operations, authentication, and stats.
- **Category & Tag Management:**  
  Static categories and tags are provided for filtering and organization.

---

**Summary:**  
Devyntra is a full-featured, modern blog platform with user authentication, blog management, interactive UI, and a clean, responsive design.
