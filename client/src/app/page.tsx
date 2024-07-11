"use client";

import { useState } from "react";
import { useFetchDirectoryContents } from "./files";
import dynamic from "next/dynamic";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { FiGithub, FiCode, FiEye, FiEyeOff } from "react-icons/fi";

const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter"), {
  ssr: false,
});

export default function Home() {
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(0);
  const [isCodeVisible, setIsCodeVisible] = useState(true);
  const { fetchDirectoryContents, loading, error } =
    useFetchDirectoryContents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchDirectoryContents(url);
      setFiles(data);
    } catch (err) {
      console.error("Error fetching repository files:", err);
    }
  };

  const toggleCodeVisibility = () => {
    setIsCodeVisible(!isCodeVisible);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
            GitHub Repository Analyzer
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Analyze your GitHub repositories with ease. Get insights and
            recommendations to improve your code quality.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex items-center max-w-3xl mx-auto bg-gray-800 rounded-full overflow-hidden shadow-lg">
            <div className="p-4 bg-gray-700">
              <FiGithub className="text-pink-400" size={24} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter GitHub repository URL"
              className="flex-grow p-4 bg-gray-800 text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition duration-300"
            >
              Analyze
            </button>
          </div>
        </form>

        {loading && (
          <p className="text-center text-2xl animate-pulse">
            Analyzing repository...
          </p>
        )}
        {error && (
          <p className="text-center text-2xl text-red-400">Error: {error}</p>
        )}

        {files.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-700">
              <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Repository Analysis
              </h2>
              <button
                onClick={toggleCodeVisibility}
                className="flex items-center px-4 py-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-300"
              >
                {isCodeVisible ? (
                  <>
                    <FiEyeOff className="mr-2" /> Hide Code
                  </>
                ) : (
                  <>
                    <FiEye className="mr-2" /> Show Code
                  </>
                )}
              </button>
            </div>
            <div className="flex">
              {isCodeVisible && (
                <div className="w-1/2 p-6 border-r border-gray-700">
                  <div className="flex mb-4 overflow-x-auto">
                    {files.map((file, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedFile(index)}
                        className={`px-3 py-1 rounded-full mr-2 transition duration-300 ${
                          selectedFile === index
                            ? "bg-pink-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        <FiCode className="inline-block mr-1" />
                        {file.path.split("/").pop()}
                      </button>
                    ))}
                  </div>
                  <div className="h-[calc(100vh-400px)] overflow-auto">
                    <SyntaxHighlighter
                      language="javascript"
                      style={tomorrow}
                      customStyle={{ background: "#1f2937" }}
                    >
                      {files[selectedFile]?.content || ""}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}
              <div className={`${isCodeVisible ? "w-1/2" : "w-full"} p-6`}>
                <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  Code Analytics and Recommendations
                </h3>
                <p className="text-gray-300">
                  This section will contain code analytics and recommendations
                  for the selected file.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
