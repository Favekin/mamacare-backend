const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY missing");
      return res.status(500).json({ error: "AI configuration error" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
        "You are a friendly maternity and pregnancy assistant. Provide supportive, general health information only. Do not give diagnoses or prescriptions."
    });

    const result = await model.generateContent(message);

    const reply =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("Empty Gemini response:", result.response);
      return res.status(500).json({
        error: "AI could not generate a response"
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error("🔥 Gemini API error:", err);
    res.status(500).json({
      error: "AI request failed",
      details: err.message
    });
  }
});

module.exports = router;
