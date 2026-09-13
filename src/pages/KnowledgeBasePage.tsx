import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Scale, ChevronRight, Tag, X, Loader2, Filter,
  ChevronDown, Sparkles, Bot, AlertCircle, Download, Copy, Check,
  Database, Cpu, Layers, FileSearch, Brain, ChevronLeft,
} from 'lucide-react';
import { knowledgeService } from '../services/knowledgeService';
import { useLanguage } from '../context/LanguageContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Recommendations from '../components/Recommendations';
import { generateLegalPDF } from '../utils/pdfExport';

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
}

const PAGE_SIZE = 12;

export default function KnowledgeBasePage() {
  const { currentLanguage } = useLanguage();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiCitations, setAiCitations] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async (searchQuery: string, category: string, pageNum: number) => {
    setLoading(true);
    try {
      const params: any = { limit: PAGE_SIZE, skip: pageNum * PAGE_SIZE };
      if (searchQuery) params.q = searchQuery;
      if (category && category !== 'All') params.category = category;
      const { items: data, total: count } = await knowledgeService.search('', params);
      if (data && data.length > 0) {
        setItems(
          data.map((d: any) => ({
            id: d._id,
            category: d.category,
            title: d.title,
            content: d.content,
            tags: d.tags || [],
          }))
        );
        setTotal(count);
      } else {
        setItems([]);
        setTotal(count || 0);
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { categories: cats } = await knowledgeService.getCategories();
        setCategories(['All', ...cats]);
      } catch {
        // Keep default 'All'
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchItems(search, activeCategory, 0);
      setPage(0);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, activeCategory, fetchItems]);

  const filtered = items;
  const topCategories = categories.slice(0, 8);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const runAiSearch = async () => {
    if (!search.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiAnswer(null);
    setAiCitations([]);
    setAiRecommendations(null);
    try {
      const result = await knowledgeService.askAI(search, currentLanguage);
      setAiAnswer(result.answer);
      setAiCitations(result.citations || []);
      setAiRecommendations(result.recommendations || null);
    } catch (err: any) {
      setAiError(err?.message || 'Failed to get AI answer.');
    } finally {
      setAiLoading(false);
    }
  };

  const copyAnswer = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAnswer = () => {
    if (!aiAnswer) return;
    generateLegalPDF({
      title: 'Legal Knowledge Answer',
      subtitle: 'AI Legal Knowledge Search',
      meta: [{ label: 'Question', value: search }],
      sections: [
        { heading: 'Answer', body: aiAnswer },
        ...(aiCitations.length ? [{ heading: 'Citations', body: aiCitations.join('\n') }] : []),
      ],
      footer: 'AI-generated legal information for research purposes only. Not legal advice.',
    });
  };

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Legal Knowledge Base</h1>
        <p className="text-gray-400 text-sm mt-1">
          Comprehensive Indian legal resources — {total.toLocaleString()}{" "}
          articles across {Math.max(categories.length - 1, 0)} categories
        </p>
      </div>

      {/* RAG Architecture Banner */}
      <div className="card bg-gradient-to-br from-navy-900 to-navy-800 border-gold-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
            <Cpu size={20} className="text-gold-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gold-400 mb-1">
              AI-Powered Legal Knowledge Search
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Designed to support more than 60,000 Indian legal documents using
              Retrieval-Augmented Generation (RAG), Semantic Search, Vector
              Embeddings and Gemini AI.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-navy-800/60 px-2 py-1 rounded-full">
                <Layers size={10} className="text-gold-500" /> RAG
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-navy-800/60 px-2 py-1 rounded-full">
                <Search size={10} className="text-gold-500" /> Semantic Search
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-navy-800/60 px-2 py-1 rounded-full">
                <Database size={10} className="text-gold-500" /> Vector
                Embeddings
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-navy-800/60 px-2 py-1 rounded-full">
                <FileSearch size={10} className="text-gold-500" /> Document
                Retrieval
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-navy-800/60 px-2 py-1 rounded-full">
                <Brain size={10} className="text-gold-500" /> Gemini AI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Search */}
      <div className="card border-gold-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-gold-400" />
          <h2 className="text-sm font-semibold text-gold-400">
            Ask AI a Legal Question
          </h2>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAiSearch()}
              placeholder="Ask any Indian legal question — e.g. 'What laws apply to online fraud?'"
              className="input-field w-full pl-10"
            />
          </div>
          <button
            onClick={runAiSearch}
            disabled={aiLoading || !search.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Bot size={16} />
            )}
            {aiLoading ? "Gemini..." : "Ask Gemini"}
          </button>
        </div>

        {aiError && (
          <div className="flex items-start gap-2 mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {aiLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={28} className="text-gold-500 animate-spin mb-3" />
            <p className="text-sm text-gray-400">
              Gemini is searching legal knowledge...
            </p>
          </div>
        )}

        {aiAnswer && !aiLoading && (
          <div className="mt-4 space-y-3">
            <div className="bg-navy-800/50 rounded-lg p-4 border border-gold-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/20 flex items-center justify-center">
                    <Bot size={14} className="text-gold-400" />
                  </div>
                  <span className="text-xs font-semibold text-gold-400">
                    Gemini AI Answer
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copyAnswer}
                    className="btn-secondary py-1.5 px-2.5 text-[10px] flex items-center gap-1"
                  >
                    {copied ? (
                      <Check size={11} className="text-emerald-400" />
                    ) : (
                      <Copy size={11} />
                    )}{" "}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={downloadAnswer}
                    className="btn-primary py-1.5 px-2.5 text-[10px] flex items-center gap-1"
                  >
                    <Download size={11} /> PDF
                  </button>
                </div>
              </div>
              <MarkdownRenderer content={aiAnswer} />
              {aiCitations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-navy-700/40">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                    Citations
                  </p>
                  <ul className="text-xs text-gray-300 space-y-0.5">
                    {aiCitations.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-gold-500">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {aiRecommendations && (
              <Recommendations
                data={aiRecommendations}
                onTopicClick={(t) => setSearch(t)}
              />
            )}
          </div>
        )}
      </div>

      {/* Browse Knowledge Base */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Browse Knowledge Base
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter articles by act, section, keyword, or category..."
              className="input-field w-full pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Filter size={14} /> Filters
            <ChevronDown
              size={12}
              className={`transition-transform ${showCategoryFilter ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Category Tabs — Quick */}
      <div className="flex flex-wrap gap-2">
        {topCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-gold-500 text-navy-950"
                : "bg-navy-800 text-gray-400 hover:text-gray-200 hover:bg-navy-700"
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          className="px-3.5 py-2 rounded-lg text-xs font-medium text-gray-500 bg-navy-800/50 hover:bg-navy-700 transition-all"
        >
          More...
        </button>
      </div>

      {/* Extended Filter */}
      {showCategoryFilter && (
        <div className="card">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
            All Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowCategoryFilter(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-gold-500 text-navy-950"
                    : "bg-navy-800 text-gray-400 hover:text-gray-200 hover:bg-navy-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="text-gold-500 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="card-gold text-left group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-gold-400" />
                </div>
                <div className="min-w-0">
                  <span className="badge-gold text-[9px] mb-1 inline-block">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 line-clamp-3 mb-3">
                {item.content}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-[10px] text-gray-500 bg-navy-800/60 px-2 py-0.5 rounded-full"
                  >
                    <Tag size={8} /> {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-navy-700/30 flex items-center gap-1 text-xs text-gold-400">
                Read More{" "}
                <ChevronRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <Scale size={28} className="text-navy-700 mx-auto mb-4" />
          <p className="text-sm text-gray-400">
            No articles found matching your search.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
            }}
            className="btn-secondary text-xs mt-3 py-2 px-3"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => {
              setPage((p) => Math.max(0, p - 1));
              fetchItems(search, activeCategory, Math.max(0, page - 1));
            }}
            disabled={page === 0}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-gray-400 px-3">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => {
              const next = Math.min(totalPages - 1, page + 1);
              setPage(next);
              fetchItems(search, activeCategory, next);
            }}
            disabled={page >= totalPages - 1}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-navy-900 border border-navy-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="badge-gold text-[10px]">
                  {selectedItem.category}
                </span>
                <h2 className="text-lg font-semibold text-gray-100 mt-1">
                  {selectedItem.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {selectedItem.content}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-navy-700/40">
              {selectedItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs text-gray-400 bg-navy-800/60 px-2.5 py-1 rounded-full"
                >
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
