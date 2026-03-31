import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useResumeStore from '@/store/resumeStore';
import { getResume, updateResume, getMe, parseResumeFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ResumePreview from '@/components/preview/ResumePreview';
import ExportButtons from '@/components/ExportButtons';
import PersonalInfo from '@/components/form/PersonalInfo';
import Summary from '@/components/form/Summary';
import Experience from '@/components/form/Experience';
import Education from '@/components/form/Education';
import Skills from '@/components/form/Skills';
import Certifications from '@/components/form/Certifications';
import Projects from '@/components/form/Projects';

export default function Builder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [previewScale, setPreviewScale] = useState(1);
  const [mobileView, setMobileView] = useState('form'); // 'form' | 'preview'
  const [uploading, setUploading] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const previewContainerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const resume = useResumeStore((s) => s.resume);
  const activeTab = useResumeStore((s) => s.activeTab);
  const isDirty = useResumeStore((s) => s.isDirty);
  const isSaving = useResumeStore((s) => s.isSaving);
  const setResume = useResumeStore((s) => s.setResume);
  const setActiveTab = useResumeStore((s) => s.setActiveTab);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const setSaving = useResumeStore((s) => s.setSaving);
  const markSaved = useResumeStore((s) => s.markSaved);
  const updateField = useResumeStore((s) => s.updateField);

  // Auth check + load resume
  useEffect(() => {
    const init = async () => {
      try {
        await getMe();
        const data = await getResume(id);
        setResume(data);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, navigate, setResume]);

  // Calculate preview scale to fit container
  useEffect(() => {
    const calculateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth - 48; // padding
        const containerHeight = previewContainerRef.current.clientHeight - 48;
        const scaleX = containerWidth / 794;
        const scaleY = containerHeight / 1123;
        setPreviewScale(Math.min(scaleX, scaleY, 1));
      }
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [loading, mobileView]);

  // Auto-save (debounce 30s)
  const save = useCallback(async () => {
    if (!resume._id) return;
    try {
      setSaving(true);
      const { _id, userId, createdAt, updatedAt, __v, ...data } = resume;
      await updateResume(resume._id, data);
      markSaved();
      toast.success('Resume saved');
    } catch {
      toast.error('Failed to save');
      setSaving(false);
    }
  }, [resume, setSaving, markSaved]);

  useEffect(() => {
    if (!isDirty || !resume._id) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, 30000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, resume, save]);

  // Manual save with Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) save();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, save]);

  // ── Resume upload auto-populate ────────────────────────────
  const hasFormData = () => {
    const p = resume.personal || {};
    return (
      p.name || p.email || p.phone ||
      resume.summary ||
      resume.experience?.length > 0 ||
      resume.education?.length > 0 ||
      resume.skills?.length > 0
    );
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    if (hasFormData()) {
      setPendingFile(file);
      setShowUploadConfirm(true);
    } else {
      processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file) => {
    setShowUploadConfirm(false);
    setUploading(true);
    try {
      const parsed = await parseResumeFile(file);
      // Keep the current resume's _id, userId, and template — overwrite content fields
      setResume({
        ...parsed,
        _id: resume._id,
        userId: resume.userId,
        template: resume.template || 'modern',
      });
      toast.success('Resume parsed! Fields have been auto-populated.');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to parse resume file');
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500">Loading resume...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'personal', label: 'Personal' },
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'projects', label: 'Projects' },
    { key: 'skills', label: 'Skills' },
    { key: 'certifications', label: 'Certs' },
  ];

  const templates = [
    { key: 'classic', label: 'Classic' },
    { key: 'modern', label: 'Modern' },
    { key: 'professional', label: 'Professional' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              R
            </div>
          </Link>
          <div className="h-5 w-px bg-white/15 hidden sm:block" />
          <Input
            value={resume.title || ''}
            onChange={(e) => updateField('title', null, e.target.value)}
            className="bg-transparent border-none text-white font-semibold text-sm h-8 w-36 sm:w-56 px-2 focus:bg-white/5 rounded"
            placeholder="Resume title..."
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Save indicator */}
          <span className="text-xs text-slate-500 min-w-[56px] text-right hidden sm:inline">
            {isSaving ? (
              <span className="text-amber-400">Saving...</span>
            ) : isDirty ? (
              <span className="text-slate-500">Unsaved</span>
            ) : (
              <span className="text-green-400/70">Saved ✓</span>
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={save}
            disabled={!isDirty || isSaving}
            className="text-xs text-slate-400 hover:text-white h-8 cursor-pointer"
          >
            💾 Save
          </Button>

          {/* Upload Resume Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-slate-400 hover:text-white h-8 cursor-pointer"
            title="Upload PDF/DOCX to auto-fill fields"
          >
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                <span className="hidden sm:inline">Parsing...</span>
              </span>
            ) : (
              <>
                📄 <span className="hidden sm:inline">Upload Resume</span>
              </>
            )}
          </Button>

          <div className="h-5 w-px bg-white/15 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1">
            <ExportButtons resumeId={resume._id} template={resume.template} />
          </div>

          <div className="h-5 w-px bg-white/15 hidden sm:block" />

          <Button
            size="sm"
            onClick={() => navigate(`/analyze/${id}`)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 cursor-pointer"
          >
            🤖 <span className="hidden sm:inline">Analyze with AI</span><span className="sm:hidden">AI</span>
          </Button>
        </div>
      </header>

      {/* Mobile view toggle */}
      <div className="flex lg:hidden border-b border-white/10 shrink-0">
        <button
          onClick={() => setMobileView('form')}
          className={`flex-1 py-2 text-xs font-medium text-center transition-colors cursor-pointer ${
            mobileView === 'form'
              ? 'text-white bg-white/5 border-b-2 border-indigo-500'
              : 'text-slate-500'
          }`}
        >
          ✏️ Edit Form
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-xs font-medium text-center transition-colors cursor-pointer ${
            mobileView === 'preview'
              ? 'text-white bg-white/5 border-b-2 border-indigo-500'
              : 'text-slate-500'
          }`}
        >
          👁️ Preview
        </button>
      </div>

      {/* Main split view */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL — Form */}
        <div
          className={`lg:w-[45%] lg:border-r border-white/10 flex flex-col min-h-0 ${
            mobileView === 'form' ? 'w-full' : 'hidden lg:flex'
          }`}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="px-4 pt-3 pb-0 shrink-0">
              <TabsList className="w-full bg-white/5 h-9">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="flex-1 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white cursor-pointer"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfo />
              </TabsContent>
              <TabsContent value="summary" className="mt-0">
                <Summary />
              </TabsContent>
              <TabsContent value="experience" className="mt-0">
                <Experience />
              </TabsContent>
              <TabsContent value="education" className="mt-0">
                <Education />
              </TabsContent>
              <TabsContent value="projects" className="mt-0">
                <Projects />
              </TabsContent>
              <TabsContent value="skills" className="mt-0">
                <Skills />
              </TabsContent>
              <TabsContent value="certifications" className="mt-0">
                <Certifications />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* RIGHT PANEL — Preview */}
        <div
          className={`lg:w-[55%] flex flex-col min-h-0 ${
            mobileView === 'preview' ? 'w-full' : 'hidden lg:flex'
          }`}
        >
          {/* Template selector */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 shrink-0">
            <span className="text-xs text-slate-500 mr-2">Template:</span>
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  resume.template === t.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Mobile export buttons */}
            <div className="flex sm:hidden items-center gap-1 ml-auto">
              <ExportButtons resumeId={resume._id} template={resume.template} />
            </div>
          </div>

          {/* Preview area */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto flex items-start justify-center p-6 min-h-0"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
              }}
            >
              <ResumePreview />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showUploadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowUploadConfirm(false); setPendingFile(null); }}
          />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50 animate-in zoom-in-95 fade-in duration-200">
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="text-base font-semibold text-white mb-1">Overwrite Form Data?</h3>
            <p className="text-sm text-slate-400 mb-5">
              This will replace all current form fields with data extracted from the uploaded resume. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => { setShowUploadConfirm(false); setPendingFile(null); }}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => processUploadedFile(pendingFile)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 text-sm cursor-pointer"
              >
                Overwrite & Populate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
