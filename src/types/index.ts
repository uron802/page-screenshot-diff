export interface Screenshot {
    url: string;
    filename: string;
}

export interface Config {
    output_directory: string;
    screenshots: Screenshot[];
}