import React, { useEffect, useRef, useState } from 'react'
import { Tab, TabsBar, TabContent, CodeEditor } from '@grafana/ui'
import { GeneratedFile } from '../types/generator'

interface ResultViewerProps {
  files: GeneratedFile[]
  height: string
}

const fileToLanguage = (file: string): string => {
  switch (file.split(".").pop()) {
    case "json":
      return "json";
    case "tf":
    case "hcl":
      return "hcl";
    case "yml":
    case "yaml":
      return "yaml";
    default:
      return "plaintext";
  }
}

export const ResultViewer = (props: ResultViewerProps) => {
  const [tabsHeight, setTabsHeight] = useState(0)
  const tabsRef = useRef(null)

  useEffect(() => {
    const currentRef = tabsRef.current as unknown as HTMLElement;
    setTabsHeight(currentRef.clientHeight)
  }, [tabsRef])


  const [activeTab, setActiveTab] = useState(0)
  return (
    <div>
      <TabsBar ref={tabsRef}>
        {props.files.map((file, i) => (<Tab key={i} active={i === activeTab} label={file.name} onChangeTab={_ => { setActiveTab(i) }} />))}
      </TabsBar>
      <TabContent>
        <CodeEditor
          width="100%"
          height={`calc(${props.height} - ${tabsHeight}px)`}
          value={props.files[activeTab].content}
          language={fileToLanguage(props.files[activeTab].name)}
          showLineNumbers={true}
          showMiniMap={true}
          readOnly={true}
        />
      </TabContent>
    </div>
  );
}
