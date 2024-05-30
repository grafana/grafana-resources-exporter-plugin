import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { useStyles2, ErrorWithStack, Spinner, CodeEditor, Tab, TabsBar, TabContent } from '@grafana/ui';
import { testIds } from '../components/testIds';
import pluginJson from '../plugin.json';

interface GeneratedFile {
  name: string;
  content: string;
  active: boolean;
}

interface BackendResponse {
  files: GeneratedFile[];
}

class FileViewer extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      exports: {files: []},
      content: "",
      loading: true,
    }
    this.exportResources();
  }

  async exportResources() {
    const exports = await getBackendSrv().post<BackendResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
      outputFormat: "hcl",
    });
    const content = exports.files[0].content
    exports.files[0].active = true
    this.setState({exports: exports.files, loading: false, content: content})
  }

  render() {
    //if (this.state.exports.error) {
    //  return <ErrorWithStack error={exports.error} title={'Unexpected error'} errorInfo={null} />;
    //}
    if (this.state.loading) {
      return <Spinner />;
    }

    const updateTab = (index: number, self: FileViewer) => {
      return () => {
        const files = []
        let content = ""
        for (let i in self.state.exports) {
          const file = self.state.exports[i]
          file.active = false
          if (i == index) {
            file.active = true
            content = file.content
          }
          files.push(file)
        }
        this.setState({exports: files, content: content})
     }
    }
    return (
      <>
        <TabsBar>
          {this.state.exports.map((file, i) => (<Tab key={i} active={file.active} label={file.name} onChangeTab={updateTab(i, this)}/>))}
        </TabsBar>
        <TabContent>
        <CodeEditor
          width="100%"
          height="500px"
          value={this.state.content}
          language="hcl"
          showLineNumbers={true}
          showMiniMap={true}
          readOnly={true}
        />
        </TabContent>
      </>
    );
  }
}
export function ExportPage() {
  const s = useStyles2(getStyles);
  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        WELCOME TO EXPORT PAGE.
        <div className={s.marginTop}>
          <FileViewer/>
        </div>
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
  textArea: css`
    font-family: monospace, monospace;
    height: 200px;
  `
});
