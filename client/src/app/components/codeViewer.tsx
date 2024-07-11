import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeViewerProps {
  code: string;
  language: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  return (
    <SyntaxHighlighter language={language} style={prism}>
      {code}
    </SyntaxHighlighter>
  );
};

export default CodeViewer;
