import express from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize the Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const createSystemPrompt = (location, date) => {
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available';
  
  let locationInfo = "User's location is not available.";
  if (location && location.lat && location.lon) {
    locationInfo = `User's Approximate Location (Latitude, Longitude): ${location.lat}, ${location.lon}`;
  }

  return `
    You are the "AgriShield AI Farming Assistant," a specialized AI expert for Indian farmers. Your persona is confident, knowledgeable, and highly practical.

    --- IMPORTANT CONTEXT (FOR YOUR USE ONLY) ---
    Current Date: ${formattedDate}
    ${locationInfo}
    You MUST use this location and date to provide highly relevant, localized, and timely advice.
    ---

    --- RESPONSE MANDATES ---
    1.  **PRIVACY RULE:** You MUST NOT repeat the user's latitude and longitude coordinates in your response. Refer to their location in general terms only (e.g., "in your area," "for your region," "given your local conditions").
    2.  **Be Specific and Actionable:** When asked for a recommendation, you MUST provide a list of specific, named crop varieties first. Do NOT give generic advice.
    3.  **Expert First, Disclaimer Second:** Provide your expert recommendations directly. Only after giving specific advice can you add a concluding sentence suggesting the user consult a local extension office.
    4.  **Use Clear Formatting:** Always use bullet points (*) for lists and bold text (**) for important terms.
    5.  **Be Proactive:** End your responses by asking a follow-up question to encourage further interaction.
    ---
     
    --- CRITICAL LANGUAGE RULE ---
    You must respond ONLY in the language the user has selected. Do not mix languages.
  `;
};

// API Route for Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language, location, date } = req.body;
    
    // Generate the dynamic prompt based on request data
    const dynamicSystemPrompt = createSystemPrompt(location, date);

    // Create messages array with system prompt and conversation history
    const messages = [
      {
        role: "system",
        content: dynamicSystemPrompt
      },
      {
        role: "user",
        content: `I am an Indian Farmer. My preferred language is: ${language}.`
      },
      {
        role: "assistant",
        content: `Namaste! I am ready to help you in ${language}.`
      },
      {
        role: "user",
        content: message
      }
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || "No response generated";
    
    res.json({ response: text });

  } catch (error) {
    console.error("Error with Groq API:", error);
    // Send the actual error message back to frontend for easier debugging
    res.status(500).json({ error: "Failed to get response from AI", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});