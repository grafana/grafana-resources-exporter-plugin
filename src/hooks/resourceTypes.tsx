
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from "../plugin.json"
import { ResourceType, ResourceTypeResponse } from "../types/resourceTypes";

export const getResourceTypes = async (callback: any) => {
    try {
        const types = await getBackendSrv().get<ResourceTypeResponse>(`api/plugins/${pluginJson.id}/resources/resource-types`)
        const typeList: ResourceType[] = []
        types.resources.filter(res => res.hasLister).forEach(type => {
            type.selected = true
            typeList.push(type)
        })
        console.log("TYPES", typeList)
        callback(typeList)
    } catch (err) {
        console.log(err)
    }
}
