
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from "../plugin.json"
import { ResourceType, ResourceTypeResponse } from "../types/resourceTypes";

export const getResourceTypes = async (target: string, outputFormat: string, callback: any) => {
    try {
        const types = await getBackendSrv().get<ResourceTypeResponse>(`api/plugins/${pluginJson.id}/resources/resource-types`, { target: target, outputFormat: outputFormat })
        const typeList: ResourceType[] = []
        types.resources.forEach(type => {
            type.selected = true
            typeList.push(type)
        })
        callback(typeList)
    } catch (err) {
        console.log(err)
    }
}
