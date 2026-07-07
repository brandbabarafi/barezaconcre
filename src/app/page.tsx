/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import {
  generateScriptWithGemini,
  transcribeAndAnalyzeWithGemini,
  getMockScript,
  getMockTranscription
} from "./prompt-helper";

// Interface Definitions
interface ContentItem {
  id: string;
  title: string;
  platform: "TikTok" | "Instagram Reels" | "Both";
  idea: string;
  script: string;
  status: "Draft" | "Waiting Approval" | "Approved" | "Revision" | "Published";
  revisionNotes?: string;
  publishDate: string;
  socialLink?: string;
  driveLink?: string;
  createdAt: string;
}

interface ResearchItem {
  id: string;
  fileName: string;
  transcription: string;
  analysis: string;
  createdAt: string;
}

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "script-writer" | "fyp-analyzer" | "hook-trainer" | "settings"
  >("dashboard");

  // Local Storage Saved Credentials
  const [apiKey, setApiKey] = useState("");
  const [driveFolder, setDriveFolder] = useState("");
  const [hookKnowledge, setHookKnowledge] = useState("");

  // Data States
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [researches, setResearches] = useState<ResearchItem[]>([]);

  // UI Flow States
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState<"TikTok" | "Instagram Reels" | "Both">("TikTok");
  const [newIdea, setNewIdea] = useState("");
  
  // AI Script Writer Workspace States
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptPlatform, setScriptPlatform] = useState<"TikTok" | "Instagram Reels">("TikTok");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isEditingScript, setIsEditingScript] = useState(false);

  // FYP Analyzer States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fypOutput, setFypOutput] = useState<{ transcription: string; analysis: string } | null>(null);

  // Modal / Detail State for Dashboard
  const [activeContentDetail, setActiveContentDetail] = useState<ContentItem | null>(null);
  const [isManagerPreview, setIsManagerPreview] = useState(false);
  const [managerComment, setManagerComment] = useState("");

  // Hydration fix & Initial Load
  useEffect(() => {
    setIsClient(true);
    // Load config from LocalStorage
    setApiKey(localStorage.getItem("bz_gemini_key") || "");
    setDriveFolder(localStorage.getItem("bz_gdrive_folder") || "");
    setHookKnowledge(localStorage.getItem("bz_hook_knowledge") || "");
    
    // Load data from LocalStorage
    const savedContents = localStorage.getItem("bz_contents");
    if (savedContents) {
      setContents(JSON.parse(savedContents));
    } else {
      // Set dummy/demo content if empty
      const demoContents: ContentItem[] = [
        {
          id: "demo-1",
          title: "Kebab Daging Melimpah tapi Cicilan Tipis",
          platform: "TikTok",
          idea: "Sarkas tentang kebiasaan beli kopi mahal dibanding beli kebab porsi kenyang",
          script: getMockScript("Sarkas kopi vs kebab", "TikTok"),
          status: "Draft",
          publishDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-2",
          title: "Drama Pembeli Banyak Nanya tapi Gak Beli",
          platform: "Instagram Reels",
          idea: "Sindiran halus bagi tipe pembeli yang suka nanya detail menu tapi ujungnya cuma minta wifi gratis",
          script: getMockScript("Drama nanya detail", "Instagram Reels"),
          status: "Waiting Approval",
          publishDate: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString()
        }
      ];
      setContents(demoContents);
      localStorage.setItem("bz_contents", JSON.stringify(demoContents));
    }

    const savedResearches = localStorage.getItem("bz_researches");
    if (savedResearches) {
      setResearches(JSON.parse(savedResearches));
    }
  }, []);

  // Save Contents Helper
  const saveContentsToStorage = (updatedList: ContentItem[]) => {
    setContents(updatedList);
    localStorage.setItem("bz_contents", JSON.stringify(updatedList));
  };

  // Save Researches Helper
  const saveResearchesToStorage = (updatedList: ResearchItem[]) => {
    setResearches(updatedList);
    localStorage.setItem("bz_researches", JSON.stringify(updatedList));
  };

  // Settings Save Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bz_gemini_key", apiKey);
    localStorage.setItem("bz_gdrive_folder", driveFolder);
    localStorage.setItem("bz_hook_knowledge", hookKnowledge);
    
    setStatusMessage("Pengaturan berhasil disimpan secara lokal!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // AI Script Generation Handler
  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      setErrorMessage("Topik tidak boleh kosong!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("Menghubungi AI Crew Baba Rafi...");

    try {
      let script = "";
      if (apiKey.trim()) {
        script = await generateScriptWithGemini(apiKey, scriptTopic, hookKnowledge, scriptPlatform);
      } else {
        // Fallback to offline mock with notification
        setStatusMessage("Menjalankan mode simulasi (Kunci API Gemini belum dipasang)...");
        await new Promise((r) => setTimeout(r, 1500));
        script = getMockScript(scriptTopic, scriptPlatform);
      }
      setGeneratedScript(script);
      setIsEditingScript(true);
      setStatusMessage("Skrip berhasil dibuat!");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal membuat skrip.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Save Generated Script to Pipeline
  const handleSaveScriptToPipeline = () => {
    if (!generatedScript.trim()) return;

    const newContentItem: ContentItem = {
      id: "cnt-" + Math.random().toString(36).substring(2, 9),
      title: scriptTopic || "Skrip AI Tanpa Judul",
      platform: scriptPlatform === "TikTok" ? "TikTok" : "Instagram Reels",
      idea: scriptTopic,
      script: generatedScript,
      status: "Draft",
      publishDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    saveContentsToStorage([newContentItem, ...contents]);
    setScriptTopic("");
    setGeneratedScript("");
    setIsEditingScript(false);
    setActiveTab("dashboard");
    setStatusMessage("Skrip disimpan ke Pipeline!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Direct Content Addition Form Handler
  const handleQuickAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item: ContentItem = {
      id: "cnt-" + Math.random().toString(36).substring(2, 9),
      title: newTitle,
      platform: newPlatform,
      idea: newIdea,
      script: "",
      status: "Draft",
      publishDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };

    saveContentsToStorage([item, ...contents]);
    setNewTitle("");
    setNewIdea("");
    setStatusMessage("Ide konten ditambahkan!");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  // Content CRUD and updates
  const handleUpdateStatus = (id: string, newStatus: ContentItem["status"]) => {
    const updated = contents.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    saveContentsToStorage(updated);
    
    // Sync UI detail if open
    if (activeContentDetail && activeContentDetail.id === id) {
      setActiveContentDetail({ ...activeContentDetail, status: newStatus });
    }
  };

  const handleDeleteContent = (id: string) => {
    if (confirm("Hapus ide konten ini dari pipeline?")) {
      const filtered = contents.filter((c) => c.id !== id);
      saveContentsToStorage(filtered);
      setActiveContentDetail(null);
    }
  };

  const handleUpdateScriptBody = (id: string, text: string) => {
    const updated = contents.map((c) => (c.id === id ? { ...c, script: text } : c));
    saveContentsToStorage(updated);
    if (activeContentDetail && activeContentDetail.id === id) {
      setActiveContentDetail({ ...activeContentDetail, script: text });
    }
  };

  // Simulated Google Drive upload file
  const handleDriveUploadMock = (id: string) => {
    const gdriveLinkMock = `https://drive.google.com/file/d/mock-file-${Math.random().toString(36).substring(2, 9)}/view`;
    const updated = contents.map((c) =>
      c.id === id ? { ...c, driveLink: gdriveLinkMock, status: "Published" as const } : c
    );
    saveContentsToStorage(updated);
    if (activeContentDetail && activeContentDetail.id === id) {
      setActiveContentDetail({ ...activeContentDetail, driveLink: gdriveLinkMock, status: "Published" });
    }
    setStatusMessage("Video diunggah ke Google Drive!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Video Analyzer (Transcription & Breakdown) Handler
  const handleAnalyzeVideo = async () => {
    if (!selectedFile) {
      setErrorMessage("Silakan pilih file video atau audio terlebih dahulu!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage(`Sedang mengunggah dan menganalisis ${selectedFile.name}...`);

    try {
      let analysisResult;
      if (apiKey.trim()) {
        analysisResult = await transcribeAndAnalyzeWithGemini(apiKey, selectedFile);
      } else {
        setStatusMessage("Menjalankan analisis simulasi (Offline Mode)...");
        await new Promise((r) => setTimeout(r, 2000));
        analysisResult = getMockTranscription(selectedFile.name);
      }

      setFypOutput(analysisResult);
      setStatusMessage("Analisis selesai!");
      setTimeout(() => setStatusMessage(""), 2000);

      // Save to Research database
      const newResearchItem: ResearchItem = {
        id: "res-" + Math.random().toString(36).substring(2, 9),
        fileName: selectedFile.name,
        transcription: analysisResult.transcription,
        analysis: analysisResult.analysis,
        createdAt: new Date().toISOString()
      };
      saveResearchesToStorage([newResearchItem, ...researches]);

    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal melakukan analisis video.");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Simulation of Manager Approval Actions
  const handleManagerAction = (approved: boolean) => {
    if (!activeContentDetail) return;
    
    const status: ContentItem["status"] = approved ? "Approved" : "Revision";
    const updated = contents.map((c) => 
      c.id === activeContentDetail.id 
        ? { ...c, status, revisionNotes: approved ? "" : managerComment } 
        : c
    );
    
    saveContentsToStorage(updated);
    setActiveContentDetail({
      ...activeContentDetail,
      status,
      revisionNotes: approved ? "" : managerComment
    });
    
    setIsManagerPreview(false);
    setManagerComment("");
    setStatusMessage(approved ? "Konten disetujui Manajer! 🎉" : "Revisi diajukan ke creator.");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Simple Markdown to HTML Parser to render generated outputs safely without heavy dependencies
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    
    return text
      .split("\n")
      .map((line, idx) => {
        const clean = line;
        
        // Headers
        if (line.startsWith("### ")) {
          return <h4 key={idx} className="text-lg font-bold text-white mt-4 mb-2">{line.replace("### ", "")}</h4>;
        }
        if (line.startsWith("#### ")) {
          return <h5 key={idx} className="text-md font-semibold text-white/90 mt-3 mb-1">{line.replace("#### ", "")}</h5>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={idx} className="text-xl font-bold text-white mt-5 mb-3 border-b border-white/10 pb-1">{line.replace("## ", "")}</h3>;
        }
        if (line.startsWith("# ")) {
          return <h2 key={idx} className="text-2xl font-black text-white mt-6 mb-4">{line.replace("# ", "")}</h2>;
        }
        
        // Bullet list
        if (line.startsWith("- ")) {
          const boldMatch = line.match(/\*\*(.*?)\*\*/);
          if (boldMatch) {
            const label = boldMatch[1];
            const content = line.replace(`- **${label}**:`, "").replace(`- **${label}**`, "");
            return (
              <li key={idx} className="ml-5 list-disc text-white/80 my-1">
                <strong className="text-white">{label}</strong>: {content}
              </li>
            );
          }
          return <li key={idx} className="ml-5 list-disc text-white/80 my-1">{line.replace("- ", "")}</li>;
        }

        // Bold formatting inline
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(clean)) !== null) {
          if (match.index > lastIndex) {
            parts.push(clean.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        
        if (lastIndex < clean.length) {
          parts.push(clean.substring(lastIndex));
        }

        const isVisualDirection = line.startsWith("*[") && line.endsWith("]*");
        return (
          <p key={idx} className={`my-2 text-white/70 leading-relaxed ${isVisualDirection ? "text-amber-300/90 italic font-mono pl-4 border-l-2 border-amber-400/30" : ""}`}>
            {parts.length > 0 ? parts : clean}
          </p>
        );
      });
  };

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex-1 flex flex-col">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Barezaconcre
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Asisten Kreator Kebab Turki Baba Rafi
          </p>
        </div>
        
        {/* Connection status badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 glass-card ${apiKey ? "text-emerald-400" : "text-white/40"}`}>
            <span className={`w-2 h-2 rounded-full ${apiKey ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            Gemini AI: {apiKey ? "Connected" : "Simulated"}
          </div>
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 glass-card ${driveFolder ? "text-emerald-400" : "text-white/40"}`}>
            <span className={`w-2 h-2 rounded-full ${driveFolder ? "bg-emerald-400" : "bg-white/20"}`} />
            G-Drive Folder: {driveFolder ? "Sync Active" : "No Sync"}
          </div>
        </div>
      </header>

      {/* TOP NOTIFICATIONS */}
      {statusMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl glass-container border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 shadow-2xl animate-fade-in">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl glass-container border-red-500/30 text-red-300 text-sm flex items-center gap-2 shadow-2xl animate-fade-in">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* TABS NAVIGATION */}
      <nav className="flex overflow-x-auto gap-1 border-b border-white/5 mb-8 pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-5 py-2.5 font-medium text-sm glass-tab ${activeTab === "dashboard" ? "active" : ""}`}
        >
          Pipeline Konten
        </button>
        <button
          onClick={() => setActiveTab("script-writer")}
          className={`px-5 py-2.5 font-medium text-sm glass-tab ${activeTab === "script-writer" ? "active" : ""}`}
        >
          AI Script Writer
        </button>
        <button
          onClick={() => setActiveTab("fyp-analyzer")}
          className={`px-5 py-2.5 font-medium text-sm glass-tab ${activeTab === "fyp-analyzer" ? "active" : ""}`}
        >
          Bedah FYP Video
        </button>
        <button
          onClick={() => setActiveTab("hook-trainer")}
          className={`px-5 py-2.5 font-medium text-sm glass-tab ${activeTab === "hook-trainer" ? "active" : ""}`}
        >
          Latih Hook AI
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-2.5 font-medium text-sm glass-tab ${activeTab === "settings" ? "active" : ""}`}
        >
          Pengaturan
        </button>
      </nav>

      {/* TAB CONTENT: PIPELINE DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
          {/* Quick Input Bar (Left/Top) */}
          <div className="lg:col-span-1">
            <div className="glass-container p-6 rounded-2xl sticky top-6">
              <h3 className="text-lg font-bold mb-4 text-white">Tambah Ide Cepat</h3>
              <form onSubmit={handleQuickAddContent} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Judul Konten</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Makan kebab pas tanggal tua"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Platform Utama</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as "TikTok" | "Instagram Reels" | "Both")}
                    className="w-full px-3 py-2.5 bg-[#161622] border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-sm text-white"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="Both">Both (TikTok & Reels)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Premis / Konsep Kasar (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsi singkat adegan atau cerita..."
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 glass-button-primary text-sm rounded-xl"
                >
                  + Tambahkan ke Draft
                </button>
              </form>

              {/* Hook tips box */}
              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/40 block mb-1">Tips Crew Hari Ini</span>
                <p className="text-xs text-white/60 leading-relaxed italic">
                  &quot;Konten makanan jangan melulu shoot kebab digigit doang. Penonton bosan. Pancing pake masalah hidup dulu di 3 detik pertama, baru kasih solusi kebab.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Kanban / Pipeline Columns (Right/Main) */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Draft & Revisi Column */}
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                    Draft & Revisi ({contents.filter((c) => c.status === "Draft" || c.status === "Revision").length})
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {contents
                    .filter((c) => c.status === "Draft" || c.status === "Revision")
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveContentDetail(item)}
                        className="glass-card p-4 rounded-xl cursor-pointer relative"
                      >
                        {item.status === "Revision" && (
                          <span className="absolute top-2 right-2 badge-revision text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                            Revisi
                          </span>
                        )}
                        <span className="text-xs text-white/40 block mb-1">
                          {item.platform === "Both" ? "TikTok + Reels" : item.platform === "TikTok" ? "TikTok" : "Reels"}
                        </span>
                        <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">{item.title}</h4>
                        {item.idea && <p className="text-xs text-white/50 mt-2 line-clamp-2 italic">{item.idea}</p>}
                        
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40">
                          <span>Publish: {item.publishDate}</span>
                          <span className="text-white font-medium hover:underline flex items-center gap-1">
                            Buka Detail &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  {contents.filter((c) => c.status === "Draft" || c.status === "Revision").length === 0 && (
                    <div className="text-center py-10 rounded-xl border border-dashed border-white/5 text-white/30 text-xs">
                      Kolom kosong
                    </div>
                  )}
                </div>
              </div>

              {/* Waiting Approval Column */}
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    Waiting Approval ({contents.filter((c) => c.status === "Waiting Approval").length})
                  </h3>
                </div>

                <div className="space-y-4">
                  {contents
                    .filter((c) => c.status === "Waiting Approval")
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveContentDetail(item)}
                        className="glass-card p-4 rounded-xl cursor-pointer border-yellow-500/20"
                      >
                        <span className="text-xs text-white/40 block mb-1">
                          {item.platform === "Both" ? "TikTok + Reels" : item.platform === "TikTok" ? "TikTok" : "Reels"}
                        </span>
                        <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">{item.title}</h4>
                        <div className="mt-3 flex gap-1.5 flex-wrap">
                          <span className="badge-approval text-[10px] px-2.5 py-0.5 rounded-full">
                            Menunggu Review
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40">
                          <span>Publish: {item.publishDate}</span>
                          <span className="text-white font-medium hover:underline flex items-center gap-1">
                            Buka Detail &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  {contents.filter((c) => c.status === "Waiting Approval").length === 0 && (
                    <div className="text-center py-10 rounded-xl border border-dashed border-white/5 text-white/30 text-xs">
                      Kolom kosong
                    </div>
                  )}
                </div>
              </div>

              {/* Ready to Publish & Live Column */}
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Approved & Live ({contents.filter((c) => c.status === "Approved" || c.status === "Published").length})
                  </h3>
                </div>

                <div className="space-y-4">
                  {contents
                    .filter((c) => c.status === "Approved" || c.status === "Published")
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveContentDetail(item)}
                        className={`glass-card p-4 rounded-xl cursor-pointer ${item.status === "Published" ? "border-blue-500/20 opacity-80" : "border-emerald-500/20"}`}
                      >
                        <span className="text-xs text-white/40 block mb-1">
                          {item.platform === "Both" ? "TikTok + Reels" : item.platform === "TikTok" ? "TikTok" : "Reels"}
                        </span>
                        <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">{item.title}</h4>
                        <div className="mt-2 flex gap-1.5 flex-wrap">
                          {item.status === "Approved" ? (
                            <span className="badge-approved text-[10px] px-2.5 py-0.5 rounded-full">
                              Siap Diproduksi
                            </span>
                          ) : (
                            <span className="badge-published text-[10px] px-2.5 py-0.5 rounded-full">
                              Sudah Tayang (Live)
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40">
                          <span>Publish: {item.publishDate}</span>
                          <span className="text-white font-medium hover:underline flex items-center gap-1">
                            Buka Detail &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  {contents.filter((c) => c.status === "Approved" || c.status === "Published").length === 0 && (
                    <div className="text-center py-10 rounded-xl border border-dashed border-white/5 text-white/30 text-xs">
                      Kolom kosong
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI SCRIPT WRITER */}
      {activeTab === "script-writer" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1">
          {/* Inputs Panel */}
          <div className="lg:col-span-2">
            <div className="glass-container p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 text-white">Generate Skrip Baru</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Topik / Ide Konten Utama</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="misal: Sindir pelanggan outlet Baba Rafi yang bayar pakai uang 100 ribu padahal cuma beli saus tambahan seribu rupiah."
                    value={scriptTopic}
                    onChange={(e) => setScriptTopic(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Platform Media Sosial</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScriptPlatform("TikTok")}
                      className={`py-2 text-sm rounded-xl font-medium border ${scriptPlatform === "TikTok" ? "bg-white text-black border-white" : "bg-transparent text-white border-white/10 hover:border-white/30"}`}
                    >
                      TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptPlatform("Instagram Reels")}
                      className={`py-2 text-sm rounded-xl font-medium border ${scriptPlatform === "Instagram Reels" ? "bg-white text-black border-white" : "bg-transparent text-white border-white/10 hover:border-white/30"}`}
                    >
                      IG Reels
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/50 leading-relaxed">
                  **Karakter Terpasang**: Crew Outlet Baba Rafi yang banyak akal, pecicilan, ramah tapi sangat sarkas.
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerateScript}
                  className="w-full py-3 glass-button-primary text-sm rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Sedang Meracik Skrip...
                    </>
                  ) : (
                    "Buat Skrip Sarkas"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Editor/Output Panel */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="glass-container p-6 rounded-2xl flex-1 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white text-md">Workspace Skrip AI</h3>
                {generatedScript && (
                  <button
                    onClick={() => setIsEditingScript(!isEditingScript)}
                    className="text-xs text-white/60 hover:text-white underline"
                  >
                    {isEditingScript ? "Pratinjau Hasil" : "Edit Skrip"}
                  </button>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                {generatedScript ? (
                  isEditingScript ? (
                    <textarea
                      value={generatedScript}
                      onChange={(e) => setGeneratedScript(e.target.value)}
                      className="w-full flex-1 p-4 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 font-mono text-sm text-white/95 resize-none leading-relaxed min-h-[300px]"
                    />
                  ) : (
                    <div className="w-full flex-1 p-5 bg-black/20 border border-white/5 rounded-xl overflow-y-auto max-h-[500px]">
                      {renderMarkdown(generatedScript)}
                    </div>
                  )
                ) : (
                  <div className="flex-1 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-8 text-center text-white/30">
                    <p className="text-xs max-w-sm">
                      Ketikkan topik di panel kiri lalu klik tombol untuk meminta AI crew outlet menuliskan ide skrip sarkas beserta 3 opsi hooknya.
                    </p>
                  </div>
                )}
              </div>

              {generatedScript && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSaveScriptToPipeline}
                    className="flex-1 py-2.5 glass-button-primary text-sm rounded-xl font-bold"
                  >
                    Simpan ke Pipeline
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Buat ulang skrip ini?")) {
                        setGeneratedScript("");
                      }
                    }}
                    className="px-4 py-2.5 glass-button-danger text-sm rounded-xl"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FYP ANALYZER */}
      {activeTab === "fyp-analyzer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          {/* Uploader Column */}
          <div className="lg:col-span-1">
            <div className="glass-container p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4 text-white">Bedah Video FYP</h3>
              <p className="text-white/50 text-xs mb-6 leading-relaxed">
                Unggah file video atau rekaman suara dari video TikTok/Reels orang lain yang sedang viral. AI akan mengekstrak transkrip percakapan serta membongkar taktik hook-nya untuk kita adaptasi ke Kebab Baba Rafi.
              </p>

              <div className="space-y-4">
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-6 text-center cursor-pointer transition bg-white/[0.01]">
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer block">
                    <svg className="w-8 h-8 mx-auto mb-2 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs font-semibold text-white block">
                      {selectedFile ? selectedFile.name : "Pilih File Audio/Video"}
                    </span>
                    <span className="text-[10px] text-white/40 block mt-1">
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "MP3, WAV, MP4, MOV (Maks. 20MB)"}
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={loading || !selectedFile}
                  onClick={handleAnalyzeVideo}
                  className="w-full py-3 glass-button-primary text-sm rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Menganalisis Konten...
                    </>
                  ) : (
                    "Mulai Bedah Video"
                  )}
                </button>
              </div>

              {/* History of Researches */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Riwayat Riset Video</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {researches.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => {
                        setFypOutput({ transcription: res.transcription, analysis: res.analysis });
                        setSelectedFile(null);
                      }}
                      className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs hover:bg-white/[0.05] cursor-pointer"
                    >
                      <span className="font-semibold text-white block truncate">{res.fileName}</span>
                      <span className="text-[10px] text-white/40 block mt-0.5">
                        Tanggal: {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {researches.length === 0 && (
                    <p className="text-[11px] text-white/30 italic">Belum ada riwayat analisis video.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Output Column */}
          <div className="lg:col-span-2">
            <div className="glass-container p-6 rounded-2xl min-h-[450px] flex flex-col">
              <h3 className="font-bold text-white text-md mb-4">Hasil Pembedahan AI</h3>

              <div className="flex-1 overflow-y-auto max-h-[550px] pr-2">
                {fypOutput ? (
                  <div className="space-y-6">
                    {/* Transcription Segment */}
                    <div className="p-4 bg-black/35 border border-white/10 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/55 mb-2.5">Transkrip Asli Video</h4>
                      <p className="text-sm text-white/85 leading-relaxed font-mono whitespace-pre-line">
                        {fypOutput.transcription}
                      </p>
                    </div>
 
                    {/* Analysis Segment */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl leading-relaxed">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/55 mb-2.5">Bedahan Struktur & Ide Adaptasi</h4>
                      {renderMarkdown(fypOutput.analysis)}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/30 p-10">
                    <p className="text-xs max-w-sm leading-relaxed">
                      Hasil transkrip, analisis taktik retensi, serta ide modifikasi instan bertema Kebab Turki Baba Rafi akan muncul di sini setelah pemrosesan selesai.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HOOK TRAINER */}
      {activeTab === "hook-trainer" && (
        <div className="max-w-3xl mx-auto w-full">
          <div className="glass-container p-6 md:p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Latih AI dengan Dokumen Hook</h3>
            <p className="text-white/50 text-xs mb-6 leading-relaxed">
              Anda memiliki dokumen pembelajaran Hook yang paling memikat? Salin isi teks dari file PDF tersebut dan tempelkan ke dalam kolom di bawah ini. AI Barezaconcre akan merekam aturan tersebut sebagai basis utama pembuatan hook di semua skrip selanjutnya.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs text-white/60 mb-2 font-medium">Isi Aturan/Panduan Hook</label>
                <textarea
                  rows={12}
                  required
                  placeholder="Contoh isi PDF Hook:&#10;1. Gunakan 'Curiosity Gap' di 3 detik pertama (Contoh: 'Ini alasan kenapa kamu rugi beli kebab rasa biasa...').&#10;2. Gunakan visual kontradiktif (muka sedih tapi gigit kebab lezat).&#10;3. Jangan sebutkan nama merk di awal, biarkan penonton tebak sendiri untuk meningkatkan durasi tonton."
                  value={hookKnowledge}
                  onChange={(e) => setHookKnowledge(e.target.value)}
                  className="w-full p-4 bg-black/25 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 font-mono text-xs text-white/90 leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[11px] text-white/40 italic">
                  *Data disimpan langsung di LocalStorage browser Anda (100% Privat).
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 glass-button-primary text-sm rounded-xl font-bold"
                >
                  Simpan Aturan Hook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto w-full">
          <div className="glass-container p-6 md:p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Konfigurasi API & Integrasi</h3>
            <p className="text-white/50 text-xs mb-6">
              Atur kredensial Anda di sini agar aplikasi dapat terhubung ke AI Google Gemini dan folder Google Drive secara langsung. Semua data disimpan secara lokal di browser Anda.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs text-white/60 mb-2 font-medium">Gemini API Key (Google AI Studio)</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-sm text-white font-mono"
                />
                <span className="text-[10px] text-white/30 block mt-1.5 leading-relaxed">
                  Dapatkan API Key gratis di Google AI Studio (15 RPM gratis). Jika dikosongkan, web akan otomatis menggunakan simulator/mock-offline agar Anda tetap bisa beraktivitas.
                </span>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2 font-medium">Link Folder Google Drive (Asset Storage)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveFolder}
                  onChange={(e) => setDriveFolder(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-sm text-white"
                />
                <span className="text-[10px] text-white/30 block mt-1.5 leading-relaxed">
                  Folder di Drive pribadi Anda untuk menampung video hasil produksi resolusi tinggi langsung dari web.
                </span>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 glass-button-primary text-sm rounded-xl font-bold"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD DETAIL MODAL */}
      {activeContentDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-container rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-fade-in">
            {/* Header Modal */}
            <div className="p-5 border-b border-white/10 flex justify-between items-start">
              <div>
                <span className="text-xs text-white/40 block mb-1">
                  {activeContentDetail.platform === "Both" ? "TikTok + Reels" : activeContentDetail.platform === "TikTok" ? "TikTok" : "Reels"}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">{activeContentDetail.title}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveContentDetail(null);
                  setIsManagerPreview(false);
                }}
                className="text-white/50 hover:text-white p-1 hover:bg-white/5 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* If in manager approval simulation view */}
              {isManagerPreview ? (
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    Simulator Approval Manajer
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Halaman ini menyimulasikan halaman publik aman yang Anda bagikan ke Manajer/Owner untuk review skrip tanpa mewajibkan mereka login.
                  </p>

                  <div className="p-4 bg-black/40 rounded-xl text-sm border border-white/5 max-h-[200px] overflow-y-auto">
                    <span className="text-xs text-white/40 block mb-1">Pratinjau Skrip:</span>
                    {renderMarkdown(activeContentDetail.script || "*Skrip kosong. Silakan generate skrip terlebih dahulu.*")}
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-1">Catatan Revisi (Diisi jika tidak disetujui)</label>
                    <textarea
                      rows={2}
                      value={managerComment}
                      onChange={(e) => setManagerComment(e.target.value)}
                      placeholder="Masukkan catatan perbaikan untuk kreator..."
                      className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-xs text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManagerAction(true)}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl"
                    >
                      Approve & Siap Produksi
                    </button>
                    <button
                      onClick={() => handleManagerAction(false)}
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs rounded-xl"
                    >
                      Minta Revisi
                    </button>
                    <button
                      onClick={() => setIsManagerPreview(false)}
                      className="px-4 py-2 bg-zinc-800 text-white text-xs rounded-xl"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status, Dates and Links */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-white/40 block font-medium uppercase tracking-wider mb-1">Status Konten</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold inline-block
                        ${activeContentDetail.status === "Draft" ? "badge-draft" : ""}
                        ${activeContentDetail.status === "Waiting Approval" ? "badge-approval" : ""}
                        ${activeContentDetail.status === "Approved" ? "badge-approved" : ""}
                        ${activeContentDetail.status === "Revision" ? "badge-revision" : ""}
                        ${activeContentDetail.status === "Published" ? "badge-published" : ""}
                      `}>
                        {activeContentDetail.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-white/40 block font-medium uppercase tracking-wider mb-1">Jadwal Publish</span>
                      <input
                        type="date"
                        value={activeContentDetail.publishDate}
                        onChange={(e) => {
                          const updated = contents.map((c) =>
                            c.id === activeContentDetail.id ? { ...c, publishDate: e.target.value } : c
                          );
                          saveContentsToStorage(updated);
                          setActiveContentDetail({ ...activeContentDetail, publishDate: e.target.value });
                        }}
                        className="bg-transparent text-white border border-white/10 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] text-white/40 block font-medium uppercase tracking-wider mb-1">Asset Google Drive</span>
                      {activeContentDetail.driveLink ? (
                        <a
                          href={activeContentDetail.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline truncate block"
                        >
                          Buka File High-Res
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDriveUploadMock(activeContentDetail.id)}
                          className="text-[11px] text-white/60 hover:text-white underline text-left"
                        >
                          Hubungkan File Edit (Simulasi)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Revision Notes Alert */}
                  {activeContentDetail.status === "Revision" && activeContentDetail.revisionNotes && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <h4 className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1">
                        Catatan Revisi dari Manajer:
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed italic">
                        &quot;{activeContentDetail.revisionNotes}&quot;
                      </p>
                    </div>
                  )}

                  {/* Premis / Idea */}
                  {activeContentDetail.idea && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">Konsep Dasar</h4>
                      <p className="text-sm text-white/80 pl-3 border-l-2 border-white/10 italic">
                        {activeContentDetail.idea}
                      </p>
                    </div>
                  )}

                  {/* Script body */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2.5 flex justify-between items-center">
                      <span>📜 Skrip Video</span>
                      <button
                        onClick={() => {
                          setScriptTopic(activeContentDetail.title);
                          setScriptPlatform(activeContentDetail.platform === "Instagram Reels" ? "Instagram Reels" : "TikTok");
                          setActiveTab("script-writer");
                          setActiveContentDetail(null);
                        }}
                        className="text-[10px] text-white/50 hover:text-white underline lowercase"
                      >
                        {activeContentDetail.script ? "Buat ulang dengan AI" : "Generate skrip sekarang"}
                      </button>
                    </h4>

                    {activeContentDetail.script ? (
                      <div className="space-y-4">
                        <textarea
                          rows={10}
                          value={activeContentDetail.script}
                          onChange={(e) => handleUpdateScriptBody(activeContentDetail.id, e.target.value)}
                          className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 font-mono text-xs text-white/90 leading-relaxed resize-y"
                        />
                        <div className="p-4 bg-black/10 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto">
                          <span className="text-[10px] text-white/40 block mb-2">Pratinjau Tampilan Skrip:</span>
                          {renderMarkdown(activeContentDetail.script)}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 rounded-xl border border-dashed border-white/10 text-center text-white/30 text-xs">
                        Belum ada skrip untuk ide ini.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Modal */}
            {!isManagerPreview && (
              <div className="p-5 border-t border-white/10 flex justify-between bg-black/20">
                <button
                  onClick={() => handleDeleteContent(activeContentDetail.id)}
                  className="px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition"
                >
                  Hapus Ide
                </button>

                <div className="flex gap-2">
                  {activeContentDetail.script && activeContentDetail.status === "Draft" && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(activeContentDetail.id, "Waiting Approval");
                        setIsManagerPreview(true); // Auto open simulator
                      }}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs rounded-xl"
                    >
                      Bagikan Approval Link (Simulasi)
                    </button>
                  )}
                  {activeContentDetail.status === "Approved" && (
                    <button
                      onClick={() => handleUpdateStatus(activeContentDetail.id, "Published")}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl"
                    >
                      Set Status Live (Publish)
                    </button>
                  )}
                  <button
                    onClick={() => setActiveContentDetail(null)}
                    className="px-4 py-2 bg-zinc-800 text-white text-xs rounded-xl"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
