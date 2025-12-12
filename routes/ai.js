const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Initialize Gemini ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

// --- CHAT ROUTE ---
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call Gemini
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      systemInstruction: "You are a friendly maternity and pregnancy assistant."
    });

    // Extract Reply
    const reply =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("Gemini returned empty response:", result);
      return res.status(500).json({ error: "AI returned no response." });
    }

    res.json({ reply });

  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: "AI request failed.",
      details: err.message
    });
  }
});

module.exports = router;
