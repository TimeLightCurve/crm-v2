const test = require("node:test");
const assert = require("node:assert/strict");
const { validateInput, canRead, canWrite, canApprove } = require("../lib/enterprise/domain.ts");

test("decision cannot become ready without options and grounded evidence or gap", () => {
  assert.throws(() => validateInput({ title: "Supplier", stage: "ready" }, "decision"), /option/);
  assert.throws(() => validateInput({ title: "Supplier", stage: "ready", options: ["B"] }, "decision"), /evidence/);
  assert.equal(validateInput({ title: "Supplier", stage: "ready", options: ["B"], gaps: ["Capacity unverified"] }, "decision").stage, "ready");
});
test("risk document requires impact, mitigation and review date", () => {
  assert.throws(() => validateInput({ title: "Delivery delay" }, "risk"), /Risk impact/);
  assert.equal(validateInput({ title: "Delivery delay", impact: "Loss", mitigation: "Backup supplier", reviewDate: "2026-11-01" }, "risk").stage, "identified");
});
test("unknown and authority fields are rejected", () => {
  assert.throws(() => validateInput({ title: "A", tenantId: "other" }, "case"), /Unsupported/);
  assert.throws(() => validateInput({ title: "A", approvedBy: "owner" }, "decision"), /Unsupported/);
});
test("approved decision cannot be edited in place", () => {
  const previous = { ...validateInput({ title: "Decision", stage: "ready", options: ["A"], evidence: ["Reviewed source"] }, "decision"), approvedAt: "2026-10-26T00:00:00Z" };
  assert.throws(() => validateInput({ summary: "New account" }, "decision", previous), /superseding/);
});
test("read, write and approval are separately gated", () => {
  assert.equal(canRead(["sales:read"]), true);
  assert.equal(canWrite(["sales:read"]), false);
  assert.equal(canApprove("member", ["sales:write"]), false);
  assert.equal(canApprove("owner", ["sales:write"]), true);
});
