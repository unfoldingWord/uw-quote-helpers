import { getQuoteMatchesInBookRef, getTargetQuoteFromWords, getParsedUSFM } from "../src/";
import { normalize } from "./helpers/quote.js";
import { getTargetBook, getSourceBook } from "../examples/getBook";

const TEST_TIMOUT = 10000;

const tests = [
  {
    params: {
      name: "",
      bookId: "PSA",
      ref: "6:8-9",
      quote: "יְ֭הוָה & יְ֝הוָ֗ה",
    },
    expected: "Yahweh & Yahweh",
  },
  {
    params: {
      name: "Middle word not being highlighted",
      bookId: "PSA",
      ref: "6:8-9",
      quote: "יְ֝הוָ֗ה & יְ֭הוָה & יְ֝הוָ֗ה",
    },
    expected: "Yahweh & Yahweh & Yahweh",
  },
  {
    params: {
      name: "Test 1",
      bookId: "JUD",
      ref: "1:10",
      quote: "ὅσα & φυσικῶς ὡς τὰ ἄλογα ζῷα ἐπίστανται",
      occurrence: 2,
    },
    expected: "what they understand by instinct as the unreasoning animals",
    expectedSelections: [
      {
        text: "ὅσα",
        occurrence: 2,
      },
      {
        text: "φυσικῶς",
        occurrence: 1,
      },
      {
        text: "ὡς",
        occurrence: 1,
      },
      {
        text: "τὰ",
        occurrence: 1,
      },
      {
        text: "ἄλογα",
        occurrence: 1,
      },
      {
        text: "ζῷα",
        occurrence: 1,
      },
      {
        text: "ἐπίστανται",
        occurrence: 1,
      },
    ],
  },
  {
    params: {
      name: "",
      bookId: "3JN",
      ref: "1:6-7",
      quote:
        "οὓς καλῶς ποιήσεις, προπέμψας ἀξίως τοῦ Θεοῦ; ὑπὲρ γὰρ τοῦ ὀνόματος ἐξῆλθον, μηδὲν λαμβάνοντες ἀπὸ τῶν ἐθνικῶν",
      occurrence: 1,
    },
    only: true,
    expected:
      "whom you will do well to send on worthily of God & for they went out for the sake of the name, receiving nothing from the Gentiles",
  },
  {
    params: {
      name: "",
      bookId: "2JN",
      ref: "1:2",
      quote: "καὶ μεθ’ ἡμῶν ἔσται",
      occurrence: 1,
    },
    expected: "and will be with us",
    expectedSelections: [
      {
        text: "καὶ",
        occurrence: 1,
      },
      {
        text: "μεθ’",
        occurrence: 1,
      },
      {
        text: "ἡμῶν",
        occurrence: 1,
      },
      {
        text: "ἔσται",
        occurrence: 1,
      },
    ],
  },
  {
    params: {
      name: "",
      bookId: "2JN",
      ref: "1:2",
      quote: "μεθ’ ἡμῶν",
      occurrence: 1,
    },
    expected: "with us",
    expectedSelections: [
      {
        text: "μεθ’",
        occurrence: 1,
      },
      {
        text: "ἡμῶν",
        occurrence: 1,
      },
    ],
  },
  {
    params: {
      name: "",
      bookId: "2JN",
      ref: "1:2",
      quote: "καὶ μεθ’",
      occurrence: 1,
    },
    expected: "and & with",
    expectedSelections: [
      {
        text: "καὶ",
        occurrence: 1,
      },
      {
        text: "μεθ’",
        occurrence: 1,
      },
    ],
  },
  {
    params: {
      name: "",
      bookId: "TIT",
      ref: "1:4,9",
      quote: "καὶ & καὶ",
      occurrence: 3,
    },
    expected: "both & and",
  },

  {
    params: {
      name: "Testing deuteronomy highlighting error",
      bookId: "DEU",
      ref: "1:5-6",
      quote:
        "מֹשֶׁ֔ה בֵּאֵ֛ר אֶת־הַ⁠תּוֹרָ֥ה הַ⁠זֹּ֖את לֵ⁠אמֹֽר׃ & יְהוָ֧ה אֱלֹהֵ֛י⁠נוּ דִּבֶּ֥ר אֵלֵ֖י⁠נוּ בְּ⁠חֹרֵ֣ב לֵ⁠אמֹ֑ר",
    },
    expected:
      "Moses & explaining this law, saying & Yahweh our God spoke to us at Horeb, saying",
  },
  {
    params: {
      name: "",
      bookId: "JOS",
      ref: "21:27",
      quote: "אֶת־גּוֹלָ֤ן & בְּעֶשְׁתְּרָ֖ה",
    },
    expected: "Golan & Be Eshterah",
  },
  {
    params: {
      name: "",
      bookId: "GEN",
      ref: "7:11",
      quote: "בִּ⁠שְׁנַ֨ת שֵׁשׁ־מֵא֤וֹת שָׁנָה֙ לְ⁠חַיֵּי נֹ֔חַ",
    },
    expected: "In the six hundredth year of Noah’s life",
  },
  {
    params: {
      name: "",
      bookId: "GEN",
      ref: "1:21",
      quote: "וְ⁠אֵ֣ת כָּל נֶ֣פֶשׁ הַֽ⁠חַיָּ֣ה הָֽ⁠רֹמֶ֡שֶׂת",
    },
    expected: "and every living creature that moves",
  },
  {
    params: {
      name: "",
      bookId: "GEN",
      ref: "1:3",
      quote: "וַֽ⁠יְהִי אֽוֹר",
    },
    expected: "And there was light",
  },
  {
    params: {
      name: "",
      bookId: "PSA",
      ref: "3:2",
      quote: "סֶֽלָה",
    },
    expected: "Selah",
  },
  {
    params: {
      name: "",
      bookId: "JOS",
      ref: "24:10",
      quote: "וָ⁠אַצִּ֥ל אֶתְ⁠כֶ֖ם מִ⁠יָּדֽ⁠וֹ",
    },
    expected: "and I rescued you from his hand",
  },
  {
    params: {
      name: "",
      bookId: "JOS",
      ref: "1:11",
      quote: "בְּ⁠ע֣וֹד׀ שְׁלֹ֣שֶׁת יָמִ֗ים",
    },
    expected: "within three days",
  },
  {
    params: {
      bookId: "JOS",
      ref: "15:7",
      quote:
        "דְּבִרָ⁠ה֮ מֵ⁠עֵ֣מֶק עָכוֹר֒ & הַ⁠גִּלְגָּ֗ל & לְ⁠מַעֲלֵ֣ה אֲדֻמִּ֔ים & מֵי־עֵ֣ין שֶׁ֔מֶשׁ & עֵ֥ין רֹגֵֽל",
    },
    expected:
      "to Debir from the Valley of Trouble & the Gilgal & of the ascent of Adummim & the waters of En Shemesh & En Rogel",
  },
  {
    params: {
      bookId: "JOS",
      ref: "15:7",
      quote:
        "דְּבִרָ⁠ה֮ מֵ⁠עֵ֣מֶק עָכוֹר֒ & הַ⁠גִּלְגָּ֗ל & לְ⁠מַעֲלֵ֣ה אֲדֻמִּ֔ים & מֵי־עֵ֣ין שֶׁ֔מֶ & עֵ֥ין רֹגֵֽל",
    },
    expected: "",
  },
  {
    params: {
      bookId: "PHP",
      ref: "1:1-20",
      quote: "τινὲς μὲν καὶ & τὸν Χριστὸν κηρύσσουσιν",
    },
    expected: "Some indeed even proclaim Christ",
  },
  {
    params: {
      bookId: "GEN",
      ref: "2:23",
      quote: "עֶ֚צֶם מֵֽ⁠עֲצָמַ֔⁠י וּ⁠בָשָׂ֖ר מִ⁠בְּשָׂרִ֑⁠י",
    },
    expected: "is bone from my bones\nand flesh from my flesh",
  },
  {
    params: {
      bookId: "GEN",
      ref: "4:23",
      quote: "כִּ֣י אִ֤ישׁ הָרַ֨גְתִּי֙ לְ⁠פִצְעִ֔⁠י וְ⁠יֶ֖לֶד לְ⁠חַבֻּרָתִֽ⁠י",
    },
    expected:
      "For I killed a man for my wound,\neven a young man for my bruise",
  },
  {
    params: {
      name: "",
      bookId: "1PE",
      ref: "1:24",
      quote:
        "πᾶσα σὰρξ ὡς χόρτος, καὶ πᾶσα δόξα αὐτῆς ὡς ἄνθος χόρτου. ἐξηράνθη ὁ χόρτος, καὶ τὸ ἄνθος ἐξέπεσεν,",
      occurrence: 1,
    },
    expected: `All flesh {is} like grass,
and all its glory {is} like the flower of the grass.
The grass was dried up, and the flower fell off`,
  },
  {
    params: {
      name: "",
      bookId: "1CO",
      ref: "1:2",
      quote: "τῇ ἐκκλησίᾳ τοῦ Θεοῦ & τῇ οὔσῃ ἐν Κορίνθῳ",
      occurrence: 1,
    },
    expected: "to the church of God that is in Corinth",
  },
  {
    params: {
      bookId: "1PE",
      ref: "1:7",
      quote: "τὸ δοκίμιον ὑμῶν τῆς πίστεως & διὰ πυρὸς δὲ δοκιμαζομένου",
      occurrence: 1,
    },
    expected: "the genuineness of your faith & but being tested by fire",
  },
  {
    params: {
      bookId: "1CO",
      ref: "3:9",
      quote: "Θεοῦ",
      occurrence: -1,
    },
    expected: "God’s & God’s & God’s",
  },
  {
    params: {
      bookId: "1CO",
      ref: "3:9",
      quote: "συνεργοί & γεώργιον & οἰκοδομή",
      occurrence: 1,
    },
    expected: "fellow workers & field & building",
  },
  {
    params: {
      bookId: "1CO",
      ref: "7:32",
      quote: "ὁ ἄγαμος & ἀρέσῃ",
      occurrence: 1,
    },
    expected: "The unmarried man & he might please",
  },
];

describe("Find quotes", () => {
  test.each(tests)(
    `REF: "$params.bookId $params.ref" | EXPECTED: "$expected"`,
    async ({ params, expected, expectedSelections }) => {
      const { bookId, ref, quote, occurrence = -1 } = params;

      const targetBook = await getTargetBook(bookId, true);
      const sourceBook = await getSourceBook(bookId, true);

      const quoteMatches = getQuoteMatchesInBookRef({
        quote,
        ref,
        bookObject: sourceBook,
        isOrigLang: true,
        occurrence,
      });

      const targetQuotes = getTargetQuoteFromWords({
        targetBook,
        wordsMap: quoteMatches,
      }, { removeBrackets: true });

      try {
        expect(targetQuotes).toEqual(expected);
      } catch (e) {
        console.log({ params, expected, received: targetQuotes, quoteMatches });
        throw e;
      }
      if (expectedSelections) {
        // if given then also verify the selections are expected
        const selections = quoteMatches.get(ref);
        // normalize the expected selections
        const _expectedSelections = expectedSelections.map((item) => ({
          ...item,
          text: normalize(item.text, true),
        }));
        // eslint-disable-next-line jest/no-conditional-expect
        expect(selections).toEqual(_expectedSelections);
      }
    },
    TEST_TIMOUT
  );
});

describe("Verse spans in a chapter with front matter", () => {
  // Modelled on the UST at DAN 9:20-21: a chapter heading (front matter) followed by a verse span.
  const targetUsfm = `\\id DAN
\\c 9
\\s Daniel prays for his people
\\p
\\v 20-21 \\zaln-s |x-strong="c:H6419" x-lemma="פָּלַל" x-morph="He,C:Vtrmsa" x-occurrence="1" x-occurrences="1" x-content="וּ⁠מִתְפַּלֵּ֔ל" x-ref="9:20"\\*\\w was|x-occurrence="1" x-occurrences="1"\\w*
\\w praying|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.
\\v 22 \\zaln-s |x-strong="H0995" x-lemma="בִּין" x-morph="He,Vhw3ms" x-occurrence="1" x-occurrences="1" x-content="וַ⁠יָּ֖בֶן" x-ref="9:22"\\*\\w He|x-occurrence="1" x-occurrences="1"\\w*
\\w taught|x-occurrence="1" x-occurrences="1"\\w*\\zaln-e\\*.
`;
  const wordsMap = new Map([["9:20", [{ text: normalize("וּ⁠מִתְפַּלֵּ֔ל", true), occurrence: 1 }]]]);

  test("finds the verse span", () => {
    const targetBook = getParsedUSFM(targetUsfm).chapters;
    expect(Object.keys(targetBook["9"])).toContain("front");
    expect(getTargetQuoteFromWords({ targetBook, wordsMap })).toEqual("was praying");
  });

  test("finds the verse span when front matter is aliased to verse 0", () => {
    // door43-preview-app copies each chapter's front matter to verse "0" so front-matter quotes convert.
    const targetBook = getParsedUSFM(targetUsfm).chapters;
    targetBook["9"]["0"] = targetBook["9"].front;
    expect(getTargetQuoteFromWords({ targetBook, wordsMap })).toEqual("was praying");
  });
});
