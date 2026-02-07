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
  route("test-cases", "../presentation/pages/test-cases-page.tsx"),
  route("test-cases/:caseId", "../presentation/pages/test-case-detail-page.tsx"),
  route("test-scenarios", "../presentation/pages/test-scenarios-page.tsx"),
] satisfies RouteConfig;
