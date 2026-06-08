// prompt-helper.ts

export const BrandVoiceInstruction = `
Kamu adalah seorang Crew Outlet Kebab Turki Baba Rafi yang cerdas, pecicilan (sangat aktif, heboh, tidak bisa diam), banyak akal (selalu punya solusi cerdik), ramah kepada pembeli namun memiliki selera humor yang sangat sarkas, sinis secara jenaka, dan suka menyindir realita sosial sehari-hari atau tren medsos terkini. 

Gaya bahasa komunikasimu:
- Kasual, menggunakan bahasa gaul pemuda Indonesia ('lu-gue', 'cuy', 'dahlah', 'beneran', 'anjir', 'gabut').
- Ramah khas pelayanan outlet tapi disusul sindiran sarkas yang lucu.
- Nada bicaranya cepat, antusias, namun skeptis pada hal-hal konyol.
- Selalu mempromosikan kebab atau menu Baba Rafi di sela-sela sindiranmu secara cerdik.
`;

export function buildSystemPrompt(hookKnowledge: string): string {
  let prompt = BrandVoiceInstruction;
  
  if (hookKnowledge && hookKnowledge.trim().length > 0) {
    prompt += `\n\n[PANDUAN PEMBUATAN HOOK YANG HARUS KAMU PELAJARI DAN TERAPKAN]:\n${hookKnowledge}\n`;
  } else {
    prompt += `\n\n[PANDUAN PEMBUATAN HOOK]:\nGunakan hook yang langsung memicu rasa ingin tahu, kontradiktif, atau menyenggol kebiasaan buruk penonton di 3 detik pertama.`;
  }
  
  return prompt;
}

export function buildGenerationPrompt(topic: string, platform: string): string {
  return `
Buatkan 1 skrip video pendek (TikTok/Reels) berdurasi sekitar 30-45 detik untuk platform ${platform} dengan topik/ide berikut:
"${topic}"

Pastikan format output rapih dalam bentuk Markdown:
1. **Pilihan Hook Alternatif** (Berikan 3 variasi hook pembuka 3-detik pertama yang nendang berdasarkan panduan hook).
2. **Skrip Video Lengkap**:
   - Tulis dalam format percakapan/monolog Crew dengan Visual/Audio Direction di dalam tanda kurung siku, misal: *[Visual: Crew sedang memotong daging kebab dengan tatapan kosong, menghela nafas]*.
   - Sisipkan komedi sarkas khas crew outlet yang banyak akal tapi capek kerja.
3. **Catatan Visual & Properti** (Saran visual pendukung agar video tersebut berpotensi FYP).

Tulis seluruhnya dalam Bahasa Indonesia gaul yang sangat natural dan luwes.
`;
}

// Client-side call to Gemini 1.5 Flash API
export async function generateScriptWithGemini(
  apiKey: string,
  topic: string,
  hookKnowledge: string,
  platform: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(hookKnowledge);
  const userPrompt = buildGenerationPrompt(topic, platform);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 2048,
      }
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gagal menghubungi API Gemini");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Format respons Gemini tidak valid.");
  
  return text;
}

// Convert file to Base64 helper
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Multimodal Call for Video/Audio Transcribe & Analyze
export async function transcribeAndAnalyzeWithGemini(
  apiKey: string,
  file: File
): Promise<{ transcription: string; analysis: string }> {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const promptText = `
Tugas Anda adalah membedah video/audio referensi ini untuk kebutuhan riset konten F&B Kebab Baba Rafi.
1. Berikan transkrip lengkap dari apa yang diucapkan di audio/video ini (dalam bahasa aslinya).
2. Lakukan analisis struktur skrip:
   - Apa Hook yang dipakai? Mengapa ini bekerja?
   - Bagaimana transisi/pacing alur pembahasannya?
   - Apa pelajaran penting (Key Takeaway) dari video ini yang bisa kita tiru?
3. Berikan 1 ide modifikasi / konsep adaptasi konten untuk Kebab Turki Baba Rafi dengan gaya Crew Outlet kita yang pecicilan & sarkas.

Format keluaran harus jelas dengan pemisah Markdown seperti:
# Transkrip Video
...

# Analisis Struktur
- **Hook**: ...
- **Pacing**: ...

# Ide Adaptasi Baba Rafi
...
`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gagal menganalisis video dengan Gemini");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Format respons analisis video tidak valid.");

  // Split into transcript and analysis/ideas
  let transcription = "Transkrip gagal dimuat.";
  let analysis = text;

  if (text.includes("# Transkrip Video")) {
    const parts = text.split(/# Analisis Struktur|# Ide Adaptasi Baba Rafi/);
    transcription = parts[0].replace("# Transkrip Video", "").trim();
    analysis = text.replace(parts[0], "").trim();
  }

  return { transcription, analysis };
}

// Fallback Mock data for testing and offline mode
export function getMockScript(topic: string, platform: string): string {
  return `### 🌯 SKRIP GENERATED (MOCK OFFLINE MODE)
*(Catatan: Masukkan Gemini API Key di Pengaturan untuk hasil AI asli)*

#### 🎯 Pilihan Hook Alternatif
1. *"Lu bangga makan salad mahal tapi cemas mikirin cicilan? Mending makan kebab ini, sama-sama bikin kenyang tapi gak bikin dompet depresi."*
2. *"Satu-satunya hal yang konsisten di dunia ini cuma dua: Janji manis mantanmu sama tebalnya daging Kebab Baba Rafi."*
3. *"Gue heran sama orang yang diet ketat tapi kalau malam nyari postingan mukbang. Sini gue ajarin diet bahagia pake kebab."*

---

#### 🎬 Skrip Video Lengkap (${platform})
- **[Visual: Crew Outlet berdiri di depan penggorengan kebab dengan celemek Baba Rafi, memegang capit makanan dengan gaya berlebihan seperti konduktor orkestra. Wajahnya lelah tapi bersemangat.]**
- **Crew**: "Lu semua pada sibuk cari ketenangan jiwa ke Bali, ke gunung... bro, ketenangan jiwa tuh murah! Cukup denger suara mentega meleleh di atas wajan kebab gue. *[Dekatkan kamera ke kebab yang sedang dipanggang, suara 'cessss']*."
- **[Visual: Crew melipat kebab dengan gerakan super cepat, diputar-putar ala bartender akrobatik tapi gagal dikit, lalu dia tersenyum sarkas ke kamera.]**
- **Crew**: "Kerja capek-capek dari pagi sampai sore, dimarahin bos yang hobinya revisi H-1 menit... terus lu pulang cuman makan angin? Sini ke outlet, beli Kebab Turki Baba Rafi. Dagingnya tebal, setebal rasa bersalah lu pas mutusin mantan kemarin."
- **[Visual: Crew menyodorkan kebab hangat ke arah kamera dengan senyum ramah yang sangat dipaksakan.]**
- **Crew**: "Makan ini kebab, dijamin kenyang. Urusan cicilan besok pagi biar dipikirin besok pagi lagi. Dah lah, buruan beli sebelum gue capek berdiri!"

---

#### 💡 Catatan Visual & Properti
- Gunakan transisi cepat (jump cut) antara muka crew yang lelah dan visual kebab yang sedang dipanggang dekat sekali (*extreme close up*).
- Properti: Capit besi besar, celemek Baba Rafi, dan ekspresi wajah 'pecicilan tapi tertekan'.
`;
}

export function getMockTranscription(fileName: string): {
  transcription: string;
  analysis: string;
} {
  return {
    transcription: `[00:01] Jadi hari ini gue mau nyobain makanan teraneh yang pernah ada.
[00:04] Gila sih ini antriannya panjang banget cuy.
[00:08] Pas digigit... beuh, keju lumer langsung meledak di mulut!
[00:12] Harganya cuma 20 ribu tapi rasanya kaya bintang lima.
[00:15] Buruan kalian harus coba ke sini sekarang juga!`,
    analysis: `### 📊 Analisis Struktur Skrip (${fileName})
- **Hook (Detik 0-3)**: *"Jadi hari ini gue mau nyobain makanan teraneh yang pernah ada"* -> Memicu rasa penasaran instan (curiosity gap) dengan menggunakan kata provokatif "teraneh".
- **Visual Retention**: Antrian yang panjang menciptakan *social proof* (bukti bahwa makanan ini enak karena banyak yang rela antre).
- **Climax/Pacing**: Close up keju yang meleleh merangsang sensor visual lapar penonton (*foodporn*).
- **CTA**: Cepat dan persuasif tanpa bertele-tele.

### 💡 Ide Adaptasi Baba Rafi (Gaya Sarkas Crew)
- **Konsep**: Kebalikan dari video asli yang 'teraneh', kita buat 'Kebab Ter-normal'.
- **Skrip Adaptasi**: *"Hari ini gue mau nunjukin kebab ter-normal di dunia. Gak ada keju yang ditarik sampai satu meter, gak ada emas 24 karat di atasnya. Cuma daging sapi premium melimpah sama saus rahasia yang rasanya konsisten bikin lu gak sedih lagi. Sederhana, kenyang, gak usah banyak gaya."*`,
  };
}
