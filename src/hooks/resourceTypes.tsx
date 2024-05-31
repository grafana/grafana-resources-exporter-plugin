
import { getBackendSrv } from '@grafana/runtime';
import pluginJson from "../plugin.json"
import {ResourceTypeResponse} from "../types/resourceTypes";

export const getResourceTypes = async(callback: any) => {
    try {
        const types = await getBackendSrv().get<ResourceTypeResponse>(`api/plugins/${pluginJson.id}/resources/resource-types`)
        const typeList: string[] = []
        types.resources.forEach(type=>{
            if (type.hasLister) {
                typeList.push(type.name)
            }
        })
        callback(typeList)
    } catch (err) {
        console.log(err)
    }
}
