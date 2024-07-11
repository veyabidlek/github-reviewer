import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

interface File {
  path: string;
  content: string;
}

interface TabNavigatorProps {
  files: File[];
  onSelect: (index: number) => void;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ files, onSelect }) => {
  return (
    <Tabs onSelect={onSelect}>
      <TabList>
        {files.map((file, index) => (
          <Tab key={index}>{file.path}</Tab>
        ))}
      </TabList>
      {files.map((file, index) => (
        <TabPanel key={index}>
          <pre>{file.content}</pre>
        </TabPanel>
      ))}
    </Tabs>
  );
};

export default TabNavigator;
