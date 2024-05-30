import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {useStyles2, ErrorWithStack, Spinner, CodeEditor, RadioButtonGroup, Button} from '@grafana/ui';
import { testIds } from '../components/testIds';
import {useGeneratedFiles} from "../hooks/useGeneratedFiles";
import {GeneratedFile} from "../types/generator";
import { saveAs } from 'file-saver';
import JSZip from "jszip";

const outputFormatOptions = [
  {label: 'HCL', value: 'hcl'},
  {label: 'JSON', value: 'json'},
];

const FileViewer = (props: {filename: string, content: string, format: string}) => {
  return (
    <>
      <h2>{props.filename}</h2>
      <CodeEditor
        width="100%"
        height="200px"
        value={props.content}
        language={props.format}
        showLineNumbers={true}
        showMiniMap={true}
        readOnly={true}
      />
    </>
  );
}

const FileViewerList = ({files, format}: {files: GeneratedFile[], format: string}) => {
  return (
    <>
      {files.map((file, i) => (<FileViewer key={i} filename={file.name} content={file.content} format={format} />))}
    </>
  );
}

export function ExportPage() {
  const s = useStyles2(getStyles);
  let content: React.ReactNode;

  const {files, format, setFormat, loading, error} = useGeneratedFiles();

  if (error) {
    content = <ErrorWithStack error={error} title={'Unexpected error'} errorInfo={null} />;
  } else if (loading) {
    content = <Spinner />;
  } else {
    content = (
      <div className={s.marginTop}>
        <FileViewerList files={files!} format={format} />
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

    archive.generateAsync({type:"blob"}).then(function(content) {
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
