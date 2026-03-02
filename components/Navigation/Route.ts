export default interface Route {
  name: string;
  component: React.ComponentType<any>;
  icon?: string;
  options?: object;
}
