export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[]; // e.g., ['ADMIN', 'USER']
}
