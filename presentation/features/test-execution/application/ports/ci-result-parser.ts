import { Context, Effect } from "effect";

/**
 * CIResultParser Port
 *
 * CI/CDパイプラインから出力されるテスト結果ファイル（JUnit XML等）を
 * パースして、システムのテスト結果データに変換するポート
 *
 * @remarks
 * - JUnit XML形式をサポート
 * - 将来的に他のフォーマット（TAP, xUnit等）にも対応可能
 */

export type ParsedCIResult = {
  readonly testSuiteName: string;
  readonly testCases: readonly ParsedTestCase[];
  readonly summary: {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
    readonly duration?: number; // seconds
  };
};

export type ParsedTestCase = {
  readonly name: string;
  readonly className?: string;
  readonly status: "PASS" | "FAIL" | "SKIPPED";
  readonly duration?: number; // seconds
  readonly errorMessage?: string;
  readonly stackTrace?: string;
  readonly systemOut?: string;
  readonly systemErr?: string;
};

export class CIResultParseError extends Error {
  readonly _tag = "CIResultParseError";
  constructor(
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message);
    this.name = "CIResultParseError";
  }
}

/**
 * CIResultParser Service Tag
 *
 * @example
 * ```typescript
 * const parseResults = Effect.gen(function* () {
 *   const parser = yield* CIResultParser;
 *   const result = yield* parser.parseJUnitXML(xmlContent);
 *   return result;
 * });
 * ```
 */
export class CIResultParser extends Context.Tag("CIResultParser")<
  CIResultParser,
  {
    /**
     * JUnit XML形式のテスト結果をパース
     *
     * @param xmlContent - JUnit XML文字列
     * @returns パース済みのテスト結果
     */
    readonly parseJUnitXML: (
      xmlContent: string,
    ) => Effect.Effect<ParsedCIResult, CIResultParseError>;

    /**
     * 複数のJUnit XMLファイルをパース
     *
     * @param xmlFiles - ファイル名とコンテンツのマップ
     * @returns パース済みのテスト結果の配列
     */
    readonly parseMultipleJUnitXML: (
      xmlFiles: ReadonlyMap<string, string>,
    ) => Effect.Effect<readonly ParsedCIResult[], CIResultParseError>;
  }
>() {}
