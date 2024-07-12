/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import FormData from "form-data";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

const githubToken = process.env.GITHUB_TOKEN;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const copyleaksApiKey = process.env.COPYLEAKS_API_KEY;
const copyleaksEmail = process.env.COPYLEAKS_EMAIL;

interface FeedbackResponse {
  rating: number;
  pros: string;
  cons: string;
  recommendation: string;
}

async function generateResponse(content: string): Promise<FeedbackResponse> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant designed to output JSON. Analyze the following code and give rating out of 10, give recommendation and general feedback. The answer should always be in the following format
          {
          "rating": 7,
          "pros": "Your code has the following pros: ...",
          "cons": "Your code has the following cons: ...",
          "recommendation": "recommendation*"
          }`,
        },
        { role: "user", content: `${content}` },
      ],
      model: "gpt-4-0125-preview",
      response_format: { type: "json_object" },
    });

    const data = completion.choices[0].message.content;
    if (data) {
      const parsedData = JSON.parse(data) as FeedbackResponse;
      return parsedData;
    } else {
      throw new Error("No content in the response");
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

app.post("/api/analyze", async (req, res) => {
  const { content } = req.body;
  try {
    const analysis = await generateResponse(content);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({
      message: "Error analyzing code",
      error: error.message,
    });
  }
});

const ignoreFiles = new Set([
  ".gitignore",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "eslint.config.mjs",
  "favicon.ico",
  ".DS_Store",
  ".eslintrc.json",
  "next.config.mjs",
  "postcss.config.mjs",
  "vercel.svg",
  "next.svg",
  "tailwind.config.ts",
]);

const parseGitHubUrl = (url: string) => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }
  return { owner: match[1], repo: match[2] };
};

const fetchFileContent = async (owner: string, repo: string, path: string) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );
    if (response.data.type === "file" && !ignoreFiles.has(response.data.name)) {
      const content = Buffer.from(response.data.content, "base64").toString(
        "utf-8"
      );
      return { path, content };
    }
    return null;
  } catch (error: any) {
    console.error(`Error fetching file content for ${path}: ${error.message}`);
    throw error;
  }
};

const fetchDirectoryContents = async (
  owner: string,
  repo: string,
  path: string = ""
): Promise<any> => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );
    const files = await Promise.all(
      response.data.map(async (item: any) => {
        if (item.type === "dir") {
          const subDirContents = await fetchDirectoryContents(
            owner,
            repo,
            item.path
          );
          return { [item.path]: subDirContents };
        } else if (item.type === "file") {
          return fetchFileContent(owner, repo, item.path);
        }
        return null;
      })
    );
    return files.filter((file: any) => file !== null);
  } catch (error: any) {
    console.error(
      `Error fetching directory contents for ${path}: ${error.message}`
    );
    throw error;
  }
};

const flattenFileStructure = (files: any[]): any[] => {
  return files.reduce((acc: any[], file: any) => {
    if (file && typeof file === "object") {
      if (file.path && file.content) {
        acc.push(file);
      } else {
        Object.values(file).forEach((subFile: any) => {
          acc.push(...flattenFileStructure(subFile));
        });
      }
    }
    return acc;
  }, []);
};

app.post("/api/repos/files", async (req, res) => {
  const { url } = req.body;

  try {
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }
    const { owner, repo } = parseGitHubUrl(url);
    const files = await fetchDirectoryContents(owner, repo);
    const flattenedFiles = flattenFileStructure(files);

    res.json(flattenedFiles);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching repository files",
      error: error.message,
    });
  }
});

async function getCopyleaksToken() {
  try {
    const response = await axios.post(
      "https://id.copyleaks.com/v3/account/login/api",
      {
        email: copyleaksEmail,
        key: copyleaksApiKey,
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Copyleaks token:", error);
    throw error;
  }
}

async function checkPlagiarism(content: string) {
  try {
    const token = await getCopyleaksToken();
    const scanId = `scan_${Date.now()}`;

    const formData = new FormData();
    formData.append("file", Buffer.from(content), {
      filename: "content.txt",
      contentType: "text/plain",
    });

    const response = await axios.put(
      `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Start the scan
    await axios.patch(
      "https://api.copyleaks.com/v3/scans/start",
      { scanId: [scanId] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { scanId };
  } catch (error) {
    console.error("Error checking plagiarism:", error);
    throw error;
  }
}

app.post("/api/check-plagiarism", async (req, res) => {
  const { content } = req.body;
  try {
    const result = await checkPlagiarism(content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Error checking plagiarism",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
