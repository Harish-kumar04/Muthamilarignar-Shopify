#!/usr/bin/env node
/**
 * Unit tests for the hero featured-books carousel index & slot logic
 * (next, prev, infinite wrap-around loop, coverflow slot mapping, and truthful discount %).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

async function loadHeroCarouselModule() {
  const srcPath = path.resolve(process.cwd(), "lib/hero-book-carousel.ts");
  const tsSource = fs.readFileSync(srcPath, "utf8");
  const { outputText } = ts.transpileModule(tsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: srcPath,
  });
  const dataUrl = `data:text/javascript;base64,${Buffer.from(outputText, "utf8").toString("base64")}`;
  return import(dataUrl);
}

test("nextSlideIndex advances sequentially and loops back to 0 at the end", async () => {
  const { nextSlideIndex } = await loadHeroCarouselModule();

  assert.equal(nextSlideIndex(0, 5), 1);
  assert.equal(nextSlideIndex(1, 5), 2);
  assert.equal(nextSlideIndex(3, 5), 4);
  // Loop from last item back to first
  assert.equal(nextSlideIndex(4, 5), 0);

  // Full 2-cycle infinite loop check
  let idx = 0;
  const visited = [];
  for (let step = 0; step < 8; step += 1) {
    idx = nextSlideIndex(idx, 4);
    visited.push(idx);
  }
  assert.deepEqual(visited, [1, 2, 3, 0, 1, 2, 3, 0]);
});

test("prevSlideIndex steps backward and loops from 0 to last index", async () => {
  const { prevSlideIndex } = await loadHeroCarouselModule();

  assert.equal(prevSlideIndex(0, 5), 4);
  assert.equal(prevSlideIndex(4, 5), 3);
  assert.equal(prevSlideIndex(2, 5), 1);
  assert.equal(prevSlideIndex(1, 5), 0);
});

test("normalizeSlideIndex and single/empty deck edge cases never produce NaN or out-of-range indices", async () => {
  const { normalizeSlideIndex, nextSlideIndex, prevSlideIndex } =
    await loadHeroCarouselModule();

  assert.equal(normalizeSlideIndex(0, 0), 0);
  assert.equal(normalizeSlideIndex(-1, 0), 0);
  assert.equal(nextSlideIndex(0, 0), 0);
  assert.equal(prevSlideIndex(0, 0), 0);

  assert.equal(nextSlideIndex(0, 1), 0);
  assert.equal(prevSlideIndex(0, 1), 0);

  assert.equal(normalizeSlideIndex(-1, 6), 5);
  assert.equal(normalizeSlideIndex(-7, 6), 5);
  assert.equal(normalizeSlideIndex(6, 6), 0);
  assert.equal(normalizeSlideIndex(14, 6), 2);
});

test("getCarouselSlot assigns front, prev, next, and hidden slots across wrap-around boundaries", async () => {
  const { getCarouselSlot } = await loadHeroCarouselModule();

  // 5-book deck with active = 0 (wrap-around: prev is 4, next is 1)
  assert.equal(getCarouselSlot(0, 0, 5), "front");
  assert.equal(getCarouselSlot(4, 0, 5), "prev");
  assert.equal(getCarouselSlot(1, 0, 5), "next");
  assert.equal(getCarouselSlot(2, 0, 5), "hidden");
  assert.equal(getCarouselSlot(3, 0, 5), "hidden");

  // 5-book deck with active = 4 (wrap-around: prev is 3, next is 0)
  assert.equal(getCarouselSlot(4, 4, 5), "front");
  assert.equal(getCarouselSlot(3, 4, 5), "prev");
  assert.equal(getCarouselSlot(0, 4, 5), "next");
  assert.equal(getCarouselSlot(1, 4, 5), "hidden");

  // 2-book deck: active is front, other is next (no duplicate prev/next collision)
  assert.equal(getCarouselSlot(0, 0, 2), "front");
  assert.equal(getCarouselSlot(1, 0, 2), "next");

  // 1-book deck: sole item is front
  assert.equal(getCarouselSlot(0, 0, 1), "front");
});

test("getTruthfulDiscountPct returns positive % only when sale price is genuinely lower than MRP", async () => {
  const { getTruthfulDiscountPct } = await loadHeroCarouselModule();

  assert.equal(getTruthfulDiscountPct(100000, 95000), 5);
  assert.equal(getTruthfulDiscountPct(50000, 40000), 20);
  assert.equal(getTruthfulDiscountPct(50000, 50000), 0);
  assert.equal(getTruthfulDiscountPct(50000, 55000), 0);
  assert.equal(getTruthfulDiscountPct(50000, null), 0);
  assert.equal(getTruthfulDiscountPct(50000, undefined), 0);
  assert.equal(getTruthfulDiscountPct(50000, 0), 0);
  assert.equal(getTruthfulDiscountPct(0, 0), 0);
});
