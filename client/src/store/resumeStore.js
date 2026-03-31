import { create } from 'zustand';

const defaultResume = {
  _id: null,
  title: 'Untitled Resume',
  personal: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  targetJD: '',
  atsScore: null,
  atsBreakdown: null,
  template: 'modern',
};

const useResumeStore = create((set, get) => ({
  // Current resume being edited
  resume: { ...defaultResume },

  // UI state
  activeTab: 'personal',
  isDirty: false,
  isSaving: false,
  isAnalyzing: false,

  // AI results
  atsResult: null,
  keywordResult: null,

  // ─── Actions ─────────────────────────────────────────────

  setResume: (resume) =>
    set({
      resume: { ...defaultResume, ...resume },
      isDirty: false,
    }),

  updateField: (section, field, value) =>
    set((state) => {
      if (field) {
        // Nested field: resume.personal.name
        return {
          resume: {
            ...state.resume,
            [section]: {
              ...state.resume[section],
              [field]: value,
            },
          },
          isDirty: true,
        };
      }
      // Top-level field: resume.summary
      return {
        resume: {
          ...state.resume,
          [section]: value,
        },
        isDirty: true,
      };
    }),

  addExperience: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: [
          ...state.resume.experience,
          {
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            bullets: [''],
          },
        ],
      },
      isDirty: true,
    })),

  removeExperience: (index) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.filter((_, i) => i !== index),
      },
      isDirty: true,
    })),

  updateExperience: (index, field, value) =>
    set((state) => {
      const experience = [...state.resume.experience];
      experience[index] = { ...experience[index], [field]: value };
      return {
        resume: { ...state.resume, experience },
        isDirty: true,
      };
    }),

  addBullet: (expIndex) =>
    set((state) => {
      const experience = [...state.resume.experience];
      experience[expIndex] = {
        ...experience[expIndex],
        bullets: [...experience[expIndex].bullets, ''],
      };
      return {
        resume: { ...state.resume, experience },
        isDirty: true,
      };
    }),

  removeBullet: (expIndex, bulletIndex) =>
    set((state) => {
      const experience = [...state.resume.experience];
      experience[expIndex] = {
        ...experience[expIndex],
        bullets: experience[expIndex].bullets.filter((_, i) => i !== bulletIndex),
      };
      return {
        resume: { ...state.resume, experience },
        isDirty: true,
      };
    }),

  updateBullet: (expIndex, bulletIndex, value) =>
    set((state) => {
      const experience = [...state.resume.experience];
      const bullets = [...experience[expIndex].bullets];
      bullets[bulletIndex] = value;
      experience[expIndex] = { ...experience[expIndex], bullets };
      return {
        resume: { ...state.resume, experience },
        isDirty: true,
      };
    }),

  // Education actions
  addEducation: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: [
          ...state.resume.education,
          { degree: '', school: '', location: '', year: '', gpa: '' },
        ],
      },
      isDirty: true,
    })),

  removeEducation: (index) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.filter((_, i) => i !== index),
      },
      isDirty: true,
    })),

  updateEducation: (index, field, value) =>
    set((state) => {
      const education = [...state.resume.education];
      education[index] = { ...education[index], [field]: value };
      return {
        resume: { ...state.resume, education },
        isDirty: true,
      };
    }),

  // Project actions
  addProject: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        projects: [
          ...state.resume.projects,
          { name: '', description: '', technologies: '', link: '', bullets: [''] },
        ],
      },
      isDirty: true,
    })),

  removeProject: (index) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projects: state.resume.projects.filter((_, i) => i !== index),
      },
      isDirty: true,
    })),

  updateProject: (index, field, value) =>
    set((state) => {
      const projects = [...state.resume.projects];
      projects[index] = { ...projects[index], [field]: value };
      return {
        resume: { ...state.resume, projects },
        isDirty: true,
      };
    }),

  addProjectBullet: (projIndex) =>
    set((state) => {
      const projects = [...state.resume.projects];
      projects[projIndex] = {
        ...projects[projIndex],
        bullets: [...projects[projIndex].bullets, ''],
      };
      return {
        resume: { ...state.resume, projects },
        isDirty: true,
      };
    }),

  removeProjectBullet: (projIndex, bulletIndex) =>
    set((state) => {
      const projects = [...state.resume.projects];
      projects[projIndex] = {
        ...projects[projIndex],
        bullets: projects[projIndex].bullets.filter((_, i) => i !== bulletIndex),
      };
      return {
        resume: { ...state.resume, projects },
        isDirty: true,
      };
    }),

  updateProjectBullet: (projIndex, bulletIndex, value) =>
    set((state) => {
      const projects = [...state.resume.projects];
      const bullets = [...projects[projIndex].bullets];
      bullets[bulletIndex] = value;
      projects[projIndex] = { ...projects[projIndex], bullets };
      return {
        resume: { ...state.resume, projects },
        isDirty: true,
      };
    }),

  setTemplate: (template) =>
    set((state) => ({
      resume: { ...state.resume, template },
      isDirty: true,
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setATSResult: (result) => set({ atsResult: result }),

  setKeywordResult: (result) => set({ keywordResult: result }),

  setSaving: (isSaving) => set({ isSaving }),

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  markSaved: () => set({ isDirty: false, isSaving: false }),

  resetResume: () =>
    set({
      resume: { ...defaultResume },
      activeTab: 'personal',
      isDirty: false,
      atsResult: null,
      keywordResult: null,
    }),
}));

export default useResumeStore;
