import { BookOpen, Scale, FolderTree, Gavel, Lightbulb } from 'lucide-react';

export interface RecommendationData {
  relatedActs?: string[];
  relatedSections?: string[];
  relatedLegalTopics?: string[];
  relatedCourtProcedures?: string[];
}

interface RecommendationsProps {
  data: RecommendationData;
  onTopicClick?: (topic: string) => void;
  compact?: boolean;
}

export default function Recommendations({ data, onTopicClick, compact = false }: RecommendationsProps) {
  const groups = [
    { key: 'relatedActs', label: 'Related Acts', icon: BookOpen, items: data.relatedActs },
    { key: 'relatedSections', label: 'Related Sections', icon: Scale, items: data.relatedSections },
    { key: 'relatedLegalTopics', label: 'Related Legal Topics', icon: FolderTree, items: data.relatedLegalTopics },
    { key: 'relatedCourtProcedures', label: 'Related Court Procedures', icon: Gavel, items: data.relatedCourtProcedures },
  ].filter((g) => g.items && g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className={`rounded-lg border border-gold-500/20 bg-gradient-to-br from-navy-800/60 to-navy-900/60 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gold-500/20 flex items-center justify-center">
          <Lightbulb size={14} className="text-gold-400" />
        </div>
        <h4 className="text-xs font-semibold text-gold-400 uppercase tracking-wider">AI Recommendations</h4>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.key} className="bg-navy-900/50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} className="text-gold-500" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{g.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.items!.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onTopicClick?.(item)}
                    className="text-[11px] px-2 py-1 rounded-md bg-navy-800 text-gray-300 hover:bg-gold-500/20 hover:text-gold-300 transition-colors text-left"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
