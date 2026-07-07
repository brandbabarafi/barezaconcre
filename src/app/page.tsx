/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import {
  generateScriptWithGemini,
  transcribeAndAnalyzeWithGemini,
  getMockScript,
  getMockTranscription,
  analyzeLinkWithGemini,
  getMockLinkAnalysis,
  extractHookFromPDFWithGemini,
  fileToBase64
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
  const [videoLink, setVideoLink] = useState("");
  const [fypOutput, setFypOutput] = useState<{ transcription: string; analysis: string } | null>(null);

  // Hook Trainer States
  const [hookPDFFile, setHookPDFFile] = useState<File | null>(null);

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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ContentItem["status"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      handleUpdateStatus(id, targetStatus);
    }
  };

  const handleRequestRevision = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const notes = prompt("Masukkan catatan revisi untuk kreator:");
    if (notes !== null) {
      const updated = contents.map((c) =>
        c.id === id ? { ...c, status: "Revision" as const, revisionNotes: notes } : c
      );
      saveContentsToStorage(updated);
      setStatusMessage("Status diubah ke Revisi.");
      setTimeout(() => setStatusMessage(""), 2000);
      if (activeContentDetail && activeContentDetail.id === id) {
        setActiveContentDetail({ ...activeContentDetail, status: "Revision", revisionNotes: notes });
      }
    }
  };

  const handleHookPDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHookPDFFile(e.target.files[0]);
    }
  };

  const handleExtractHookPDF = async () => {
    if (!hookPDFFile) return;

    setLoading(true);
    setErrorMessage("");
    setStatusMessage(`Membaca dan mengekstrak panduan dari ${hookPDFFile.name}...`);

    try {
      let extractedGuidelines = "";
      if (apiKey.trim()) {
        const base64 = await fileToBase64(hookPDFFile);
        extractedGuidelines = await extractHookFromPDFWithGemini(apiKey, base64);
      } else {
        setStatusMessage("Menjalankan simulasi ekstraksi PDF (Offline Mode)...");
        await new Promise((r) => setTimeout(r, 2000));
        extractedGuidelines = `1. **Curiosity Gap di 3 Detik Pertama** (Pancing penonton dengan pertanyaan retoris atau fakta mengejutkan, misal: "Ini rahasia kenapa kebab dingin rasanya tetep gurih...").
2. **Visual Hooking** (Gunakan transisi gerakan dinamis, potong daging kebab secara cepat, dekatkan kamera ke bahan segar).
3. **Sarkasme & Komedi Tipis** (Selipkan humor ironis yang menyindir kebiasaan pembeli sehari-hari, misal: "Kebab porsi diet tapi isinya daging doang").
4. **Call to Action yang Cepat** (Jangan bertele-tele di akhir video, langsung suruh beli ke outlet).`;
      }

      setHookKnowledge(extractedGuidelines);
      localStorage.setItem("bz_hook_knowledge", extractedGuidelines);
      setStatusMessage("Panduan berhasil diekstrak dan disimpan!");
      setTimeout(() => setStatusMessage(""), 2000);
      setHookPDFFile(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal mengekstrak PDF.");
      setStatusMessage("");
    } finally {
      setLoading(false);
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
    if (!selectedFile && !videoLink.trim()) {
      setErrorMessage("Silakan pilih file video atau masukkan tautan terlebih dahulu!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage(selectedFile ? `Sedang menganalisis ${selectedFile.name}...` : `Menganalisis tautan: ${videoLink}...`);

    try {
      let analysisResult;
      if (selectedFile) {
        if (apiKey.trim()) {
          analysisResult = await transcribeAndAnalyzeWithGemini(apiKey, selectedFile);
        } else {
          setStatusMessage("Menjalankan analisis simulasi (Offline Mode)...");
          await new Promise((r) => setTimeout(r, 2000));
          analysisResult = getMockTranscription(selectedFile.name);
        }
      } else {
        if (apiKey.trim()) {
          analysisResult = await analyzeLinkWithGemini(apiKey, videoLink);
        } else {
          setStatusMessage("Menjalankan analisis simulasi (Offline Mode)...");
          await new Promise((r) => setTimeout(r, 2000));
          analysisResult = getMockLinkAnalysis(videoLink);
        }
      }

      setFypOutput(analysisResult);
      setStatusMessage("Analisis selesai!");
      setTimeout(() => setStatusMessage(""), 2000);

      // Save to Research database
      const newResearchItem: ResearchItem = {
        id: "res-" + Math.random().toString(36).substring(2, 9),
        fileName: selectedFile ? selectedFile.name : `Tautan: ${videoLink.replace(/https?:\/\/(www\.)?/, "").substring(0, 30)}...`,
        transcription: analysisResult.transcription,
        analysis: analysisResult.analysis,
        createdAt: new Date().toISOString()
      };
      saveResearchesToStorage([newResearchItem, ...researches]);
      setVideoLink("");
      setSelectedFile(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal melakukan analisis.");
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

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  const navItems: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Konten Kreasi",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    {
      id: "script-writer",
      label: "AI Script Writer",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: "fyp-analyzer",
      label: "Bedah FYP Video",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "hook-trainer",
      label: "Latih Hook AI",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Pengaturan",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <div className="app-shell">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">S</div>

        {/* Nav Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item w-full text-left ${activeTab === item.id ? "active" : ""}`}
            >
              {item.icon}
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom — Settings shortcut already in nav */}
        <div className="sidebar-bottom">
          <div className="sidebar-nav-item" style={{ opacity: 0.35, cursor: "default", fontSize: 10, paddingTop: 4, paddingBottom: 4 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            <span className="sidebar-nav-label" style={{ fontSize: 11 }}>Salim Mas Mirza v1</span>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div>
            <div className="topbar-greeting">{greeting}, Salim.</div>
            <div className="topbar-meta">
              {navItems.find(n => n.id === activeTab)?.label ?? "Dashboard"}
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 glass-card ${apiKey ? "text-emerald-700" : "text-[var(--text-tertiary)]"}`}>
              <span className={`w-2 h-2 rounded-full ${apiKey ? "bg-emerald-500 animate-pulse" : "bg-[var(--text-tertiary)]"}`} />
              Gemini AI: {apiKey ? "Connected" : "Simulated"}
            </div>
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 glass-card ${driveFolder ? "text-emerald-700" : "text-[var(--text-tertiary)]"}`}>
              <span className={`w-2 h-2 rounded-full ${driveFolder ? "bg-emerald-500" : "bg-[var(--text-tertiary)]"}`} />
              Drive: {driveFolder ? "Terhubung" : "Belum diatur"}
            </div>
          </div>
        </header>

        {/* Notifications */}
        {statusMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 shadow-lg animate-fade-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2 shadow-lg animate-fade-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Page Body */}
        <main className="page-body">


      {/* TAB CONTENT: PIPELINE DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
          {/* Quick Input Bar (Left/Top) */}
          <div className="lg:col-span-1">
            <div className="glass-container p-6 rounded-2xl sticky top-[80px]">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Tambah Ide</h3>
              <form onSubmit={handleQuickAddContent} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Judul Konten</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Makan kebab pas tanggal tua"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Platform Utama</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as "TikTok" | "Instagram Reels" | "Both")}
                    className="w-full px-3 py-2.5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] text-sm"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="Both">Both (TikTok & Reels)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Premis / Konsep Kasar (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsi singkat adegan atau cerita..."
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 glass-button-primary text-sm rounded-xl"
                >
                  + Tambahkan
                </button>
              </form>

              {/* Hook tips box */}
              <div className="tips-box mt-6 p-4">
                <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-tertiary)' }}>Tips Crew Hari Ini</span>
                <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
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
                  <h3 className="font-semibold text-sm tracking-wide uppercase flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                    Draft & Revisi ({contents.filter((c) => c.status === "Draft" || c.status === "Revision").length})
                  </h3>
                </div>
                
                <div 
                  className="space-y-4 min-h-[450px] rounded-xl"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "Draft")}
                >
                  {contents
                    .filter((c) => c.status === "Draft" || c.status === "Revision")
                    .map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        className="glass-card p-4 rounded-xl relative cursor-grab active:cursor-grabbing"
                      >
                        {item.status === "Revision" && (
                          <span className="absolute top-2 right-2 badge-revision text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                            Revisi
                          </span>
                        )}
                        <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          {item.platform === "Both" ? "TikTok + Reels" : item.platform === "TikTok" ? "TikTok" : "Reels"}
                        </span>
                        <h4 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                        {item.idea && <p className="text-xs mt-2 line-clamp-2 italic" style={{ color: 'var(--text-secondary)' }}>{item.idea}</p>}
                        
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span>Publish: {item.publishDate}</span>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(item.id, "Waiting Approval");
                              }}
                              className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-bold rounded-lg transition"
                            >
                              Ajukan Review
                            </button>
                            <span 
                              onClick={() => setActiveContentDetail(item)} 
                              className="text-white font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              Detail &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {contents.filter((c) => c.status === "Draft" || c.status === "Revision").length === 0 && (
                    <div className="kanban-empty text-center py-10 rounded-xl text-xs">
                      Kolom kosong
                    </div>
                  )}
                </div>
              </div>
 
              {/* Waiting Approval Column */}
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-semibold text-sm tracking-wide uppercase flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    Waiting Approval ({contents.filter((c) => c.status === "Waiting Approval").length})
                  </h3>
                </div>
 
                <div 
                  className="space-y-4 min-h-[450px] rounded-xl"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "Waiting Approval")}
                >
                  {contents
                    .filter((c) => c.status === "Waiting Approval")
                    .map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        className="glass-card p-4 rounded-xl relative cursor-grab active:cursor-grabbing"
                      >
                        <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          {item.platform === "Both" ? "TikTok + Reels" : item.platform === "TikTok" ? "TikTok" : "Reels"}
                        </span>
                        <h4 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                        <div className="mt-3 flex gap-1.5 flex-wrap">
                          <span className="badge-approval text-[10px] px-2.5 py-0.5 rounded-full">
                            Menunggu Review
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--border-subtle)] text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span>Publish: {item.publishDate}</span>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(item.id, "Approved");
                              }}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold rounded-lg transition"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={(e) => handleRequestRevision(e, item.id)}
                              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-bold rounded-lg transition"
                            >
                              Revisi
                            </button>
                            <span 
                              onClick={() => setActiveContentDetail(item)} 
                              className="text-white font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              Detail &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {contents.filter((c) => c.status === "Waiting Approval").length === 0 && (
                    <div className="kanban-empty text-center py-10 rounded-xl text-xs">
                      Kolom kosong
                    </div>
                  )}
                </div>
              </div>
 
              {/* Ready to Publish & Live Column */}
              <div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-semibold text-sm tracking-wide uppercase flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Approved & Live ({contents.filter((c) => c.status === "Approved" || c.status === "Published").length})
                  </h3>
                </div>
 
                <div 
                  className="space-y-4 min-h-[450px] rounded-xl"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "Approved")}
                >
                  {contents
                    .filter((c) => c.status === "Approved" || c.status === "Published")
                    .map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        className={`glass-card p-4 rounded-xl relative cursor-grab active:cursor-grabbing ${item.status === "Published" ? "opacity-75" : ""}`}
                      >
                        <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          {item.platform === "Both" ? "TikTok + Reels" : item.platform === "TikTok" ? "TikTok" : "Reels"}
                        </span>
                        <h4 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
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
                          <div className="flex gap-2 items-center">
                            {item.status === "Approved" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(item.id, "Published");
                                }}
                                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold rounded-lg transition"
                              >
                                Publish (Live)
                              </button>
                            )}
                            <span 
                              onClick={() => setActiveContentDetail(item)} 
                              className="text-white font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              Detail &rarr;
                            </span>
                          </div>
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
                      className={`py-2 text-sm rounded-xl font-medium border transition ${scriptPlatform === "TikTok" ? "bg-[var(--text-primary)] text-white border-[var(--text-primary)]" : "bg-transparent border-[var(--border)] hover:border-[#999891]"}`}
                    >
                      TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptPlatform("Instagram Reels")}
                      className={`py-2 text-sm rounded-xl font-medium border transition ${scriptPlatform === "Instagram Reels" ? "bg-[var(--text-primary)] text-white border-[var(--text-primary)]" : "bg-transparent border-[var(--border)] hover:border-[#999891]"}`}
                    >
                      IG Reels
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/50 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
                <h3 className="font-bold text-md mb-4" style={{ color: 'var(--text-primary)' }}>Workspace Skrip AI</h3>
                {generatedScript && (
                  <button
                    onClick={() => setIsEditingScript(!isEditingScript)}
                    className="text-xs underline" style={{ color: 'var(--text-secondary)' }}
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
                      className="w-full flex-1 p-4 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] font-mono text-sm resize-none leading-relaxed min-h-[300px]"
                    />
                  ) : (
                    <div className="w-full flex-1 p-5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl overflow-y-auto max-h-[500px]">
                      {renderMarkdown(generatedScript)}
                    </div>
                  )
                ) : (
                  <div className="flex-1 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
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
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Bedah Video FYP</h3>
              <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Unggah file video atau rekaman suara dari video TikTok/Reels orang lain yang sedang viral. AI akan mengekstrak transkrip percakapan serta membongkar taktik hook-nya untuk kita adaptasi ke Kebab Baba Rafi.
              </p>

              <div className="space-y-4">
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-[var(--border)] hover:border-[#999891] rounded-2xl p-6 text-center cursor-pointer transition bg-[var(--bg-card-subtle)]">
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setVideoLink("");
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer block">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-tertiary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      {selectedFile ? selectedFile.name : "Pilih File Audio/Video"}
                    </span>
                    <span className="text-[10px] block mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "MP3, WAV, MP4, MOV (Maks. 20MB)"}
                    </span>
                  </label>
                </div>

                {/* OR divider */}
                <div className="flex items-center my-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="px-2">ATAU MASUKKAN LINK</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {/* URL Input */}
                <div>
                  <input
                    type="url"
                    placeholder="Masukkan Tautan TikTok atau IG Reels..."
                    value={videoLink}
                    onChange={(e) => {
                      setVideoLink(e.target.value);
                      if (e.target.value.trim()) setSelectedFile(null);
                    }}
                    className="w-full px-3 py-2.5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={loading || (!selectedFile && !videoLink.trim())}
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
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Riwayat Riset Video</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {researches.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => {
                        setFypOutput({ transcription: res.transcription, analysis: res.analysis });
                        setSelectedFile(null);
                      }}
                      className="glass-card p-3 rounded-xl text-xs cursor-pointer hover:shadow-sm"
                    >
                      <span className="font-semibold block truncate" style={{ color: 'var(--text-primary)' }}>{res.fileName}</span>
                      <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        Tanggal: {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {researches.length === 0 && (
                    <p className="text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>Belum ada riwayat analisis video.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Output Column */}
          <div className="lg:col-span-2">
            <div className="glass-container p-6 rounded-2xl min-h-[450px] flex flex-col">
              <h3 className="font-bold text-md mb-4" style={{ color: 'var(--text-primary)' }}>Hasil Pembedahan AI</h3>

              <div className="flex-1 overflow-y-auto max-h-[550px] pr-2">
                {fypOutput ? (
                  <div className="space-y-6">
                    {/* Transcription Segment */}
                    <div className="p-4 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-tertiary)' }}>Transkrip Asli Video</h4>
                      <p className="text-sm leading-relaxed font-mono whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                        {fypOutput.transcription}
                      </p>
                    </div>
 
                    {/* Analysis Segment */}
                    <div className="p-4 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl leading-relaxed">
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-tertiary)' }}>Bedahan Struktur & Ide Adaptasi</h4>
                      {renderMarkdown(fypOutput.analysis)}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10" style={{ color: 'var(--text-tertiary)' }}>
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
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Latih AI dengan Dokumen Hook</h3>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Anda memiliki dokumen pembelajaran Hook yang paling memikat? Salin isi teks dari file PDF tersebut dan tempelkan ke dalam kolom di bawah ini. AI Salim Mas Mirza akan merekam aturan tersebut sebagai basis utama pembuatan hook di semua skrip selanjutnya.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* PDF Uploader */}
              <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card-subtle)]">
                <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Unggah Berkas PDF Panduan Hook</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleHookPDFUpload}
                    className="hidden"
                    id="hook-pdf-upload"
                  />
                  <label
                    htmlFor="hook-pdf-upload"
                    className="px-4 py-2.5 glass-button border border-[var(--border)] rounded-xl text-xs cursor-pointer font-medium transition"
                  >
                    Pilih File PDF
                  </label>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {hookPDFFile ? hookPDFFile.name : "Format PDF (Maks. 10MB)"}
                  </span>
                  {hookPDFFile && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleExtractHookPDF}
                      className="px-4 py-2.5 glass-button-primary text-xs rounded-xl font-bold flex items-center gap-1.5 ml-auto"
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Mengekstrak...
                        </>
                      ) : (
                        "Ekstrak dengan AI"
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Isi Aturan/Panduan Hook</label>
                <textarea
                  rows={12}
                  required
                  placeholder="Contoh isi PDF Hook:&#10;1. Gunakan 'Curiosity Gap' di 3 detik pertama (Contoh: 'Ini alasan kenapa kamu rugi beli kebab rasa biasa...')."
                  value={hookKnowledge}
                  onChange={(e) => setHookKnowledge(e.target.value)}
                  className="w-full p-4 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] font-mono text-xs leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                <span className="text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>
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
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Konfigurasi API & Integrasi</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
              Atur kredensial Anda di sini agar aplikasi dapat terhubung ke AI Google Gemini dan folder Google Drive secara langsung. Semua data disimpan secara lokal di browser Anda.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Gemini API Key (Google AI Studio)</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] text-sm font-mono"
                />
                <span className="text-[10px] block mt-1.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  Dapatkan API Key gratis di Google AI Studio (15 RPM gratis). Jika dikosongkan, web akan otomatis menggunakan simulator/mock-offline agar Anda tetap bisa beraktivitas.
                </span>
              </div>

              <div>
                <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Link Folder Google Drive (Asset Storage)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveFolder}
                  onChange={(e) => setDriveFolder(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--bg-card-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[#999891] text-sm"
                />
                <span className="text-[10px] block mt-1.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  Folder di Drive pribadi Anda untuk menampung video hasil produksi resolusi tinggi langsung dari web.
                </span>
              </div>

              <div className="pt-6 border-t border-[var(--border-subtle)] flex justify-end">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-container rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-fade-in">
            {/* Header Modal */}
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-start">
              <div>
                <span className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {activeContentDetail.platform === "Both" ? "TikTok + Reels" : activeContentDetail.platform === "TikTok" ? "TikTok" : "Reels"}
                </span>
                <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{activeContentDetail.title}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveContentDetail(null);
                  setIsManagerPreview(false);
                }}
                className="glass-button p-1.5 rounded-lg transition" style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                    <div className="col-span-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Asset Google Drive</span>
                        {driveFolder && (
                          <a
                            href={driveFolder}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            📂 Buka Folder Drive Utama
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder={driveFolder ? "Masukkan tautan file video hasil produksi..." : "Masukkan tautan file Google Drive..."}
                          value={activeContentDetail.driveLink || ""}
                          onChange={(e) => {
                            const link = e.target.value;
                            const updated = contents.map((c) =>
                              c.id === activeContentDetail.id ? { ...c, driveLink: link } : c
                            );
                            saveContentsToStorage(updated);
                            setActiveContentDetail({ ...activeContentDetail, driveLink: link });
                          }}
                          className="flex-1 px-3 py-1.5 bg-black/35 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-xs text-white"
                        />
                        {activeContentDetail.driveLink && (
                          <>
                            <a
                              href={activeContentDetail.driveLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-xl transition shrink-0"
                            >
                              Buka
                            </a>
                            <button
                              onClick={() => {
                                const updated = contents.map((c) =>
                                  c.id === activeContentDetail.id ? { ...c, driveLink: "" } : c
                                );
                                saveContentsToStorage(updated);
                                setActiveContentDetail({ ...activeContentDetail, driveLink: "" });
                              }}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold rounded-xl transition shrink-0"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                        {!activeContentDetail.driveLink && (
                          <button
                            onClick={() => handleDriveUploadMock(activeContentDetail.id)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-semibold rounded-xl transition shrink-0"
                          >
                            Simulasikan
                          </button>
                        )}
                      </div>
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
                    className="px-4 py-2 glass-button text-sm rounded-xl"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
