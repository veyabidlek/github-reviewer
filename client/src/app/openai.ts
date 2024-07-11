import axios from "axios";

interface FeedbackResponse {
  rating: number;
  pros: string;
  cons: string;
  recommendation: string;
}

export async function generateResponse(
  content: string
): Promise<FeedbackResponse> {
  try {
    const response = await axios.post("http://localhost:8000/api/analyze", {
      content,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}
