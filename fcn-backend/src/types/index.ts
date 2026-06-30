import type { Role, UserStatus } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  role: Role;
  status: UserStatus;
}

export interface JwtAccessPayload extends AuthenticatedUser {
  type: "access";
}

export interface JwtRefreshPayload {
  id: string;
  type: "refresh";
}

export interface ApiErrorShape {
  code: string;
  message: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {
      email?: string;
      full_name?: string;
      avatar?: string;
      googleId?: string;
    }
  }
}
