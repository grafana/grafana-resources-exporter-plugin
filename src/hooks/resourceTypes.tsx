
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from "../plugin.json"
import { ResourceType, ResourceTypeResponse } from "../types/resourceTypes";

export const getResourceTypes = async (target: string, outputFormat: string, currentResourceTypes: ResourceType[], callback: any) => {
    try {
        const types = await getBackendSrv().get<ResourceTypeResponse>(`api/plugins/${pluginJson.id}/resources/resource-types`, { target: target, outputFormat: outputFormat })

        // Re-select the resource types that were previously selected
        // If the names don't match, reset to all selected
        const currentResourceTypesMap = new Map<string, ResourceType>()
        let matchedName = false
        currentResourceTypes.forEach(type => {
            currentResourceTypesMap.set(type.name, type)
        })
        types.resources.forEach(t => {
            if (currentResourceTypesMap.has(t.name)) {
                matchedName = true
                t.selected = currentResourceTypesMap.get(t.name)!.selected
            }
        })
        if (!matchedName) {
            types.resources.forEach(t => t.selected = true)
        }
        callback(types.resources)
    } catch (err) {
        console.log(err)
    }
}
