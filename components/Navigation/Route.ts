import type { ComponentType } from "react";

export default interface Route {
  name: string;
  component: ComponentType<any>;
  icon?: string;
  options?: object;
}
