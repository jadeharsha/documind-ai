import React, { useState, useEffect } from 'react';
import { User, Shield, Cpu, Sliders, Database, Save, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const [profile, setProfile] = useState({
    bio: user?.profile?.bio || '',
    organization: user?.profile?.organization || '',
    job_title: user?.profile?.job_title || ''
  });
  const [settings, setSettings] = useState({
    preferred_llm_provider: user?.settings?.preferred_llm_provider || 'ollama',
    preferred_model_name: user?.settings?.preferred_model_name || 'llama3.2',
    temperature: user?.settings?.temperature || 0.2,
    citation_style: user?.settings?.citation_style || 'academic'
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        bio: user.profile?.bio || '',
        organization: user.profile?.organization || '',
        job_title: user.profile?.job_title || ''
      });
      setSettings({
        preferred_llm_provider: user.settings?.preferred_llm_provider || 'ollama',
        preferred_model_name: user.settings?.preferred_model_name || 'llama3.2',
        temperature: user.settings?.temperature || 0.2,
        citation_style: user.settings?.citation_style || 'academic'
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile(profile);
      await api.updateSettings(settings);
      await fetchUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(`Error updating settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">System & Account Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Configure profile details, LLM model providers, citation formats, and tenant data policies.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-500" />
            <span>Profile & Organization</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Organization</label>
              <input
                type="text"
                value={profile.organization}
                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                placeholder="DeepMind Research, Stanford Lab"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Job Title / Role</label>
              <input
                type="text"
                value={profile.job_title}
                onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                placeholder="AI Engineer / Researcher"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Bio</label>
            <textarea
              rows={2}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Brief description of research focus"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* AI & Model Providers Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-500" />
            <span>AI Orchestration & LLM Provider Abstraction</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Default LLM Provider</label>
              <select
                value={settings.preferred_llm_provider}
                onChange={(e) => setSettings({ ...settings, preferred_llm_provider: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ollama">Ollama (Local Offline Model)</option>
                <option value="openai">OpenAI (GPT-4o Mini)</option>
                <option value="gemini">Google Gemini (1.5 Flash)</option>
                <option value="anthropic">Anthropic Claude (3.5 Sonnet)</option>
                <option value="groq">Groq (Ultra-Low Latency Llama)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Model Name</label>
              <input
                type="text"
                value={settings.preferred_model_name}
                onChange={(e) => setSettings({ ...settings, preferred_model_name: e.target.value })}
                placeholder="llama3.2, gpt-4o, gemini-1.5-flash"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Temperature (Strict Grounding: 0.1 - 0.3)</label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="1.0"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) || 0.2 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Citation Format</label>
              <select
                value={settings.citation_style}
                onChange={(e) => setSettings({ ...settings, citation_style: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="academic">Academic [Title, Page X]</option>
                <option value="compact">Compact [P. X]</option>
                <option value="footnote">Footnote Provenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
