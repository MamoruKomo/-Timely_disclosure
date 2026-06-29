from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from tdnet_slack_alert import build_slack_message, parse_kabutan_disclosures, parse_tdnet_disclosures  # noqa: E402


class TdnetSlackAlertTests(unittest.TestCase):
    def test_parse_tdnet_disclosures_reads_official_list(self) -> None:
        html = """
        <html><body><table id="main-list-table">
          <tr>
            <td class="oddnew-L kjTime" noWrap>14:00</td>
            <td class="oddnew-M kjCode" noWrap>99890</td>
            <td class="oddnew-M kjName" noWrap>サンドラッグ            </td>
            <td class="oddnew-M kjTitle" align="left"><a href="140120260626582435.pdf" target="_blank">譲渡制限付株式報酬としての自己株式の処分に関するお知らせ</a></td>
            <td class="oddnew-M kjXbrl" noWrap align="center"> </td>
            <td class="oddnew-M kjPlace" noWrap align="left">東</td>
            <td class="oddnew-R kjHistroy" align="left">　　　　　</td>
          </tr>
        </table></body></html>
        """

        disclosures = parse_tdnet_disclosures(html, "20260627")

        self.assertEqual(len(disclosures), 1)
        self.assertEqual(disclosures[0].id, "tdnet:9989:140120260626582435")
        self.assertEqual(disclosures[0].code, "9989")
        self.assertEqual(disclosures[0].company, "サンドラッグ")
        self.assertEqual(disclosures[0].date_jst, "2026-06-27 14:00 JST")
        self.assertEqual(disclosures[0].title, "譲渡制限付株式報酬としての自己株式の処分に関するお知らせ")
        self.assertEqual(
            disclosures[0].pdf_url,
            "https://www.release.tdnet.info/inbs/140120260626582435.pdf",
        )

    def test_parse_kabutan_disclosures_still_works_as_fallback(self) -> None:
        html = """
        <html><body>
          <table>
            <tr>
              <td><a href="/stock/?code=485A">485A</a></td>
              <th scope="row">ＰｏｗｅｒＸ</th>
              <td>東証Ｇ</td>
              <td>その他</td>
              <td><a href="/disclosures/pdf/20260115/140120260115534702/">Notice Regarding the Results of Third-Party Allotment</a></td>
              <td>26/01/15 18:40</td>
            </tr>
            <tr>
              <td><a href="/stock/?code=485A">485A</a></td>
              <th scope="row">ＰｏｗｅｒＸ</th>
              <td>東証Ｇ</td>
              <td>その他</td>
              <td><a href="/disclosures/pdf/20260115/140120260115534700/">第三者割当増資の結果に関するお知らせ</a></td>
              <td>26/01/15 18:40</td>
            </tr>
          </table>
        </body></html>
        """

        disclosures = parse_kabutan_disclosures(html)

        self.assertEqual(len(disclosures), 1)
        self.assertEqual(disclosures[0].id, "kabutan:485A:1401202601155347")
        self.assertEqual(disclosures[0].code, "485A")
        self.assertEqual(disclosures[0].company, "ＰｏｗｅｒＸ")
        self.assertEqual(disclosures[0].date_jst, "2026-01-15 18:40 JST")
        self.assertEqual(disclosures[0].title, "第三者割当増資の結果に関するお知らせ")
        self.assertEqual(
            disclosures[0].pdf_url,
            "https://www.release.tdnet.info/inbs/140120260115534700.pdf",
        )

    def test_build_slack_message_matches_requested_shape(self) -> None:
        html = """
        <html><body><table><tr>
          <td><a href="/stock/?code=9983">9983</a></td>
          <th scope="row">ファーストリテイリング</th>
          <td>東証Ｐ</td>
          <td>決算</td>
          <td><a href="/disclosures/pdf/20260623/140120260623123400/">決算短信</a></td>
          <td>26/06/23 15:00</td>
        </tr></table></body></html>
        """

        message = build_slack_message(parse_kabutan_disclosures(html))

        self.assertEqual(
            message,
            "\n".join(
                [
                    "9983",
                    "",
                    "ファーストリテイリング",
                    "",
                    "2026-06-23 15:00",
                    "",
                    "決算短信",
                    "",
                    "https://www.release.tdnet.info/inbs/140120260623123400.pdf",
                ]
            ),
        )


if __name__ == "__main__":
    unittest.main()
