import { GenerateResponse } from "../types/generator";
import { useAsync } from "react-use";
import { getBackendSrv } from "@grafana/runtime";
import pluginJson from "../plugin.json";
import { useState } from "react";

export function useGeneratedFiles() {
    const [outputFormat, setOutputFormat] = useState("hcl");
    const [currentFile, setCurrentFile] = useState("");
    const response = useAsync(async () => {
        return await getBackendSrv().post<GenerateResponse>(`api/plugins/${pluginJson.id}/resources/generate`, {
            outputFormat: outputFormat,
        });
    }, [outputFormat]);

    return {
        files: response.value?.files,
        format: outputFormat,
        setFormat: setOutputFormat,
        currentFile: currentFile,
        setCurrentFile: setCurrentFile,
        loading: response.loading,
        error: response.error,
    };
}
