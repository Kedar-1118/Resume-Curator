import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMe, getResume, updateResume, getATSScore, getKeywords } from '@/lib/api';
import useResumeStore from '@/store/resumeStore';
import ATSScoreCard from '@/components/ai/ATSScoreCard';
import KeywordGapPanel from '@/components/ai/KeywordGapPanel';
import SummaryGenerator from '@/components/ai/SummaryGenerator';
import JDIntelBanner from '@/components/ai/JDIntelBanner';
import CoverLetterPanel from '@/components/ai/CoverLetterPanel';
import VersionHistoryPanel from '@/components/ai/VersionHistoryPanel';
import JDTargetsPanel from '@/components/ai/JDTargetsPanel';
import GitHubPanel from '@/components/ai/GitHubPanel';
import ATSSparkline from '@/components/ai/ATSSparkline';
import { toast } from 'sonner';

export default function Analyze() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [keywordResult, setKeywordResult] = useState(null);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [activeSection, setActiveSection] = useState('analysis'); // 'analysis' | 'cover' | 'github' | 'history' | 'targets'

  const resume = useResumeStore((s) => s.resume);
  const setResume = useResumeStore((s) => s.setResume);
  const updateField = useResumeStore((s) => s.updateField);
  const setATSResult = useResumeStore((s) => s.setATSResult);
  const setKeywordResultStore = useResumeStore((s) => s.setKeywordResult);

  // Auth + load resume
  useEffect(() => {
    const init = async () => {
      try {
        await getMe();
        const data = await getResume(id);
        setResume(data);
        setLastAnalyzed(data.lastAnalyzed);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [id, navigate, setResume]);

  // Save JD on blur
  const handleJDBlur = async () => {
    if (resume._id && resume.targetJD) {
      try {
        await updateResume(resume._id, { targetJD: resume.targetJD });
      } catch {
        // Silent fail — will save on next auto-save
      }
    }
  };

  // Run full analysis
  const handleAnalyze = async () => {
    if (!resume.targetJD?.trim()) {
      toast.error('Paste a job description first');
      return;
    }
    setAnalyzing(true);
    setScoreResult(null);
    setKeywordResult(null);

    try {
      // Save JD first
      await updateResume(resume._id, { targetJD: resume.targetJD });

      // Run both in parallel
      const [score, keywords] = await Promise.all([
        getATSScore({ resumeId: resume._id }),
        getKeywords({ resumeId: resume._id }),
      ]);

      setScoreResult(score);
      setKeywordResult(keywords);
      setATSResult(score);
      setKeywordResultStore(keywords);
      setLastAnalyzed(new Date().toISOString());
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Analysis failed — check your API key');
    } finally {
      setAnalyzing(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'analysis', label: '📊 Analysis', shortLabel: '📊' },
    { key: 'cover', label: '✉️ Cover Letter', shortLabel: '✉️' },
    { key: 'github', label: '🐙 GitHub', shortLabel: '🐙' },
    { key: 'targets', label: '🎯 Multi-JD', shortLabel: '🎯' },
    { key: 'history', label: '🕐 History', shortLabel: '🕐' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              R
            </div>
          </Link>
          <div className="h-5 w-px bg-white/15 hidden sm:block" />
          <span className="text-sm font-medium text-slate-300 truncate max-w-[200px]">
            {resume.title || 'Untitled Resume'}
          </span>
          <span className="text-xs text-slate-600 hidden sm:inline">→ AI Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {/* ATS Score Sparkline */}
          {resume.atsScores?.length >= 2 && (
            <div className="hidden sm:flex items-center gap-2">
              <ATSSparkline scores={resume.atsScores} />
              <div className="h-5 w-px bg-white/15" />
            </div>
          )}
          <Link to={`/builder/${id}`}>
            <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white cursor-pointer">
              ← Back to Builder
            </Button>
          </Link>
        </div>
      </nav>

      {/* Section tabs */}
      <div className="sticky top-[57px] z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`px-3 sm:px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
                activeSection === s.key
                  ? 'text-white border-indigo-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ═══ Analysis Section ═══ */}
        {activeSection === 'analysis' && (
          <>
            {/* JD Intelligence Banner */}
            {resume.parsedJD?.company && <JDIntelBanner parsedJD={resume.parsedJD} />}

            {/* Job Description Input */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  📋 Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Paste the full job description here... The AI will analyze your resume against these requirements and identify keyword gaps, score your ATS compatibility, and suggest improvements."
                  value={resume.targetJD || ''}
                  onChange={(e) => updateField('targetJD', null, e.target.value)}
                  onBlur={handleJDBlur}
                  rows={8}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm resize-none"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {(resume.targetJD || '').length} characters
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || !(resume.targetJD?.trim())}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 cursor-pointer w-full sm:w-auto"
                  >
                    {analyzing ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Analyzing...
                      </span>
                    ) : (
                      '🤖 Run Full Analysis'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis progress */}
            {analyzing && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300">AI is analyzing your resume...</p>
                  <p className="text-xs text-slate-500 mt-1">Scoring ATS compatibility and finding keyword gaps</p>
                </div>
              </div>
            )}

            {/* Results grid */}
            {!analyzing && (scoreResult || keywordResult) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ATS Score */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        📊 ATS Score
                      </CardTitle>
                      {resume.atsScores?.length >= 2 && (
                        <ATSSparkline scores={resume.atsScores} width={80} height={24} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ATSScoreCard
                      result={scoreResult}
                      loading={false}
                      lastAnalyzed={lastAnalyzed}
                    />
                  </CardContent>
                </Card>

                {/* Keywords */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      🔑 Keyword Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeywordGapPanel result={keywordResult} loading={false} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Summary Generator */}
            {!analyzing && resume.targetJD?.trim() && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    ✨ AI Summary Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resume.summary && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Current Summary</span>
                        <p className="text-sm text-slate-400 p-3 rounded-lg bg-white/5">{resume.summary}</p>
                      </div>
                    )}
                    <SummaryGenerator />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ═══ Cover Letter Section ═══ */}
        {activeSection === 'cover' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <CoverLetterPanel />
            </CardContent>
          </Card>
        )}

        {/* ═══ GitHub Section ═══ */}
        {activeSection === 'github' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <GitHubPanel />
            </CardContent>
          </Card>
        )}

        {/* ═══ Multi-JD Targets Section ═══ */}
        {activeSection === 'targets' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <JDTargetsPanel />
            </CardContent>
          </Card>
        )}

        {/* ═══ Version History Section ═══ */}
        {activeSection === 'history' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <VersionHistoryPanel />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
