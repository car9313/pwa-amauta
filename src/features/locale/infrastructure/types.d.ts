import type { EsLAResources } from "./i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: EsLAResources;
    returnObjects: true;
  }
}
