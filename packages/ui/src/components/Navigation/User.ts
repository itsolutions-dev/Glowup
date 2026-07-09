export type UserStatus = "online" | "offline" | "busy" | "away";

export default interface UserProps {
  name: string;
  email: string;
  status?: UserStatus | null;
}
