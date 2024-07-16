export interface GeneratedFile {
    name: string
    content: string
}

export interface GenerateRequest {
    target: string
    outputFormat: string
    onlyResources: string[]
}

export interface GenerateResponse {
    files: GeneratedFile[];
    warnings?: string[];
}
