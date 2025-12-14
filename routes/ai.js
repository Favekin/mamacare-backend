const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Initialization ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: "You are a friendly maternity and pregnancy assistant. Your tone is supportive, informative, and non-judgmental. Always prioritize user safety and provide accurate, general information."
  }
});

// --- API Route ---

router.post("/chat", async (req, res) => {

  try {
    const { message } = req.body;

    // 1. Robust Input Check
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // 2. Call generateContent
    const result = await model.generateContent(message);
    
    // 3. **CRITICAL FIX: Robust Text Extraction**
    // Access the text directly from the structured response object to ensure it's captured
    const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text;


    // 4. Refined Success/Failure Logic
    if (!reply) {
      const finishReason = result.response.candidates?.[0]?.finishReason;
      
      let errorMessage = "Sorry, the AI assistant could not generate a response.";
      let statusCode = 500;

      if (finishReason === 'SAFETY') {
        errorMessage = "I'm sorry, your request was blocked by the safety filters. Please try rephrasing your message.";
        statusCode = 403;
      } else if (finishReason === 'MAX_TOKENS') {
         errorMessage = "I ran out of space to complete my answer. Please ask a shorter question.";
         statusCode = 400;
      } else {
         // Log the full response for unknown/other reasons
         console.error("Gemini Unexpected Empty Response Details:", JSON.stringify(result.response, null, 2));
      }

      return res.status(statusCode).json({ error: errorMessage });
    }

    // Success: The reply is not empty, send it back.
    res.json({ reply });
    
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ 
      error: "AI request failed due to a system or API error.", 
      details: err.message 
    });
  }
});

module.exports = router;