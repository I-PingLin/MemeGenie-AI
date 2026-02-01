
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });

  async getMagicCaptions(base64Image: string): Promise<string[]> {
    const prompt = "Analyze this image and provide 5 hilarious, short meme captions that fit the context. Return them as a JSON array of strings.";
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const jsonStr = response.text;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error fetching captions:", error);
      return ["When the AI fails", "Error 404: Humor not found", "Just a normal day", "Wait, what?", "Interesting..."];
    }
  }

  async editImage(base64Image: string, editPrompt: string): Promise<string> {
    // Strategy: Use Gemini to describe the desired new image based on the original and the edit instruction
    const analysisPrompt = `Look at this image and describe a new version of it based on this instruction: "${editPrompt}". Provide a detailed prompt for an image generator.`;
    
    try {
      const analysis = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: analysisPrompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } }
            ]
          }
        ]
      });

      const generationPrompt = analysis.text;

      const result = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: generationPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1'
        }
      });

      return `data:image/png;base64,${result.generatedImages[0].image.imageBytes}`;
    } catch (error) {
      console.error("Error editing image:", error);
      throw error;
    }
  }

  async analyzeImage(base64Image: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: "Describe what is happening in this image in detail." },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } }
            ]
          }
        ]
      });
      return response.text;
    } catch (error) {
      console.error("Error analyzing image:", error);
      return "Unable to analyze image at this time.";
    }
  }
}
