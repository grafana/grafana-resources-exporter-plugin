import React, {useState, useEffect } from 'react';
import { useAsyncFn } from "react-use";
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage, getBackendSrv } from '@grafana/runtime';
import { TextArea, useStyles2, ErrorWithStack } from '@grafana/ui';
import { testIds } from '../components/testIds';
import pluginJson from '../plugin.json';

const FileViewer = (props: any) => {
  const s = useStyles2(getStyles);
  return <div>
    <h2>&nbsp;</h2>
    <h2>{props.filename}</h2>
    <TextArea className={s.textArea}>{props.content}</TextArea>
  </div>
}

//[HCL vs JSON]
//cat '{"outputFormat": "hcl"}' | http POST ':3000/api/plugins/grafana-grafanaascode-app/resources/generate' 'Authorization: Bearer glsa_WPVp09xSfwVJrJL4CS4ykjHjgATJKSEO_1068d519'

interface BackendResponse {
  files: Map<string, string>
}

const FileViewerList = (props: any) => {
  const backendSrv = getBackendSrv();
  const [exports, setExports] = useState<BackendResponse>({files: new Map<string, string>()})
  const [format] = useState("hcl")
  const [error, setError] = useState(null)

  const [_, doFetch] = useAsyncFn(async () => {
    try {
      console.log("ABOUT TO POST", pluginJson.id)
      console.log(`URL: api/plugins/${pluginJson.id}/resources/generate`)
      const results = await backendSrv.post<BackendResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
        outputFormat: format,
      });
      console.log("POSTED")
      setExports(results);
      console.log(results)
      return results;
    } catch (error: any) {
      setError(error);
      return error;
    }
  });

  useEffect(() => {

    if (exports.files.size === 0) {
      console.log("FETCHING")
      doFetch();
      console.log("DONE FETCH")
    }
  }, [exports, doFetch]);

  let response: React.ReactElement[] = [];
  if (error != null) {
    console.log(error)
    response.push(<ErrorWithStack error={error} title={'Unexpected error'} errorInfo={null} />)
  }
  if (exports != null && exports.files.size > 0) {
    for (let filename in exports.files ) {
      const content = exports.files.get(filename) || "";
      const length = content.length;
      const height = length;
      console.log(filename, content);
      response.push(<FileViewer filename={filename} content={content} height={height} length={length}/>);
    }
  }
  return React.createElement("div", {}, ...response)
}

export function ExportPage() {
  const s = useStyles2(getStyles);
console.log("EXPORT PAGE")
  return (
    <PluginPage>
      <div data-testid={testIds.exportPage.container}>
        WELCOME TO EXPORT PAGE.
        <div className={s.marginTop}>
          <FileViewerList/>
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

/* const sampleData = {
  "files": {
    "localhost-imports.tf": "import {\n  provider = grafana.localhost\n  to       = grafana_dashboard.localhost_0_ddn212jnthc00a\n  id       = \"0:ddn212jnthc00a\"\n}\n\nimport {\n  provider = grafana.localhost\n  to       = grafana_notification_policy.localhost_0_policy\n  id       = \"0:policy\"\n}\n",
    "localhost-provider.tf": "provider \"grafana\" {\n  alias = \"localhost\"\n  url   = \"http://localhost:3000\"\n  auth  = \"glsa_WPVp09xSfwVJrJL4CS4ykjHjgATJKSEO_1068d519\"\n}\n",
    "localhost-resources.tf": "# __generated__ by Terraform\n# Please review these resources and move them into your main configuration files.\n\n# __generated__ by Terraform from \"0:ddn212jnthc00a\"\nresource \"grafana_dashboard\" \"localhost_0_ddn212jnthc00a\" {\n  provider = grafana.localhost\n  config_json = jsonencode({\n    annotations = {\n      list = [{\n        builtIn = 1\n        datasource = {\n          type = \"grafana\"\n          uid  = \"-- Grafana --\"\n        }\n        enable    = true\n        hide      = true\n        iconColor = \"rgba(0, 211, 255, 1)\"\n        name      = \"Annotations \u0026 Alerts\"\n        type      = \"dashboard\"\n      }]\n    }\n    description          = \"Oh, thank you!\"\n    editable             = true\n    fiscalYearStartMonth = 0\n    graphTooltip         = 0\n    links                = []\n    panels = [{\n      datasource = {\n        type = \"grafana\"\n        uid  = \"grafana\"\n      }\n      fieldConfig = {\n        defaults = {\n          color = {\n            mode = \"palette-classic\"\n          }\n          custom = {\n            axisBorderShow   = false\n            axisCenteredZero = false\n            axisColorMode    = \"text\"\n            axisLabel        = \"\"\n            axisPlacement    = \"auto\"\n            barAlignment     = 0\n            drawStyle        = \"line\"\n            fillOpacity      = 0\n            gradientMode     = \"none\"\n            hideFrom = {\n              legend  = false\n              tooltip = false\n              viz     = false\n            }\n            insertNulls       = false\n            lineInterpolation = \"linear\"\n            lineWidth         = 1\n            pointSize         = 5\n            scaleDistribution = {\n              type = \"linear\"\n            }\n            showPoints = \"auto\"\n            spanNulls  = false\n            stacking = {\n              group = \"A\"\n              mode  = \"none\"\n            }\n            thresholdsStyle = {\n              mode = \"off\"\n            }\n          }\n          mappings = []\n          thresholds = {\n            mode = \"absolute\"\n            steps = [{\n              color = \"green\"\n              value = null\n              }, {\n              color = \"red\"\n              value = 80\n            }]\n          }\n        }\n        overrides = []\n      }\n      gridPos = {\n        h = 8\n        w = 12\n        x = 0\n        y = 0\n      }\n      options = {\n        legend = {\n          calcs       = []\n          displayMode = \"list\"\n          placement   = \"bottom\"\n          showLegend  = true\n        }\n        tooltip = {\n          maxHeight = 600\n          mode      = \"single\"\n          sort      = \"none\"\n        }\n      }\n      targets = [{\n        datasource = {\n          type = \"datasource\"\n          uid  = \"grafana\"\n        }\n        queryType = \"randomWalk\"\n        refId     = \"A\"\n      }]\n      title = \"Beautiful panel, isn't it?\"\n      type  = \"timeseries\"\n    }]\n    schemaVersion = 39\n    tags          = []\n    templating = {\n      list = []\n    }\n    time = {\n      from = \"now-6h\"\n      to   = \"now\"\n    }\n    timeRangeUpdatedDuringEditOrView = false\n    timepicker                       = {}\n    timezone                         = \"browser\"\n    title                            = \"Beautiful dashboard\"\n    uid                              = \"ddn212jnthc00a\"\n    weekStart                        = \"\"\n  })\n  org_id = jsonencode(0)\n}\n\n# __generated__ by Terraform from \"0:policy\"\nresource \"grafana_notification_policy\" \"localhost_0_policy\" {\n  provider           = grafana.localhost\n  contact_point      = \"grafana-default-email\"\n  disable_provenance = true\n  group_by           = [\"grafana_folder\", \"alertname\"]\n  org_id             = jsonencode(0)\n}\n",
    "provider.tf": "terraform {\n  required_providers {\n    grafana = {\n      source  = \"grafana/grafana\"\n      version = \"3.0.0\"\n    }\n  }\n}\n"
  }
};
 */
