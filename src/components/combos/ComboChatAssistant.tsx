import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Tag, 
  HelpCircle, 
  RotateCcw,
  Zap,
  Users,
  ChevronDown
} from 'lucide-react';
import { COMBO_OFFERS, ComboOffer } from '../../data/comboOffersData';
import { EVENTS_DATA, EventItem } from '../../data/festivalData';

interface ComboChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComboForWizard: (combo: ComboOffer, selectedEvents: EventItem[]) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  recommendedCombo?: ComboOffer;
  recommendedEvents?: EventItem[];
  suggestedPrompts?: string[];
}

export const ComboChatAssistant: React.FC<ComboChatAssistantProps> = ({
  isOpen,
  onClose,
  onSelectComboForWizard,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'bot',
      text: "👋 Hi! I'm your Celestia'26 Combo Advisor. Tell me about your team size, talent (dance, music, fashion, digital), or budget, and I'll recommend the highest-value package for you!",
      suggestedPrompts: [
        '👥 Large Dance / Variety Team (7–12)',
        '🎤 Solo Singer or Dancer (2–3 events)',
        '👗 Fashion Silhouette + Solo Models',
        '🎬 Digital Reels & Memes (₹199)',
        '👑 All-in-One Mega Package',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const getDefaultEventsForCombo = (combo: ComboOffer): EventItem[] => {
    if (combo.id === 'viral-takeover') {
      return EVENTS_DATA.filter((e) => ['mememania', 'cineverse'].includes(e.id));
    }
    if (combo.id === 'fashion-royale') {
      return EVENTS_DATA.filter((e) => ['silhouette', 'elaris'].includes(e.id));
    }
    if (combo.packageStructure) {
      const { majorCount = 0, minorCount = 0, soloCount = 0 } = combo.packageStructure;
      const selected: EventItem[] = [];
      const majors = EVENTS_DATA.filter((e) => e.type === 'Team' && (e.category === 'dance' || e.category === 'special' || e.category === 'fashion'));
      const minors = EVENTS_DATA.filter((e) => ['adblitz', 'stellar-bid', 'twin-flare'].includes(e.id));
      const solos = EVENTS_DATA.filter((e) => e.type === 'Solo');

      selected.push(...majors.slice(0, majorCount));
      selected.push(...minors.slice(0, minorCount));
      selected.push(...solos.slice(0, soloCount));
      return selected;
    }
    const eligible = combo.eligibleEventIds
      ? EVENTS_DATA.filter((e) => combo.eligibleEventIds?.includes(e.id))
      : EVENTS_DATA;
    const count = combo.minEventsToSelect || combo.maxEventsToSelect || 1;
    return eligible.slice(0, count);
  };

  const processQuery = (userQuery: string) => {
    const q = userQuery.toLowerCase();

    // 1. Digital Events
    if (q.includes('meme') || q.includes('reel') || q.includes('digital') || q.includes('cineverse') || q.includes('199')) {
      const combo = COMBO_OFFERS.find((c) => c.id === 'viral-takeover');
      if (combo) {
        return {
          text: "✨ For creators and digital enthusiasts, the **Viral Takeover Combo** gives you entry into both MemeMania and Cineverse for just ₹199 (flat ₹101 off)! You can submit your work online before the deadlines.",
          combo,
          events: getDefaultEventsForCombo(combo),
          prompts: ['What are the rules for digital events?', 'Show me team combos instead'],
        };
      }
    }

    // 2. Fashion Royale
    if (q.includes('fashion') || q.includes('silhouette') || q.includes('model') || q.includes('ramp')) {
      const combo = COMBO_OFFERS.find((c) => c.id === 'fashion-royale');
      if (combo) {
        return {
          text: "👗 The **Fashion Royale Combo** is custom-designed for runway teams! It covers Silhouette (team ramp walk for up to 10-15 models) PLUS 3 individual solo fashion registrations (like Elaris) with an exclusive bundle rate of ₹3,000 flat!",
          combo,
          events: getDefaultEventsForCombo(combo),
          prompts: ['How many participants can be in Silhouette?', 'Can we add more models?'],
        };
      }
    }

    // 3. Solo performers
    if (q.includes('solo') || q.includes('single') || q.includes('music') || q.includes('dance solo') || q.includes('350') || q.includes('500') || q.includes('singing')) {
      if (q.includes('3') || q.includes('triple') || q.includes('three')) {
        const combo = COMBO_OFFERS.find((c) => c.id === 'triple-threat-solo');
        if (combo) {
          return {
            text: "⭐ The **Triple Threat Solo Combo** is unbeatable! Pick ANY 3 solo events (such as Seraphia music, Nrityara classical dance, or Cosmic Switch) for only ₹500 (saving ₹250). Note: The same talented participant participates across all 3 solo events!",
            combo,
            events: getDefaultEventsForCombo(combo),
            prompts: ['Tell me about the Duo Solo combo', 'Can 1 person do IPL auction too?'],
          };
        }
      }
      const combo = COMBO_OFFERS.find((c) => c.id === 'dynamic-duo-solo');
      if (combo) {
        return {
          text: "🎤 The **Dynamic Duo Solo Combo** lets a single participant compete in ANY 2 solo events (Music, Classical Dance, Western Solo, or Solo IPL Auction) for only ₹350 instead of ₹500! Quick, easy, and single checkout.",
          combo,
          events: getDefaultEventsForCombo(combo),
          prompts: ['Upgrade to 3 solo events for ₹500', 'Do you have team packages?'],
        };
      }
    }

    // 4. Large All-in-one / Group Dance / Team Packages
    if (q.includes('team') || q.includes('group') || q.includes('dance') || q.includes('starfusion') || q.includes('all in one') || q.includes('all-in-one') || q.includes('mega') || q.includes('large') || q.includes('10') || q.includes('7') || q.includes('12')) {
      const combo = COMBO_OFFERS.find((c) => c.id === 'all-in-one-showstopper');
      if (combo) {
        return {
          text: "👑 The **All-in-One Showstopper Combo** is our premier institutional package! It includes 1 Major Team Event (Starfusion Dance or Reflexia), 2 Minor Events (Adzap, Stellar Bid Auction, or Twin Flare), and 2 Solo Events all for just ₹3,000 flat!",
          combo,
          events: getDefaultEventsForCombo(combo),
          prompts: ['How is the price calculated for 7 vs 10 members?', 'Can we choose Adzap and IPL Auction?'],
        };
      }
    }

    // 5. Minor / Adzap / Auction
    if (q.includes('minor') || q.includes('adzap') || q.includes('auction') || q.includes('ipl') || q.includes('stellar')) {
      const combo = COMBO_OFFERS.find((c) => c.id === 'spotlight-duo-minor');
      if (combo) {
        return {
          text: "⚡ The **Spotlight Duo Minor Combo** includes any 2 Minor/Entertainment events (like AdBlitz Adzap + Stellar Bid Mock IPL Auction) with a special package discount!",
          combo,
          events: getDefaultEventsForCombo(combo),
          prompts: ['Can IPL auction be played by 2 people?', 'What about solo events?'],
        };
      }
    }

    // Default fallback recommendation
    const defaultCombo = COMBO_OFFERS.find((c) => c.id === 'all-in-one-showstopper') || COMBO_OFFERS[0];
    return {
      text: "Here are our most popular options:\n\n• **Dynamic Duo Solo (₹350)**: 2 Solo events for 1 participant.\n• **Triple Threat Solo (₹500)**: 3 Solo events for 1 participant.\n• **All-in-One Showstopper (₹3,000)**: 1 Major + 2 Minor + 2 Solo events.\n• **Fashion Royale (₹3,000)**: Silhouette Ramp + 3 Solo Fashion Models.\n• **Viral Takeover (₹199)**: MemeMania + Cineverse Reels.",
      combo: defaultCombo,
      events: getDefaultEventsForCombo(defaultCombo),
      prompts: ['I have a team of 8 for Dance', 'I want solo singing and solo dance', 'Reels and Memes combo'],
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const result = processQuery(query);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.text,
        recommendedCombo: result.combo,
        recommendedEvents: result.events,
        suggestedPrompts: result.prompts,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: "👋 Hi again! Tell me what events or group size you have in mind, and I'll find the best package.",
        suggestedPrompts: [
          '👥 Large Dance / Variety Team (7–12)',
          '🎤 Solo Singer or Dancer (2–3 events)',
          '👗 Fashion Silhouette + Solo Models',
          '🎬 Digital Reels & Memes (₹199)',
        ],
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[#080D21] border border-[#D4AF37]/50 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[680px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0C1438] via-[#121B4A] to-[#0C1438] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 p-0.5 shadow-md flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-base font-bold text-white tracking-wide">
                  Celestia Combo Advisor
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instant package recommendations & rule clarifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Advisor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-[#050816] to-[#070B1E]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-[#0E173D] text-slate-200 border border-white/10 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* If bot recommended a combo, render an interactive action card */}
                {msg.recommendedCombo && (
                  <div className="mt-3 p-3 rounded-xl bg-black/60 border border-[#D4AF37]/50 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {msg.recommendedCombo.categoryTitle}
                      </span>
                      <span className="text-sm font-extrabold text-[#F5E7C4] font-mono">
                        {msg.recommendedCombo.priceType === 'fixed_price'
                          ? `₹${msg.recommendedCombo.comboPrice.toLocaleString()}`
                          : `${msg.recommendedCombo.discountPercentage}% OFF`}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-white">
                        {msg.recommendedCombo.name}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {msg.recommendedCombo.shortDescription}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectComboForWizard(
                          msg.recommendedCombo!,
                          msg.recommendedEvents || getDefaultEventsForCombo(msg.recommendedCombo!)
                        );
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-[#D4AF37] text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                    >
                      <span>Enroll in this Combo Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Suggested Follow-up Prompts */}
              {msg.suggestedPrompts && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                  {msg.suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-200 transition-all cursor-pointer font-medium"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Celestia Advisor is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#070B1E] border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything (e.g. 'Dance team of 8', 'Solo 2 events')..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37]"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
