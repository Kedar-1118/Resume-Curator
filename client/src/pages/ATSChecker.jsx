import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { scoreUploadedResume } from '@/lib/api';
import ATSScoreCard from '@/components/ai/ATSScoreCard';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

export default function ATSChecker() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const isTargeted = jobDescription.trim().length > 0;
  const canAnalyze = !!file && !analyzing;

  // ── Drag and drop handlers ──────────────────────────────────
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (allowed.includes(droppedFile.type)) {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast.error('Only PDF and DOCX files are supported');
      }
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const data = await scoreUploadedResume(file, jobDescription);
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">ATS Resume Checker</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            Upload your resume to get an instant ATS compatibility score. Optionally paste a job description for a targeted analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column — Upload + JD */}
          <div className="lg:col-span-2 space-y-5">
            {/* Upload Zone */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  📄 Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : file
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-white/15 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {file ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/15 mb-1">
                        <span className="text-2xl">✅</span>
                      </div>
                      <p className="text-sm font-medium text-white truncate max-w-full">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 cursor-pointer"
                      >
                        Remove & upload different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/15 mb-1">
                        <span className="text-2xl">📁</span>
                      </div>
                      <p className="text-sm text-slate-300">
                        <span className="text-indigo-400 font-medium">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-xs text-slate-500">PDF or DOCX • Max 10MB</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Description (Optional) */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">📋 Job Description</span>
                  <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5">
                    Optional
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Paste a job description here for a targeted ATS score. Leave empty for a general ATS best-practices score."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{jobDescription.length} characters</span>
                  {/* Mode indicator */}
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isTargeted
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                      : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
                    }`}>
                    {isTargeted ? '🎯 Targeted Score' : '📏 General Score'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white h-12 text-sm font-semibold shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing your resume...
                </span>
              ) : (
                <>🤖 {isTargeted ? 'Run Targeted Analysis' : 'Run General ATS Check'}</>
              )}
            </Button>

            {!file && (
              <p className="text-[11px] text-slate-600 text-center">
                Upload a resume file first to enable analysis
              </p>
            )}
          </div>

          {/* Right Column — Results */}
          <div className="lg:col-span-3">
            {/* Analysis in progress */}
            {analyzing && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-300">AI is analyzing your resume...</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isTargeted
                          ? 'Comparing against your job description'
                          : 'Evaluating general ATS compatibility'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {!analyzing && result && (
              <div className="space-y-5">
                {/* Mode banner */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  result.mode === 'targeted'
                    ? 'bg-indigo-500/10 border-indigo-500/20'
                    : 'bg-slate-700/20 border-slate-600/20'
                }`}>
                  <span className="text-lg">{result.mode === 'targeted' ? '🎯' : '📏'}</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {result.mode === 'targeted' ? 'Targeted Analysis' : 'General ATS Analysis'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {result.mode === 'targeted'
                        ? 'Scored against your provided job description'
                        : 'Scored against universal ATS best practices'}
                    </p>
                  </div>
                </div>

                {/* ATS Score Card */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      📊 ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ATSScoreCard
                      result={result}
                      loading={false}
                      lastAnalyzed={new Date().toISOString()}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty state */}
            {!analyzing && !result && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10">
                      <span className="text-4xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white mb-1">Results will appear here</h3>
                      <p className="text-sm text-slate-500 max-w-sm">
                        Upload your resume and click analyze to see your ATS compatibility score with detailed feedback.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-4 p-4 rounded-xl bg-white/5 border border-white/10 max-w-xs">
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Two scoring modes</p>
                      <div className="space-y-2 text-left w-full">
                        <div className="flex items-start gap-2">
                          <span className="text-xs mt-0.5">📏</span>
                          <div>
                            <p className="text-xs text-slate-300 font-medium">General Score</p>
                            <p className="text-[11px] text-slate-500">ATS best practices & formatting</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs mt-0.5">🎯</span>
                          <div>
                            <p className="text-xs text-slate-300 font-medium">Targeted Score</p>
                            <p className="text-[11px] text-slate-500">Paste a JD for keyword-matched scoring</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
