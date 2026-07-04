/**
 * Identity module — public API. Other modules import authorization primitives
 * from here, never from internal files.
 */
export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_CATALOGUE,
  type Permission,
  type PermissionGrant,
} from "./rbac";
