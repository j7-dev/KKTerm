import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const activityRailSource = await readFile(
  new URL("../src/app/ActivityRail.tsx", import.meta.url),
  "utf8",
);
const workspaceSettingsSource = await readFile(
  new URL("../src/modules/settings/WorkspaceSettings.tsx", import.meta.url),
  "utf8",
);

test("Activity Rail surfaces pinned Connections only, never auto-connected Sessions", () => {
  // Pinned Connections remain the explicit opt-in surface on the rail.
  assert.match(
    activityRailSource,
    /const pinnedItems: ConnectedRailItem\[\] = pinnedConnectionIds\.flatMap/,
    "the rail should still build items from the pinned Connection ids",
  );

  // The old auto behavior keyed off generalSettings.showConnectedConnectionsInRail
  // plus activeSessionCounts to push connected-but-unpinned Sessions onto the rail.
  // Both signals must no longer drive rail items.
  assert.doesNotMatch(
    activityRailSource,
    /showConnectedConnectionsInRail\s*\n?\s*\?/,
    "rail items must not branch on showConnectedConnectionsInRail anymore",
  );
  assert.doesNotMatch(
    activityRailSource,
    /seenConnectionIds/,
    "the connected-Session de-duplication set is dead once auto items are gone",
  );

  // activeSessionCounts is still allowed for the rendered `connected` class, but
  // it must not feed the connectedRailItems assembly memo.
  const memoMatch = activityRailSource.match(
    /const connectedRailItems = useMemo[\s\S]*?\n  \}, \[([\s\S]*?)\]\);/,
  );
  assert.ok(memoMatch, "connectedRailItems useMemo should still exist");
  assert.doesNotMatch(
    memoMatch[1],
    /activeSessionCounts/,
    "connectedRailItems must not depend on activeSessionCounts after the change",
  );
  assert.doesNotMatch(
    memoMatch[1],
    /showConnectedConnectionsInRail/,
    "connectedRailItems must not depend on showConnectedConnectionsInRail after the change",
  );
});

test("Workspace Settings drops the connected-connections rail toggle", () => {
  assert.doesNotMatch(
    workspaceSettingsSource,
    /settings\.connectedConnectionsRail/,
    "the dead activity-rail toggle should be removed from Workspace Settings",
  );
  assert.doesNotMatch(
    workspaceSettingsSource,
    /showConnectedConnectionsInRail/,
    "Workspace Settings must not read or write showConnectedConnectionsInRail in the UI",
  );
});
