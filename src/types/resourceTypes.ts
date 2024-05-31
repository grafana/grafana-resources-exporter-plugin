export interface ResourceType {
    name: string
    hasLister: boolean
}

export interface ResourceTypeResponse {
    resources: ResourceType[];
}
