import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function fail(msg) {
  console.error(`\n[verify-packs] FAIL: ${msg}\n`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[verify-packs] OK: ${msg}`);
}

function expect(condition, message) {
  if (!condition) fail(message);
}

function getFlagConfig(expansions) {
  return { expansions: { ex01: expansions.ex01 === true, ex02: expansions.ex02 === true, ex03: expansions.ex03 === true } };
}

async function main() {
  let gameModule;
  try {
    gameModule = await import("@balance-control/game");
  } catch (e) {
    fail(`Could not import @balance-control/game. Run "pnpm -r build" first.\nOriginal error: ${e.message}`);
  }

  const {
    EnginePackRegistry,
    CorePack,
    Exp01Pack,
    Exp02Pack,
    Exp03Pack,
    getPublicSurfaceHash,
    assemblePacks,
    CANONICAL_ENGINE_MODULE_ORDER
  } = gameModule;

  EnginePackRegistry.clear();
  EnginePackRegistry.registerPack(CorePack);
  EnginePackRegistry.registerPack(Exp01Pack);
  EnginePackRegistry.registerPack(Exp02Pack);
  EnginePackRegistry.registerPack(Exp03Pack);

  const registered = EnginePackRegistry.getRegisteredPacks();
  const expectedRegisteredOrder = CANONICAL_ENGINE_MODULE_ORDER.filter((id) => registered.some((pack) => pack.id === id));
  expect(
    registered.map((pack) => pack.id).join(",") === expectedRegisteredOrder.join(","),
    "Registered packs must be returned in canonical order."
  );
  ok("Registered packs are in canonical order.");

  for (const pack of registered) {
    expect(!!pack.manifest, `Pack "${pack.id}" is missing manifest.`);
    expect(pack.manifest.id === pack.id, `Pack "${pack.id}" manifest id mismatch.`);
    expect(!!pack.manifest.packVersion, `Pack "${pack.id}" manifest packVersion missing.`);
    expect(!!pack.manifest.rulesetAnchor, `Pack "${pack.id}" manifest rulesetAnchor missing.`);
  }
  ok("Pack manifests present and consistent.");

  const configs = [
    { id: "core", config: getFlagConfig({}) },
    { id: "ex01", config: getFlagConfig({ ex01: true }) },
    { id: "ex02", config: getFlagConfig({ ex02: true }) },
    { id: "ex03", config: getFlagConfig({ ex03: true }) },
    { id: "ex01ex02", config: getFlagConfig({ ex01: true, ex02: true }) },
  ];

  for (const entry of configs) {
    const enabled = EnginePackRegistry.getEnabledPacks(undefined, entry.config);
    const assembly = assemblePacks({ config: entry.config, mode: "enabled" });
    const enabledIds = enabled.map((pack) => pack.id);
    const assemblyIds = assembly.packs.map((pack) => pack.id);

    expect(
      JSON.stringify(enabledIds) === JSON.stringify(assemblyIds),
      `Pack assembly order mismatch for ${entry.id}: ${assemblyIds.join(",")} vs ${enabledIds.join(",")}`
    );

    const hashA = getPublicSurfaceHash(entry.config);
    const hashB = getPublicSurfaceHash(entry.config);
    expect(hashA === hashB, `Public surface hash drift for ${entry.id}.`);

    assembly.buildAtomDispatch({ engine: {} }, () => undefined);
    ok(`Pack surface validated for ${entry.id}.`);
  }
}

main().catch((err) => {
  fail(err?.message || String(err));
});
