import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("../presentation/pages/dashboard-page.tsx"),
  route("login", "../presentation/pages/login-page.tsx"),
] satisfies RouteConfig;
