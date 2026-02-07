import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("../presentation/pages/dashboard-page.tsx"),
  route("login", "../presentation/pages/login-page.tsx"),
  route("test-cases", "../presentation/pages/test-cases-page.tsx"),
  route(
    "test-cases/:caseId",
    "../presentation/pages/test-case-detail-page.tsx",
  ),
  route("test-scenarios", "../presentation/pages/test-scenarios-page.tsx"),

  // API Routes
  route("api/test-cases", "./routes/api.test-cases.ts"),
  route(
    "api/test-cases/:caseId/revisions",
    "./routes/api.test-cases.$caseId.revisions.ts",
  ),
  route(
    "api/test-cases/revisions/:revisionId/submit-for-review",
    "./routes/api.test-cases.revisions.$revisionId.submit-for-review.ts",
  ),
  route("api/approvals", "./routes/api.approvals.ts"),
] satisfies RouteConfig;
