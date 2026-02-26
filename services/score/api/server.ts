import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel serverless functions handle all methods, so we restrict to POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Missing resume or jobDescription' });
    }

    const prompt = `
      Act as an expert Applicant Tracking System (ATS). Analyze the following resume against the job description.
      Calculate a highly precise matching score on a scale of 0.0 to 10.0.
      You must respond in JSON format with exactly one key: "match_score" (a number).

      Resume: ${resume}
      Job Description: ${jobDescription}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}