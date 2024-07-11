/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { flattenDeep } from "lodash";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const githubToken = process.env.GITHUB_TOKEN;
let storedData: any[] = []; // Variable to store the fetched data

const ignoreFiles = new Set([
  ".gitignore",
  "package.json",
  "package-lock.json",
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
    if (response.data.type === "file") {
      return {
        path,
        content: Buffer.from(response.data.content, "base64").toString("utf-8"),
      };
    }
    return null;
  } catch (error: any) {
    throw new Error(`Error fetching file content: ${error.message}`);
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
          return fetchDirectoryContents(owner, repo, item.path);
        } else if (item.type === "file") {
          return fetchFileContent(owner, repo, item.path);
        }
        return null;
      })
    );
    return files.filter((file: any) => file !== null);
  } catch (error: any) {
    throw new Error(`Error fetching directory contents: ${error.message}`);
  }
};

app.use(express.json());

app.post("/api/repos/files", async (req, res) => {
  const { url } = req.body;

  try {
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }
    const { owner, repo } = parseGitHubUrl(url);
    const files = await fetchDirectoryContents(owner, repo);
    const flattenedFiles = flattenDeep(files);
    storedData = flattenedFiles; // Store the data in the variable
    res.json(flattenedFiles);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching repository files",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Example fetch and store on server start
  const exampleUrl = "https://github.com/veyabidlek/github-reviewer";
  const { owner, repo } = parseGitHubUrl(exampleUrl);
  fetchDirectoryContents(owner, repo)
    .then((data) => {
      storedData = data;
      console.log(data);
    })
    .catch((error) => console.error(`Error: ${error.message}`));
});
