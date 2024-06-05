
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from "../plugin.json"
import { ResourceType, ResourceTypeResponse } from "../types/resourceTypes";

export const getResourceTypes = async (outputFormat: string, callback: any) => {
    try {
        const types = await getBackendSrv().get<ResourceTypeResponse>(`api/plugins/${pluginJson.id}/resources/resource-types`, { outputFormat: outputFormat })
        const typeList: ResourceType[] = []
        types.resources.forEach(type => {
            type.selected = true
            typeList.push(type)
        })
        console.log("TYPES", typeList)
        callback(typeList)
    } catch (err) {
        console.log(err)
    }
}
