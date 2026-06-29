import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildNextState,
  buildSlackMessage,
  chunkItems,
  cleanCompanyName,
  extractTdnetDocId,
  isJstWeekday,
  parseTdnetDisclosures,
  pollTdnet,
  yyyymmddInJst,
} from "../src/worker.js";

function makeKv(initial = null) {
  let value = initial;
  return {
    async get(_key, type) {
      if (type === "json") return value;
      return JSON.stringify(value);
    },
    async put(_key, nextValue) {
      value = JSON.parse(nextValue);
    },
    read() {
      return value;
    },
  };
}

const tdnetHtml = `
<html><body><table id="main-list-table">
  <tr>
    <td class="oddnew-L kjTime" noWrap>14:00</td>
    <td class="oddnew-M kjCode" noWrap>99890</td>
    <td class="oddnew-M kjName" noWrap>サンドラッグ            </td>
    <td class="oddnew-M kjTitle" align="left"><a href="140120260626582435.pdf" target="_blank">譲渡制限付株式報酬としての自己株式の処分に関するお知らせ</a></td>
    <td class="oddnew-M kjXbrl" noWrap align="center"> </td>
  </tr>
</table></body></html>
`;

describe("worker TDnet parser", () => {
  it("extracts TDnet document IDs", () => {
    assert.equal(
      extractTdnetDocId("https://www.release.tdnet.info/inbs/140120260626582435.pdf"),
      "140120260626582435",
    );
  });

  it("formats JST date keys", () => {
    assert.equal(yyyymmddInJst(new Date("2026-06-26T15:01:00Z")), "20260627");
  });

  it("cleans market prefixes from company names for Slack display", () => {
    assert.equal(cleanCompanyName("Ｇ－インフォネット"), "インフォネット");
    assert.equal(cleanCompanyName("Ｇ－サイバダイン－議"), "サイバダイン");
  });

  it("detects JST weekdays and weekends", () => {
    assert.equal(isJstWeekday(new Date("2026-06-26T14:59:00Z")), true);
    assert.equal(isJstWeekday(new Date("2026-06-26T15:00:00Z")), false);
    assert.equal(isJstWeekday(new Date("2026-06-28T15:00:00Z")), true);
  });

  it("parses official TDnet list rows", () => {
    const disclosures = parseTdnetDisclosures(tdnetHtml, "20260627");
    assert.equal(disclosures.length, 1);
    assert.equal(disclosures[0].id, "tdnet:9989:140120260626582435");
    assert.equal(disclosures[0].code, "9989");
    assert.equal(disclosures[0].company, "サンドラッグ");
    assert.equal(disclosures[0].date_jst, "2026-06-27 14:00 JST");
    assert.equal(disclosures[0].title, "譲渡制限付株式報酬としての自己株式の処分に関するお知らせ");
    assert.equal(
      disclosures[0].pdf_url,
      "https://www.release.tdnet.info/inbs/140120260626582435.pdf",
    );
  });

  it("builds the requested Slack message shape", () => {
    const message = buildSlackMessage(parseTdnetDisclosures(tdnetHtml, "20260627"));
    assert.equal(
      message,
      [
        "9989",
        "",
        "サンドラッグ",
        "",
        "2026-06-27 14:00",
        "",
        "譲渡制限付株式報酬としての自己株式の処分に関するお知らせ",
        "",
        "https://www.release.tdnet.info/inbs/140120260626582435.pdf",
      ].join("\n"),
    );
  });

  it("chunks large notification batches without dropping items", () => {
    const items = Array.from({ length: 64 }, (_, index) => ({ id: String(index) }));
    const chunks = chunkItems(items, 30);
    assert.deepEqual(
      chunks.map((chunk) => chunk.length),
      [30, 30, 4],
    );
  });
});

describe("worker polling", () => {
  it("bootstraps empty KV state without posting", async () => {
    const kv = makeKv();
    const result = await pollTdnet(
      { TDNET_STATE: kv },
      {
        dateYyyymmdd: "20260627",
        fetcher: async (url) => {
          if (url.includes("I_list_001")) return new Response(tdnetHtml);
          return new Response("", { status: 404 });
        },
      },
    );

    assert.equal(result.bootstrapped, true);
    assert.equal(result.posted, false);
    assert.equal(kv.read().seen_ids[0], "tdnet:9989:140120260626582435");
  });

  it("detects existing seen IDs", () => {
    const disclosure = parseTdnetDisclosures(tdnetHtml, "20260627")[0];
    const state = buildNextState({ seen_ids: [] }, [disclosure], new Date("2026-06-27T12:00:00Z"));
    assert.deepEqual(state.seen_ids, ["tdnet:9989:140120260626582435"]);
    assert.equal(state.items.length, 1);
  });
});
