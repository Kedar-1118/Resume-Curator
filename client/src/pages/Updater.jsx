import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { improveResume, createResume } from '@/lib/api';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

export default function Updater() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [improving, setImproving] = useState(false);

  const handleImprove = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume text first');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please paste the job description');
      return;
    }

    setImproving(true);
    try {
      // Step 1: Get AI-improved resume data
      const improved = await improveResume({ resumeText, jobDescription });

      // Step 2: Persist as a new resume document in MongoDB
      const newResume = await createResume({
        ...improved,
        title: improved.title || 'Improved Resume',
        template: 'modern',
        targetJD: jobDescription,
      });

      toast.success('Resume improved and saved!');
      navigate(`/builder/${newResume._id}`);
    } catch (err) {
      toast.error(
        err?.response?.data?.error || 'Failed to improve resume — check your API key'
      );
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Improve Your Resume</h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Paste your existing resume and the target job description. Our AI will
            optimize it for maximum ATS compatibility.
          </p>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              step === 1
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : resumeText.trim()
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-white/5 text-slate-500 border border-white/10'
            }`}
            onClick={() => setStep(1)}
          >
            {resumeText.trim() && step !== 1 ? '✓' : '1'} Resume Text
          </div>
          <div className="w-8 h-px bg-white/10" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              step === 2
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : jobDescription.trim()
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-white/5 text-slate-500 border border-white/10'
            }`}
            onClick={() => setStep(2)}
          >
            {jobDescription.trim() && step !== 2 ? '✓' : '2'} Job Description
          </div>
        </div>

        {/* Loading overlay */}
        {improving && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-10">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white mb-1">
                    Analyzing and optimizing your resume...
                  </p>
                  <p className="text-xs text-slate-500">
                    This may take 15–30 seconds. We're extracting your experience,
                    matching it against the job requirements, and rewriting for maximum impact.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Resume text */}
        {!improving && step === 1 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Step 1
                </span>
              </div>
              <h2 className="text-base font-semibold text-white mb-1">
                Paste your existing resume
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                💡 Tip: Open your current resume file, select all text (Ctrl+A), copy it (Ctrl+C), and paste it here.
              </p>
              <Textarea
                placeholder="Paste your full resume text here...

Example:
John Doe
Software Engineer
john@email.com | (555) 123-4567

Experience:
Software Engineer at Company X (2020 - Present)
• Built and maintained React applications..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={16}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-600">
                  {resumeText.length} characters
                </span>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!resumeText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 cursor-pointer"
                >
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Job description */}
        {!improving && step === 2 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Step 2
                </span>
              </div>
              <h2 className="text-base font-semibold text-white mb-1">
                Paste the job description
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                💡 Tip: Copy the full job posting including requirements, responsibilities, and qualifications.
              </p>
              <Textarea
                placeholder="Paste the full job description here...

Example:
We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={14}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white text-sm cursor-pointer"
                  >
                    ← Back
                  </Button>
                  <span className="text-xs text-slate-600">
                    {jobDescription.length} characters
                  </span>
                </div>
                <Button
                  onClick={handleImprove}
                  disabled={!resumeText.trim() || !jobDescription.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  ✨ Improve My Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
