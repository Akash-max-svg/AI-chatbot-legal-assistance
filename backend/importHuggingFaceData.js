const mongoose = require("mongoose");
const axios = require("axios");
const dotenv = require("dotenv");
const KnowledgeBase = require("./models/KnowledgeBase");

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/legal-assistant";

// =========================================================
// CONFIGURATION FOR SPLITTING THE IMPORT
// Change START_OFFSET for each run to fetch data in chunks!
// =========================================================
const START_OFFSET = 45000; // Where to start (0, 15000, 30000, 45000, 60000...)
const RECORDS_TO_FETCH = 15000; // How many records to pull in THIS run
const BATCH_SIZE = 100; // Max rows allowed per API call by HF

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndIngestChunk() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB successfully!");

    let offset = START_OFFSET;
    const endOffset = START_OFFSET + RECORDS_TO_FETCH;
    let totalFetchedThisRun = 0;

    console.log(
      `\n🚀 Ingesting Chunk: Offset ${START_OFFSET.toLocaleString()} ➔ ${endOffset.toLocaleString()}\n`,
    );

    while (offset < endOffset) {
      const url = `https://datasets-server.huggingface.co/rows?dataset=kaushik-harsh-99%2FIndian-legal-data-v3&config=context_less_than_4096&split=train&offset=${offset}&length=${BATCH_SIZE}`;

      try {
        console.log(
          `📥 Fetching rows ${offset.toLocaleString()} to ${(offset + BATCH_SIZE).toLocaleString()}...`,
        );

        // Timeout set to 10s to prevent infinite hanging requests
        const response = await axios.get(url, { timeout: 10000 });
        const rows = response.data.rows;

        if (!rows || rows.length === 0) {
          console.log("⚠️ Reached end of dataset records.");
          break;
        }

        const formattedDocs = rows.map((item, index) => {
          const data = item.row;
          const instructionText =
            data.instruction || `Legal Record #${offset + index + 1}`;
          const outputText =
            data.output || "Detailed statutory guidance and legal text.";

          return {
            title:
              instructionText.length > 130
                ? instructionText.slice(0, 127) + "..."
                : instructionText,
            category: categorize32Domains(instructionText + " " + outputText),
            content: outputText,
            tags: extractTags(instructionText),
          };
        });

        // Upsert prevents duplicates if you ever re-run overlapping offset ranges
        const bulkOps = formattedDocs.map((doc) => ({
          updateOne: {
            filter: { title: doc.title },
            update: { $set: doc },
            upsert: true,
          },
        }));

        await KnowledgeBase.bulkWrite(bulkOps);

        totalFetchedThisRun += rows.length;
        offset += BATCH_SIZE;

        console.log(
          `💾 Batch saved! Progress in this run: ${totalFetchedThisRun.toLocaleString()} / ${RECORDS_TO_FETCH.toLocaleString()} records.`,
        );

        // 200ms delay protects against IP rate limiting
        await sleep(200);
      } catch (err) {
        console.error(
          `⚠️ Network glitch at offset ${offset}: ${err.message}. Waiting 5 seconds before retry...`,
        );
        await sleep(5000); // Backoff for network recovery
      }
    }

    const currentDBCount = await KnowledgeBase.countDocuments();
    console.log("\n==================================================");
    console.log(`🎉 CHUNK IMPORT COMPLETE!`);
    console.log(
      `📊 Records Ingested This Run : ${totalFetchedThisRun.toLocaleString()}`,
    );
    console.log(
      `📂 Total Records in MongoDB   : ${currentDBCount.toLocaleString()}`,
    );
    console.log("==================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal Script Error:", error.message);
    process.exit(1);
  }
}

function categorize32Domains(text) {
  const t = text.toLowerCase();

  if (
    t.includes("cyber") ||
    t.includes("it act") ||
    t.includes("dpdp") ||
    t.includes("online fraud")
  )
    return "Cyber Laws";
  if (
    t.includes("patent") ||
    t.includes("trademark") ||
    t.includes("copyright") ||
    t.includes("ipr")
  )
    return "Intellectual Property";
  if (
    t.includes("insolvency") ||
    t.includes("bankruptcy") ||
    t.includes("ibc") ||
    t.includes("nclt")
  )
    return "Insolvency & Bankruptcy (IBC)";
  if (t.includes("rera") || t.includes("real estate") || t.includes("allottee"))
    return "Real Estate (RERA)";
  if (
    t.includes("arbitration") ||
    t.includes("conciliation") ||
    t.includes("mediator") ||
    t.includes("lok adalat")
  )
    return "Arbitration & ADR";
  if (
    t.includes("income tax") ||
    t.includes("gst") ||
    t.includes("customs") ||
    t.includes("taxation")
  )
    return "Income Tax";
  if (
    t.includes("consumer") ||
    t.includes("cpa") ||
    t.includes("consumer court")
  )
    return "Consumer Protection Act";
  if (
    t.includes("rti") ||
    t.includes("right to info") ||
    t.includes("public authority")
  )
    return "Right to Information (RTI)";

  if (
    t.includes("nagarik suraksha") ||
    t.includes("bnss") ||
    t.includes("crpc") ||
    t.includes("cognizable") ||
    t.includes("bail")
  )
    return "Bharatiya Nagarik Suraksha (BNSS)";
  if (
    t.includes("sakshya") ||
    t.includes("bsa") ||
    t.includes("evidence act") ||
    t.includes("proof")
  )
    return "Bharatiya Sakshya Adhiniyam (BSA)";
  if (
    t.includes("nyaya sanhita") ||
    t.includes("bns") ||
    t.includes("ipc") ||
    t.includes("penal code") ||
    t.includes("offence")
  )
    return "Bharatiya Nyaya Sanhita";

  if (
    t.includes("companies act") ||
    t.includes("corporate") ||
    t.includes("director") ||
    t.includes("shareholder")
  )
    return "Corporate Law";
  if (
    t.includes("banking") ||
    t.includes("rbi") ||
    t.includes("negotiable instrument") ||
    t.includes("cheque bounce")
  )
    return "Banking & Financial Regulations";
  if (t.includes("competition act") || t.includes("cci"))
    return "Competition Law";
  if (t.includes("insurance") || t.includes("irdai")) return "Insurance Law";

  if (
    t.includes("contract") ||
    t.includes("agreement") ||
    t.includes("indemnity")
  )
    return "Contract Law";
  if (
    t.includes("property") ||
    t.includes("transfer of property") ||
    t.includes("mortgage") ||
    t.includes("tenant")
  )
    return "Property Laws";
  if (
    t.includes("tort") ||
    t.includes("negligence") ||
    t.includes("defamation")
  )
    return "Law of Torts";
  if (
    t.includes("cpc") ||
    t.includes("civil procedure") ||
    t.includes("injunction")
  )
    return "Civil Procedure Code";

  if (
    t.includes("constitution") ||
    t.includes("fundamental right") ||
    t.includes("article 21") ||
    t.includes("writ")
  )
    return "Constitution Articles";
  if (t.includes("human right") || t.includes("nhrc"))
    return "Human Rights Law";
  if (
    t.includes("administrative") ||
    t.includes("tribunal") ||
    t.includes("cat act")
  )
    return "Administrative Law";
  if (t.includes("election") || t.includes("voting")) return "Election Law";
  if (
    t.includes("marriage") ||
    t.includes("divorce") ||
    t.includes("matrimonial") ||
    t.includes("hindu law")
  )
    return "Family & Matrimonial Law";
  if (
    t.includes("labour") ||
    t.includes("labor") ||
    t.includes("industrial dispute") ||
    t.includes("wage")
  )
    return "Labor & Employment Law";
  if (t.includes("environment") || t.includes("ngt") || t.includes("pollution"))
    return "Environmental Laws";
  if (
    t.includes("motor vehicle") ||
    t.includes("mact") ||
    t.includes("accident claim")
  )
    return "Motor Vehicles & Claims";
  if (
    t.includes("juvenile") ||
    t.includes("pocso") ||
    t.includes("child rights")
  )
    return "Juvenile & Child Rights";
  if (
    t.includes("medical") ||
    t.includes("healthcare") ||
    t.includes("clinical")
  )
    return "Medical & Healthcare Laws";
  if (
    t.includes("maritime") ||
    t.includes("shipping") ||
    t.includes("admiralty")
  )
    return "Maritime Law";
  if (
    t.includes("municipal") ||
    t.includes("panchayat") ||
    t.includes("local body")
  )
    return "Municipal Governance";
  if (
    t.includes("supreme court") ||
    t.includes("judgment") ||
    t.includes("precedent")
  )
    return "Supreme Court Judgments";

  return "General Statutory Context";
}

function extractTags(text) {
  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);
  return Array.from(new Set(words)).slice(0, 3);
}

fetchAndIngestChunk();
