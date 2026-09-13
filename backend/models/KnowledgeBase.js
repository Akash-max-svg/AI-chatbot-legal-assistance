const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Constitution Articles",
        "Bharatiya Nyaya Sanhita",
        "BNSS",
        "BSA",
        "Consumer Protection Act",
        "RTI Act",
        "IPC History",
        "Cyber Laws",
        "Motor Vehicle Act",
        "Domestic Violence Act",
        "POSH Act",
        "Labour Laws",
        "Income Tax",
        "GST",
        "Environmental Laws",
        "Company Law",
        "Family Laws",
        "Women Protection Laws",
        "Children Protection Laws",
        "Senior Citizen Laws",
        "Property Laws",
        "Banking Laws",
        "Education Laws",
        "Medical Laws",
        "Election Laws",
        "Digital Personal Data Protection Act",
        "Supreme Court Judgments",
        "Frequently Asked Questions",
        "Government Acts",
        "Other",
      ],
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    importantActs: [String],
    sections: [String],
    articles: [String],
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    governmentReferences: [
      {
        title: String,
        url: String,
        description: String,
      },
    ],
    tags: [String],
    keywords: [String],
    publishedDate: {
      type: Date,
    },
    lastUpdated: {
      type: Date,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for full-text search
knowledgeBaseSchema.index({
  title: "text",
  content: "text",
  tags: "text",
  keywords: "text",
});

module.exports = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
