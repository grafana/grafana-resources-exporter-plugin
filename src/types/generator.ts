export interface GeneratedFile {
    name: string;
    content: string
}

export interface GenerateResponse {
    files: GeneratedFile[];
}
