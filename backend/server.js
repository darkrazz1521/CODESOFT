const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
});
const User = mongoose.model('User', userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  coverImage: String,
  category: String,
  content: String,
  tags: [String],
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  views: { type: Number, default: 0 } // Add views field to Blog schema
});
const Blog = mongoose.model('Blog', blogSchema);

app.use(cors());
app.use(express.json());

// Nodemailer setup with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Email sending function
async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"Devyntra OTP" <${process.env.GMAIL_EMAIL}>`,
    to: toEmail,
    subject: 'Your Devyntra OTP Code',
    text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
  };

  return transporter.sendMail(mailOptions);
}

// JWT authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Writely backend is running!');
});

// Signup route: register user and send OTP
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    return res.status(400).json({ message: 'Email already registered.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (user && !user.isVerified) {
    user.name = name;
    user.password = password;
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
  } else if (!user) {
    user = new User({ name, email, password, otp, otpExpires, isVerified: false });
    await user.save();
  }

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to email.' });
  } catch (e) {
    if (!user.isVerified) await User.deleteOne({ email });
    console.error("Email send error:", e.message || e);
    res.status(500).json({ message: 'Failed to send OTP. Try again.' });
  }
});

// Verify OTP route
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found.' });
  if (user.isVerified) return res.status(400).json({ message: 'Already verified.' });
  if (user.otp !== otp || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP.' });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.json({ message: 'Email verified. Signup complete.' });
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found.' });
  if (!user.isVerified) return res.status(400).json({ message: 'Please verify your email first.' });
  if (user.password !== password) return res.status(400).json({ message: 'Invalid credentials.' });

  // Generate JWT token (optional, for session)
  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: { id: user._id, name: user.name, email: user.email }
  });
});

// Get current user info (protected)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Create Blog (JWT required)
app.post('/api/blogs', authMiddleware, async (req, res) => {
  try {
    const { title, coverImage, category, content, tags, status } = req.body;
    const blog = new Blog({
      title,
      coverImage,
      category,
      content,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      status,
      author: req.user.id
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create blog', error: err.message });
  }
});

// Edit Blog (JWT required, only author)
app.put('/api/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.author.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { title, coverImage, category, content, tags, status } = req.body;
    blog.title = title ?? blog.title;
    blog.coverImage = coverImage ?? blog.coverImage;
    blog.category = category ?? blog.category;
    blog.content = content ?? blog.content;
    blog.tags = tags ? tags.split(',').map(t => t.trim()) : blog.tags;
    blog.status = status ?? blog.status;
    blog.updatedAt = new Date();
    await blog.save();
    res.json(blog);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update blog', error: err.message });
  }
});

// Delete Blog (JWT required, only author)
app.delete('/api/blogs/:id', authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.author.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await blog.deleteOne();
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete blog', error: err.message });
  }
});

// Add a comment to a blog post
app.post('/api/blogs/:id/comments', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Comment text required' });
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  const user = await User.findById(req.user.id);
  const comment = { user: user._id, name: user.name, text };
  blog.comments.push(comment);
  await blog.save();
  res.status(201).json(blog.comments[blog.comments.length - 1]);
});

// Get all comments for a blog post
app.get('/api/blogs/:id/comments', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json(blog.comments);
});

// Like/unlike a blog post
app.post('/api/blogs/:id/like', authMiddleware, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  const userId = req.user.id;
  const index = blog.likes.indexOf(userId);
  let liked;
  if (index === -1) {
    blog.likes.push(userId);
    liked = true;
  } else {
    blog.likes.splice(index, 1);
    liked = false;
  }
  await blog.save();
  res.json({ liked, likeCount: blog.likes.length });
});

// Get like count for a blog post
app.get('/api/blogs/:id/like', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json({ likeCount: blog.likes.length });
});

// Increment view count
app.post('/api/blogs/:id/view', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ views: blog.views });
  } catch (err) {
    res.status(400).json({ message: 'Failed to increment views', error: err.message });
  }
});

// Get All Blogs (dashboard, with filters, sorting, and limit)
app.get('/api/blogs', async (req, res) => {
  try {
    const { author, status, category, search, limit, sort } = req.query;
    let filter = {};
    if (author) filter.author = author;
    if (status) filter.status = status;
    if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    let query = Blog.find(filter);

    // Sorting logic
    if (sort === 'views') {
      query = query.sort({ views: -1, updatedAt: -1 });
    } else if (sort === 'new') {
      query = query.sort({ updatedAt: -1 });
    } else {
      query = query.sort({ updatedAt: -1 });
    }

    // Limit logic
    if (limit) query = query.limit(Number(limit));

    const blogs = await query;
    res.json(blogs);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch blogs', error: err.message });
  }
});

// Get Single Blog
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch blog', error: err.message });
  }
});

// Delete All Drafts (JWT required, only author)
app.delete('/api/blogs/drafts', authMiddleware, async (req, res) => {
  try {
    const result = await Blog.deleteMany({ author: req.user.id, status: 'Draft' });
    res.json({ message: 'All drafts deleted', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete drafts', error: err.message });
  }
});

// Dashboard Blog Stats
app.get('/api/blogs/stats', async (req, res) => {
  try {
    const { author } = req.query;
    if (!author) return res.status(400).json({ message: 'Author is required' });

    const totalBlogs = await Blog.countDocuments({ author });
    const totalDrafts = await Blog.countDocuments({ author, status: 'Draft' });
    const totalPublished = await Blog.countDocuments({ author, status: 'Published' });

    res.json({ totalBlogs, totalDrafts, totalPublished });
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

// Categories - static for now
const categories = [
  "Tech",
  "Lifestyle",
  "Travel",
  "Productivity",
  "Health",
  "Finance"
];

// Get All Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Tags - static for now
const tags = [
  "javascript",
  "webdev",
  "react",
  "nodejs",
  "travel",
  "lifestyle",
  "health",
  "finance",
  "productivity",
  "tutorial"
];

// Get All Tags
app.get('/api/tags', (req, res) => {
  res.json(tags);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

// Remove any static or test blog data. 
// All blog data will now come from MongoDB via the Blog model and user actions only.
