export default interface Route {
  name: String;
  component: React.ComponentType<any>;
  icon?: string;
  options?: object;
}
