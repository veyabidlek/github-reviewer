/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
const githubToken = process.env.GITHUB_TOKEN;
let storedData: any[] = []; // Variable to store the fetched data

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

app.use(express.json());

app.post("/api/repos/files", async (req, res) => {
  const { url } = req.body;

  try {
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }
    const { owner, repo } = parseGitHubUrl(url);
    const files = await fetchDirectoryContents(owner, repo);
    const flattenedFiles = flattenFileStructure(files);
    console.log("Flattened files:", JSON.stringify(flattenedFiles, null, 2));
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
      console.log(JSON.stringify(storedData, null, 2));
    })
    .catch((error) => console.error(`Error: ${error.message}`));
});
