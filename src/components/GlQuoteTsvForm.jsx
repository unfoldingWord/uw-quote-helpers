import React, { useState } from "react";
import Papa from "papaparse";
import { getParsedUSFM } from "../helpers/scripture.js";
import { getTargetQuoteFromSourceQuote } from "../helpers/quote.js";

const DEFAULT_SOURCE_URL =
  "https://git.door43.org/unfoldingWord/hbo_uhb/raw/branch/master/19-PSA.usfm";
const DEFAULT_TARGET_URL =
  "https://git.door43.org/unfoldingWord/en_ult/raw/branch/master/19-PSA.usfm";

const DEFAULT_TSV = `Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote
71:9\ts9yl\t\trc://*/ta/man/translate/figs-metaphor\t אַֽל־תַּ֭שְׁלִיכֵ⁠נִי לְ⁠עֵ֣ת זִקְנָ֑ה כִּ⁠כְל֥וֹת כֹּ֝חִ֗⁠י אַֽל־תַּעַזְבֵֽ⁠נִי׃\t1\tnote
71:9\tk3n2\t\trc://*/ta/man/translate/figs-metaphor\tאַֽל־תַּ֭שְׁלִיכֵ⁠נִי\t1\tnote
71:9\tl967\t\trc://*/ta/man/translate/figs-metaphor\tאַֽל־תַּעַזְבֵֽ⁠נִי׃\t1\tnote
71:9\txkey\t\trc://*/ta/man/translate/figs-metaphor\tכִּ⁠כְל֥וֹת כֹּ֝חִ֗⁠י\t1\tnote
71:9\te76r\t\trc://*/ta/man/translate/figs-metaphor\tכִּ⁠כְל֥וֹת כֹּ֝חִ֗⁠י\t1\tnote`;

const escapeTsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[\t\n\r"]/g.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildOutputFields = (fields) => {
  const withoutGl = fields.filter((field) => field !== "GL Quote");
  const occurrenceIndex = withoutGl.indexOf("Occurrence");
  if (occurrenceIndex === -1) {
    return [...withoutGl, "GL Quote"];
  }
  return [
    ...withoutGl.slice(0, occurrenceIndex + 1),
    "GL Quote",
    ...withoutGl.slice(occurrenceIndex + 1),
  ];
};

const serializeTsv = (rows, fields) => {
  const header = fields.join("\t");
  const lines = rows.map((row) =>
    fields.map((field) => escapeTsvValue(row[field])).join("\t")
  );
  return [header, ...lines].join("\n");
};

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url} (${response.status} ${response.statusText})`
    );
  }
  return response.text();
};

export default function GlQuoteTsvForm() {
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_SOURCE_URL);
  const [targetUrl, setTargetUrl] = useState(DEFAULT_TARGET_URL);
  const [tnTsv, setTnTsv] = useState(DEFAULT_TSV);
  const [outputTsv, setOutputTsv] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorText("");
    setOutputTsv("");

    try {
      const [sourceUsfm, targetUsfm] = await Promise.all([
        fetchText(sourceUrl.trim()),
        fetchText(targetUrl.trim()),
      ]);

      const sourceParsed = getParsedUSFM(sourceUsfm);
      const targetParsed = getParsedUSFM(targetUsfm);

      if (!sourceParsed?.chapters || !targetParsed?.chapters) {
        throw new Error("Unable to parse USFM data from one or more URLs.");
      }

      const sourceBook = sourceParsed.chapters;
      const targetBook = targetParsed.chapters;

      const parseResults = Papa.parse(tnTsv.replace(/\r\n/g, "\n"), {
        header: true,
        delimiter: "\t",
        skipEmptyLines: "greedy",
      });

      const parseErrors = [];
      if (parseResults.errors?.length) {
        parseResults.errors.forEach((error) => {
          parseErrors.push(
            `TSV parse error (row ${error.row ?? "?"}): ${error.message}`
          );
        });
      }

      const rows = (parseResults.data || []).filter((row) => {
        if (!row || typeof row !== "object") return false;
        return Object.values(row).some((value) => value !== "");
      });

      const fields = parseResults.meta?.fields || [];
      if (!fields.length) {
        throw new Error("TSV header row is missing or empty.");
      }

      const outputFields = buildOutputFields(fields);
      const generationErrors = [];

      rows.forEach((row, index) => {
        const quote = row.OrigQuote || row.Quote || "";
        const ref = row.Chapter ? `${row.Chapter}:${row.Verse}` : row.Reference;
        const occurrence = row.Occurrence;

        let glQuote = "";
        if (quote && occurrence && String(occurrence) !== "0") {
          try {
            glQuote = getTargetQuoteFromSourceQuote({
              quote,
              ref,
              sourceBook,
              targetBook,
              options: { occurrence, fromOrigLang: true },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            generationErrors.push(
              `Row ${index + 1} (${ref || "unknown ref"}): ${message}`
            );
          }
        }

        row["GL Quote"] = glQuote || "";
      });

      const output = serializeTsv(rows, outputFields);
      setOutputTsv(output);
      setErrorText([...parseErrors, ...generationErrors].join("\n"));
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="source-url" style={{ display: "block", fontWeight: 600 }}>
          Source Bible URL
        </label>
        <input
          id="source-url"
          type="text"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="target-url" style={{ display: "block", fontWeight: 600 }}>
          Target Bible URL
        </label>
        <input
          id="target-url"
          type="text"
          value={targetUrl}
          onChange={(event) => setTargetUrl(event.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="tn-tsv" style={{ display: "block", fontWeight: 600 }}>
          TN TSV
        </label>
        <textarea
          id="tn-tsv"
          value={tnTsv}
          onChange={(event) => setTnTsv(event.target.value)}
          rows={10}
          style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
        />
      </div>

      <button type="button" onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate GL Quotes"}
      </button>

      <div style={{ marginTop: 24 }}>
        <label htmlFor="output-tsv" style={{ display: "block", fontWeight: 600 }}>
          Output TSV
        </label>
        <textarea
          id="output-tsv"
          value={outputTsv}
          readOnly
          rows={12}
          style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="error-output" style={{ display: "block", fontWeight: 600 }}>
          Errors
        </label>
        <textarea
          id="error-output"
          value={errorText}
          readOnly
          rows={6}
          style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
        />
      </div>
    </div>
  );
}
