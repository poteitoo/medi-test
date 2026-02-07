import { Effect, Layer } from "effect";
import {
  CIResultParser,
  CIResultParseError,
  type ParsedCIResult,
  type ParsedTestCase,
} from "~/features/test-execution/application/ports/ci-result-parser";

/**
 * JUnit XML Parser Adapter
 *
 * JUnit XML形式のテスト結果をパースする実装
 *
 * @remarks
 * - 本実装では fast-xml-parser を使用予定（現在はスタブ）
 * - JUnit XMLフォーマット: https://llg.cubic.org/docs/junit/
 * - テストスイート（<testsuite>）とテストケース（<testcase>）を解析
 *
 * @example JUnit XML Format:
 * ```xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <testsuites>
 *   <testsuite name="LoginTests" tests="3" failures="1" skipped="0" time="1.5">
 *     <testcase name="testLoginSuccess" classname="com.example.LoginTest" time="0.5">
 *       <system-out>Login successful</system-out>
 *     </testcase>
 *     <testcase name="testLoginFailure" classname="com.example.LoginTest" time="0.8">
 *       <failure message="Expected 200, got 401">
 *         Stack trace here...
 *       </failure>
 *     </testcase>
 *     <testcase name="testLoginSkipped" classname="com.example.LoginTest">
 *       <skipped/>
 *     </testcase>
 *   </testsuite>
 * </testsuites>
 * ```
 */

/**
 * JUnit XML Parser Implementation (Stub)
 *
 * TODO: Implement actual XML parsing using fast-xml-parser
 * ```bash
 * pnpm add fast-xml-parser
 * ```
 *
 * @example
 * ```typescript
 * import { XMLParser } from "fast-xml-parser";
 *
 * const parser = new XMLParser({
 *   ignoreAttributes: false,
 *   attributeNamePrefix: "@_",
 * });
 *
 * const result = parser.parse(xmlContent);
 * ```
 */
const JUnitXMLParserImpl = {
  parseJUnitXML: (xmlContent: string) =>
    Effect.gen(function* () {
      // Stub implementation
      // TODO: Replace with actual XML parsing logic

      // Basic validation
      if (!xmlContent || xmlContent.trim().length === 0) {
        return yield* Effect.fail(
          new CIResultParseError("XML content is empty"),
        );
      }

      if (!xmlContent.includes("<testsuite")) {
        return yield* Effect.fail(
          new CIResultParseError(
            "Invalid JUnit XML format: missing <testsuite> element",
          ),
        );
      }

      // Stub: Return mock parsed result
      // 実際の実装では fast-xml-parser でパースし、
      // <testsuite> と <testcase> 要素を抽出する
      const stubResult: ParsedCIResult = {
        testSuiteName: "StubTestSuite",
        testCases: [
          {
            name: "stubTestCase1",
            className: "com.example.StubTest",
            status: "PASS",
            duration: 0.5,
          },
          {
            name: "stubTestCase2",
            className: "com.example.StubTest",
            status: "FAIL",
            duration: 0.8,
            errorMessage: "Assertion failed",
            stackTrace: "at StubTest.stubTestCase2(StubTest.java:42)",
          },
        ],
        summary: {
          total: 2,
          passed: 1,
          failed: 1,
          skipped: 0,
          duration: 1.3,
        },
      };

      return stubResult;
    }),

  parseMultipleJUnitXML: (xmlFiles: ReadonlyMap<string, string>) =>
    Effect.gen(function* () {
      const results: ParsedCIResult[] = [];

      for (const [_fileName, xmlContent] of xmlFiles) {
        const result = yield* JUnitXMLParserImpl.parseJUnitXML(xmlContent);
        results.push(result);
      }

      return results;
    }),
};

/**
 * JUnit XML Parser Layer
 *
 * CIResultParser ポートの実装を提供するレイヤー
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const parser = yield* CIResultParser;
 *   const result = yield* parser.parseJUnitXML(xmlContent);
 *   return result;
 * }).pipe(Effect.provide(JUnitXMLParserLive));
 *
 * const result = await Effect.runPromise(program);
 * ```
 */
export const JUnitXMLParserLive = Layer.succeed(
  CIResultParser,
  JUnitXMLParserImpl,
);

/**
 * Implementation Notes
 *
 * 実際の実装時の考慮事項:
 *
 * 1. XML Parsing:
 *    - fast-xml-parser を使用してXMLをJSオブジェクトに変換
 *    - attributeNamePrefix: "@_" で属性を識別
 *    - ignoreAttributes: false で属性を保持
 *
 * 2. Test Status Mapping:
 *    - <testcase> without child elements → PASS
 *    - <testcase><failure> → FAIL
 *    - <testcase><error> → FAIL
 *    - <testcase><skipped> → SKIPPED
 *
 * 3. Data Extraction:
 *    - name attribute → testCase.name
 *    - classname attribute → testCase.className
 *    - time attribute → testCase.duration
 *    - <failure message> → testCase.errorMessage
 *    - <failure> text content → testCase.stackTrace
 *    - <system-out> → testCase.systemOut
 *    - <system-err> → testCase.systemErr
 *
 * 4. Error Handling:
 *    - XML parse errors → CIResultParseError
 *    - Invalid format → CIResultParseError with descriptive message
 *    - Missing required elements → CIResultParseError
 *
 * 5. Multiple Test Suites:
 *    - Handle <testsuites> (plural) containing multiple <testsuite>
 *    - Parse each suite separately
 *    - Aggregate summary statistics
 */
