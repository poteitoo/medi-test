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
  route("releases", "../presentation/pages/releases-page.tsx"),
  route("releases/:releaseId", "../presentation/pages/release-detail-page.tsx"),
  route("test-runs/:runId", "../presentation/pages/test-run-detail-page.tsx"),

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
  route("api/releases", "./routes/api.releases.ts"),
  route(
    "api/releases/:releaseId/baselines",
    "./routes/api.releases.$releaseId.baselines.ts",
  ),
  route(
    "api/releases/:releaseId/gate-evaluation",
    "./routes/api.releases.$releaseId.gate-evaluation.ts",
  ),
  route(
    "api/releases/:releaseId/waivers",
    "./routes/api.releases.$releaseId.waivers.ts",
  ),
  route("api/test-runs", "./routes/api.test-runs.ts"),
  route("api/test-runs/:runId", "./routes/api.test-runs.$runId.ts"),
  route(
    "api/test-runs/:runId/items/:itemId/results",
    "./routes/api.test-runs.$runId.items.$itemId.results.ts",
  ),
] satisfies RouteConfig;
