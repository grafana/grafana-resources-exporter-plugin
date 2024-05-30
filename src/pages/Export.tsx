import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2, ErrorWithStack, Spinner, CodeEditor, RadioButtonGroup, Button, RadioButtonList } from '@grafana/ui';
import { testIds } from '../components/testIds';
import { useGeneratedFiles } from "../hooks/useGeneratedFiles";
import { saveAs } from 'file-saver';
import JSZip from "jszip";

const outputFormatOptions = [
  { label: 'HCL', value: 'hcl' },
  { label: 'JSON', value: 'json' },
];


export function ExportPage() {
  const s = useStyles2(getStyles);
  let content: React.ReactNode;

  const { files, format, setFormat, currentFile, setCurrentFile, loading, error } = useGeneratedFiles();
  if (currentFile === "" && files && files.length > 0) {
    setCurrentFile(files[0].name);
  }

  if (error) {
    content = <ErrorWithStack error={error} title={'Unexpected error'} errorInfo={null} />;
  } else if (loading) {
    content = <Spinner />;
  } else {
    content = (
      <div className={s.marginTop}>
        <RadioButtonGroup options={files!.map(f => ({ label: f.name, value: f.name }))} value={currentFile} onChange={v => setCurrentFile(v!)} />
        <CodeEditor
          width="100%"
          height="600px"
          value={files!.find(f => f.name === currentFile)?.content || ''}
          language={format}
          showLineNumbers={true}
          showMiniMap={true}
          readOnly={true}
        />
      </div>
    );
  }

  const download = () => {
    if (!files || files.length === 0) {
      return;
    }

    const archive = new JSZip();

    files!.forEach(file => {
      archive.file(file.name, file.content);
    })

    archive.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "grafana-terraform-export.zip");
    });
  };

  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        <div>
          <RadioButtonGroup options={outputFormatOptions} value={format} onChange={v => setFormat(v!)} size="md" />

          <Button icon="file-download" disabled={Boolean(error || loading)} onClick={_ => download()}>Download as zip</Button>
        </div>

        {content}
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
});
