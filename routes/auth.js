// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed
    });

    res.json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// LOGIN (email/password)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // If user was created via Google and has no password
    if (!user.password) return res.status(400).json({ message: "Please sign in with Google" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GOOGLE SIGN IN / SIGN UP
// Expects body: { idToken: "<google id_token from client>" }
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // payload fields: email, email_verified, name, picture, sub (google id)
    const { sub: googleId, email, name, picture } = payload;

    if (!email) return res.status(400).json({ message: "Google account has no email" });

    // Try to find by googleId OR email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create a new user — no password required
      user = await User.create({
        email,
        googleId,
        name,
        avatar: picture,
        password: null,
      });
    } else {
      // If a user was created by email/password earlier, attach googleId for future logins
      if (!user.googleId) {
        user.googleId = googleId;
        user.name = user.name || name;
        user.avatar = user.avatar || picture;
        await user.save();
      }
    }

    // Create JWT (same secret & expiry as your email/password login)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token, userId: user._id, email: user.email, name: user.name, avatar: user.avatar });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

// VERIFY TOKEN
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.json({ valid: false });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.json({ valid: false });
      res.json({ valid: true, userId: decoded.id });
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ valid: false });
  }
});

module.exports = router;
