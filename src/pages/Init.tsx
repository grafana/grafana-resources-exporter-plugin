import { PluginPage } from "@grafana/runtime";
import { Button } from "@grafana/ui";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppRootProps } from "types/pluginData";

export const InitPage = (plugin: AppRootProps) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (plugin.meta !== undefined && plugin.meta.jsonData && plugin.meta.jsonData.initialized === true) {
            navigate('export');
        }
    }, [navigate, plugin.meta]);

    return (
        <PluginPage>
            <div>
                The plugin has not been configured yet. Click the button below to configure the plugin.
                <br />
                <Button onClick={() => navigate('/plugins/' + plugin.meta.id)} size="lg">Configure Plugin Here</Button>
            </div>
        </PluginPage >
    );
}
