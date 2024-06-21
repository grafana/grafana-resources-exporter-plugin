
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from "../plugin.json"
import { ResourceType, ResourceTypeResponse } from "../types/resourceTypes";

export const getResourceTypes = async (
    target: string,
    outputFormat: string,
    currentResourceTypes: ResourceType[],
    callback: (newResourceTypes: ResourceType[]) => void
) => {
    try {
        const types = await getBackendSrv().get<ResourceTypeResponse>(`api/plugins/${pluginJson.id}/resources/resource-types`, { target: target, outputFormat: outputFormat })

        // Re-select the resource types that were previously selected
        // If the names don't match, reset to all selected
        const currentResourceTypesMap = new Map<string, ResourceType>()
        let matchedNameCount = 0
        currentResourceTypes.forEach(type => {
            currentResourceTypesMap.set(type.name, type)
        })
        types.resources.forEach(t => {
            if (currentResourceTypesMap.has(t.name)) {
                matchedNameCount += 1
                t.selected = currentResourceTypesMap.get(t.name)!.selected
            }
        })

        if (matchedNameCount === types.resources.length) {
            return // Do nothing, types are the same. This avoids an infinite loop where resourceTypes keeps being set to the same value
        }

        if (matchedNameCount === 0) {
            types.resources.forEach(t => t.selected = true)
        }
        callback(types.resources)
    } catch (err) {
        console.log(err)
    }
}
