"use client";

import { useState } from "react";
import { useFetchDirectoryContents } from "./files";
import dynamic from "next/dynamic";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/hljs";

const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter"), {
  ssr: false,
});

export default function Home() {
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(0);
  const { fetchDirectoryContents, loading, error } =
    useFetchDirectoryContents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchDirectoryContents(url);
      let content = "";
      for (let i = 0; i < data.length; i++) {
        content += `${data[i].path}:\n ${data[i].content} \n`;
      }
      navigator.clipboard.writeText(content);
      setFiles(data);
    } catch (err) {
      console.error("Error fetching repository files:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">GitHub Repository Analyzer</h1>
        <form onSubmit={handleSubmit} className="mb-8">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter GitHub repository URL"
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
          >
            Analyze
          </button>
          <p className="mt-2 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition">
            Copy code
          </p>
        </form>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {files.length > 0 && (
          <div className="flex space-x-4">
            <div className="w-1/2 bg-gray-800 rounded-lg p-4 overflow-hidden">
              <div className="flex mb-4 overflow-x-auto">
                {files.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFile(index)}
                    className={`px-3 py-1 rounded-t-lg mr-2 ${
                      selectedFile === index
                        ? "bg-gray-700 text-white"
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    {file.path.split("/").pop()}
                  </button>
                ))}
              </div>
              <div className="h-[calc(100vh-300px)] overflow-auto">
                <SyntaxHighlighter language="javascript" style={tomorrow}>
                  {files[selectedFile]?.content || ""}
                </SyntaxHighlighter>
              </div>
            </div>
            <div className="w-1/2 bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">
                Code Analytics and Recommendations
              </h2>
              {/* Add your code analytics and recommendations here */}
              <p>
                This section will contain code analytics and recommendations for
                the selected file.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
