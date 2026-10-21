const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("fs"),
  assert = require("assert");
(async () => {
  const f = JSON.parse(
    fs.readFileSync(process.env.FORMA_AGENT_FIXTURE, "utf8"),
  );
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const nav = async (name) =>
    page
      .getByRole("navigation", { name: "CRM sections" })
      .getByRole("button", { name: new RegExp("^" + name + "(?: [0-9]+)?$") })
      .click();
  const close = async () =>
    page
      .getByRole("dialog")
      .last()
      .getByRole("button", { name: "Close panel", exact: true })
      .click();
  const saved = async () => {
    await page.waitForTimeout(300);
    await page.waitForFunction(
      () =>
        document.body.textContent.includes("Saved to Nabz") &&
        !document.body.textContent.includes("Unsaved changes"),
    );
  };
  const crm = async () =>
    page.evaluate(
      async () => (await (await fetch("/api/backend/forma/crm")).json()).data,
    );
  await page.goto(process.env.FORMA_URL || "http://localhost:3000");
  await page.getByLabel("Username", { exact: true }).fill(f.username);
  await page.getByLabel("Password", { exact: true }).fill(f.password);
  await page
    .getByRole("button", { name: "Enter workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "New record", exact: true })
    .waitFor({ timeout: 30000 });
  await nav("Tasks");
  await page.getByRole("button", { name: "QA website", exact: true }).click();
  await page.getByRole("button", { name: "Comments", exact: true }).click();
  await page
    .getByLabel("Write a comment")
    .fill("Blocked until legal approves the launch");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await saved();
  await close();
  await page.getByRole("button", { name: "Ask Forma", exact: true }).click();
  const side = page.getByRole("complementary", { name: "Board sidekick" });
  await side
    .getByRole("button", { name: "Review this board", exact: true })
    .click();
  await side
    .getByText("Overall snapshot", { exact: true })
    .waitFor({ timeout: 20000 });
  assert((await side.innerText()).includes("legal approves"));
  console.log("PASS live board report with thread blocker");
  await side
    .getByRole("button", { name: "Reject QA creative dueDate", exact: true })
    .click();
  await side.getByText("Rejected", { exact: true }).waitFor();
  assert.equal(
    (await crm()).records.find((r) => r.id === "qa-creative").dueDate,
    "",
  );
  await side
    .getByLabel("Ask board sidekick", { exact: true })
    .fill("Review dates and missing owners");
  await side
    .getByRole("button", { name: "Send board question", exact: true })
    .click();
  await side
    .getByRole("button", { name: "Approve QA creative dueDate", exact: true })
    .click();
  await side.getByText("Approved & applied", { exact: true }).waitFor();
  assert((await crm()).records.find((r) => r.id === "qa-creative").dueDate);
  console.log("PASS reject preserves data; approve persists canonical change");
  await side
    .getByRole("button", { name: "Close board sidekick", exact: true })
    .click();
  await nav("Agents");
  await page
    .getByRole("button", { name: "Launch coordinator", exact: true })
    .click();
  let dlg = page.getByRole("dialog");
  await dlg.getByLabel("Agent name", { exact: true }).fill("Release guardian");
  await dlg.getByRole("button", { name: "Board access", exact: true }).click();
  await dlg.getByLabel("Propose Due date 1", { exact: true }).check();
  await dlg.getByRole("button", { name: "Save agent", exact: true }).click();
  await page
    .getByRole("heading", { name: "Release guardian", exact: true })
    .waitFor();
  console.log("PASS scoped agent builder");
  const card = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Release guardian", exact: true }),
    });
  await card.getByRole("button", { name: "Run now", exact: true }).click();
  await page
    .getByRole("complementary", { name: "Board sidekick" })
    .getByText("Overall snapshot", { exact: true })
    .waitFor();
  console.log("PASS custom agent run");

  await page
    .getByRole("button", { name: "Skill library", exact: true })
    .click();
  await page.getByRole("button", { name: "New skill", exact: true }).click();
  let d = page.getByRole("dialog");
  await d.getByLabel("Skill name", { exact: true }).fill("Release brief");
  await d
    .getByLabel("Description", { exact: true })
    .fill("A reusable release review");
  await d
    .getByLabel("Step-by-step instructions", { exact: true })
    .fill(
      "Read the board. Cite source records. Flag blocked work. Propose actions for human review.",
    );
  await d.getByRole("button", { name: "Save skill", exact: true }).click();
  let skill = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Release brief", exact: true }),
    });
  await skill.getByRole("button", { name: "Edit skill", exact: true }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Version two release review");
  await page.getByRole("button", { name: "Save skill", exact: true }).click();
  await skill.getByText("Custom · v2", { exact: true }).waitFor();
  console.log("PASS reusable skill creation and versioning");
  await page
    .getByRole("button", { name: "Agents", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Edit agent Release guardian", exact: true })
    .click();
  d = page.getByRole("dialog");
  await d.getByRole("button", { name: "Skills & tools", exact: true }).click();
  await d.getByLabel("Release brief", { exact: false }).check();
  await d.getByRole("button", { name: "Identity", exact: true }).click();
  await d.getByLabel("Agent model", { exact: true }).selectOption("lmstudio");
  await d
    .getByLabel("Loaded model identifier", { exact: true })
    .fill("qwen-qa");
  await d.getByRole("button", { name: "Save agent", exact: true }).click();
  let releaseCard = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Release guardian", exact: true }),
    });
  await releaseCard
    .getByRole("button", { name: "Run now", exact: true })
    .click();
  await page
    .getByText("LM Studio agent inference is disabled on the server", {
      exact: true,
    })
    .waitFor();
  console.log("PASS local model failure visible without mock fallback");
  await page
    .getByRole("button", { name: "Edit agent Release guardian", exact: true })
    .click();
  await page.getByLabel("Agent model", { exact: true }).selectOption("mock");
  await page.getByRole("button", { name: "Save agent", exact: true }).click();
  await page.getByRole("button", { name: "Connections", exact: true }).click();
  assert.equal(
    await page.getByText("Not configured", { exact: true }).count(),
    4,
  );
  console.log("PASS truthful provider readiness");

  await nav("Tasks");
  await page.getByRole("button", { name: "Ask Forma", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Board sidekick" });
  await panel
    .getByRole("button", { name: "QA website", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("heading", { name: "QA website", exact: true })
    .waitFor();
  await close();
  await page
    .getByRole("button", { name: "Switch to Persian", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert((await page.locator('[dir="rtl"]').count()) > 0);
  console.log("PASS source links and Persian mobile");
  assert.deepEqual(errors, []);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
