import * as assert from "assert";
import {
  SupportSessionService,
  validateSupportReport
} from "../../services/support/SupportSessionService";

suite("Sanitized Support Session", () => {
  const environment = {
    extensionVersion: "2.4.0",
    vscodeVersion: "1.101.0",
    platform: "linux" as NodeJS.Platform,
    architecture: "x64"
  };

  test("records only allowlisted structured fields", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.record({
      name: "operation_failed",
      operation: "generate_commit",
      provider: "openai",
      modelKind: "built_in",
      outcome: "failure",
      errorCategory: "model_quota",
      httpStatus: 429,
      durationMs: 1234
    });
    service.stop();

    const report = service.buildReport();
    validateSupportReport(report);
    const json = JSON.stringify(report);
    assert.ok(json.includes('"httpStatus":429'));
    assert.ok(!json.includes('"message":'));
    assert.ok(!json.includes('"path":'));
    service.dispose();
  });

  test("records an ephemeral correlation ID and subsystem only when both are allowlisted", () => {
    const service = new SupportSessionService();
    const correlationId = "2a79b1a6-c908-4a9c-a9bf-44a2d6e2709f";
    service.start(environment);
    service.record({
      name: "operation_progress",
      operation: "provider_request",
      subsystem: "provider",
      correlationId,
      outcome: "success"
    });
    const report = service.buildReport();
    assert.strictEqual(report.events[1].correlationId, correlationId);
    assert.strictEqual(report.events[1].subsystem, "provider");
    service.dispose();
  });

  test("drops malformed correlation IDs and unknown subsystems", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.record({
      name: "operation_progress", operation: "provider_request",
      correlationId: "not-an-id", subsystem: "private-machine" as any
    } as any);
    assert.strictEqual(service.getStatus().droppedEvents, 1);
    service.dispose();
  });

  test("drops non-allowlisted runtime input", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.record({
      name: "operation_failed",
      operation: "generate_commit",
      provider: "sk-live-sensitive-value"
    } as any);
    const status = service.getStatus();
    assert.strictEqual(status.droppedEvents, 1);
    assert.strictEqual(status.eventCount, 1);
    service.dispose();
  });

  test("rejects extra runtime keys instead of copying them", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.record({
      name: "operation_failed",
      operation: "generate_commit",
      rawError: "secret@example.com"
    } as any);
    const status = service.getStatus();
    assert.strictEqual(status.droppedEvents, 1);
    assert.ok(!service.serializeReport().includes("secret@example.com"));
    service.dispose();
  });

  test("replaces unsafe environment metadata instead of exporting it", () => {
    const service = new SupportSessionService();
    service.start({
      ...environment,
      extensionVersion: "secret@example.com",
      vscodeVersion: "https://private.example"
    });
    service.stop();
    const report = service.buildReport();
    assert.strictEqual(report.environment.extensionVersion, "unknown");
    assert.strictEqual(report.environment.vscodeVersion, "unknown");
    service.dispose();
  });

  test("fails closed when a report is tampered with", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.stop();
    const report = service.buildReport() as any;
    report.events[0].rawError = "Authorization: secret";
    assert.throws(() => validateSupportReport(report), /non-allowlisted event/);
    service.dispose();
  });

  test("fails closed on privacy-array and prototype injection", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.stop();

    const privacyReport = service.buildReport() as any;
    privacyReport.privacy.excluded = [...privacyReport.privacy.excluded, "private arbitrary value"];
    assert.throws(() => validateSupportReport(privacyReport), /privacy metadata/);

    const prototypeReport = service.buildReport() as any;
    Object.setPrototypeOf(prototypeReport.environment, { injected: "private arbitrary value" });
    assert.throws(() => validateSupportReport(prototypeReport), /environment metadata/);
    service.dispose();
  });

  test("fails closed on invalid timestamps and architecture", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.stop();

    const timeReport = service.buildReport() as any;
    timeReport.session.stoppedAt = new Date(Date.parse(timeReport.session.startedAt) + 31 * 60 * 1000).toISOString();
    assert.throws(() => validateSupportReport(timeReport), /time range/);

    const architectureReport = service.buildReport() as any;
    architectureReport.environment.architecture = "private-machine-name";
    assert.throws(() => validateSupportReport(architectureReport), /environment metadata/);
    service.dispose();
  });

  test("delete removes all in-memory session data", () => {
    const service = new SupportSessionService();
    service.start(environment);
    service.delete();
    assert.deepStrictEqual(service.getStatus(), {
      active: false,
      eventCount: 0,
      droppedEvents: 0,
      remainingMs: 0
    });
    assert.throws(() => service.buildReport(), /No sanitized support session/);
  });
});
