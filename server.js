
const express = require("express");
const path = require("path");
const multer = require("multer");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const app = express();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(express.json());

const MODEL = "gemini-3.5-flash-lite";

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "script.js"));
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "AgriShield AI backend is working!"
    });
});

// AI Farming Assistant

app.post("/api/ask", async (req, res) => {
    try {
        const { question, language } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: `You are AgriShield AI,
            an agricultural assistant for Indian farmers.

            Answer in ${language || "English"}.
            Provide practical and safe farming advice.

            Question: ${question}`
        });

        res.json({ answer: response.text });

    } catch (error) {
        console.error("Farming Assistant:", error.message);

        res.status(500).json({
            error: "AI service unavailable. Please try again."
        });
    }
});

// AI Crop Doctor

app.post("/api/crop", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "Please upload a crop photo."
            });
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Upload a JPG, PNG or WebP image."
            });
        }

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: req.file.buffer.toString("base64")
                    }
                },
                {
                    text: `You are AgriShield AI Crop Doctor.

                    Analyze this crop image.

                    Answer in ${req.body.language || "English"}.

                    Provide:
                    1. Possible crop name
                    2. Suspected disease
                    3. Visible symptoms
                    4. Possible causes
                    5. Safe treatment options
                    6. Prevention measures

                    Explain uncertainty and recommend expert
                    confirmation before pesticide application.`
                }
            ]
        });

        res.json({ answer: response.text });

    } catch (error) {
        console.error("Crop Doctor:", error.message);

        res.status(500).json({
            error: "Crop analysis unavailable. Please try again."
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`AgriShield AI running at http://localhost:${PORT}`);
});

