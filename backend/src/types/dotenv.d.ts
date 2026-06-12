declare module "dotenv" {
  export function config(opts?: {
    path?: string;
  }): { parsed?: Record<string, string> } | void;
}
