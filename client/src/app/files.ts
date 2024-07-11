// src/app/files.ts
import { useState } from "react";
import axios from "axios";

export const useFetchDirectoryContents = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDirectoryContents = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/repos/files",
        { url }
      );

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  return { fetchDirectoryContents, loading, error };
};
