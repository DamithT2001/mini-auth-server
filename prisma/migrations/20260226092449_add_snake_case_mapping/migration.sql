-- Rename tables to snake_case
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Role" RENAME TO "roles";
ALTER TABLE "UserRole" RENAME TO "user_roles";
ALTER TABLE "ClientApplication" RENAME TO "client_applications";
ALTER TABLE "AuthorizationCode" RENAME TO "authorization_codes";
ALTER TABLE "RefreshToken" RENAME TO "refresh_tokens";
ALTER TABLE "LoginLog" RENAME TO "login_logs";

-- Rename columns in users
ALTER TABLE "users" RENAME COLUMN "isEmailVerified" TO "is_email_verified";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename columns in user_roles
ALTER TABLE "user_roles" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "user_roles" RENAME COLUMN "roleId" TO "role_id";

-- Rename columns in client_applications
ALTER TABLE "client_applications" RENAME COLUMN "clientId" TO "client_id";
ALTER TABLE "client_applications" RENAME COLUMN "clientSecret" TO "client_secret";
ALTER TABLE "client_applications" RENAME COLUMN "redirectUris" TO "redirect_uris";
ALTER TABLE "client_applications" RENAME COLUMN "createdAt" TO "created_at";

-- Rename columns in authorization_codes
ALTER TABLE "authorization_codes" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "authorization_codes" RENAME COLUMN "clientId" TO "client_id";
ALTER TABLE "authorization_codes" RENAME COLUMN "expiresAt" TO "expires_at";

-- Rename columns in refresh_tokens
ALTER TABLE "refresh_tokens" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "refresh_tokens" RENAME COLUMN "clientId" TO "client_id";
ALTER TABLE "refresh_tokens" RENAME COLUMN "expiresAt" TO "expires_at";

-- Rename columns in login_logs
ALTER TABLE "login_logs" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "login_logs" RENAME COLUMN "ipAddress" TO "ip_address";
ALTER TABLE "login_logs" RENAME COLUMN "userAgent" TO "user_agent";
ALTER TABLE "login_logs" RENAME COLUMN "createdAt" TO "created_at";
