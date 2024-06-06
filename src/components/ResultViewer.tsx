import React, { useState } from 'react'
import { useStyles2, Tab, TabsBar, TabContent, CodeEditor } from '@grafana/ui'
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { GeneratedFile } from '../types/generator'

interface ResultViewerProps {
    files: GeneratedFile[]
    language: string
}

export const ResultViewer = (props: ResultViewerProps) => {
    const s = useStyles2(getStyles);

    const [activeTab, setActiveTab] = useState(0)
    return (
        <div className={s.marginTop}>
          <TabsBar>
            {props.files.map((file, i) => (<Tab key={i} active={i === activeTab} label={file.name} onChangeTab={_ => { setActiveTab(i) }} />))}
          </TabsBar>
          <TabContent>
            <CodeEditor
              width="100%"
              height="500px"
              value={props.files[activeTab].content}
              language={props.language}
              showLineNumbers={true}
              showMiniMap={true}
              readOnly={true}
            />
          </TabContent>
        </div>
      );
}

const getStyles = (theme: GrafanaTheme2) => ({
    marginTop: css`
      margin-top: ${theme.spacing(2)};
    `,
});
