import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, User, Bot, Loader2, Image as ImageIcon, HelpCircle, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- KOMPONEN CANVAS (PANEL KANAN) ---
const LearningCanvas = ({ data }) => {
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
        <BookOpen size={48} className="mb-4 opacity-50" />
        <p className="font-medium">Learning Canvas Kosong</p>
        <p className="text-sm mt-2">Pilih mode "Visual" atau "Quiz" dan kirim pertanyaan untuk memunculkan konten di sini.</p>
      </div>
    );
  }

  // Tampilan jika data adalah GAMBAR
  if (data.type === 'image') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-700">
          <ImageIcon size={20}/> Visualisasi Materi
        </h3>
        <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
          <img src={data.url} alt="Visual" className="w-full h-auto object-contain" />
        </div>
        <p className="text-sm text-gray-600 italic text-center bg-gray-50 p-3 rounded">{data.caption}</p>
      </div>
    );
  }

  // Tampilan jika data adalah KUIS
  if (data.type === 'quiz') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-green-700">
          <HelpCircle size={20}/> Kuis Interaktif
        </h3>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="font-medium text-lg text-gray-800">{data.question}</p>
        </div>
        <div className="space-y-3">
          {data.options.map((opt, idx) => (
            <button key={idx} 
              onClick={() => alert(opt === data.correct_answer ? "✅ JAWABAN BENAR!\n\n" + data.explanation : "❌ KURANG TEPAT.\n\nCoba lagi!")}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium text-gray-700 shadow-sm">
              {opt}
            </button>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-center text-gray-400">
          Klik salah satu jawaban untuk melihat hasil
        </div>
      </div>
    );
  }

  return null;
};

// --- APLIKASI UTAMA ---
export default function AICademicsApp() {
  const [messages, setMessages] = useState([{ 
    role: 'ai', 
    content: 'Halo! Saya AICademics. Silakan pilih mode di bawah (Visual/Quiz) jika ingin tampilan interaktif.',
    references: []
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat'); // chat | visual | quiz
  const [canvasData, setCanvasData] = useState(null); // Data untuk layar kanan
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    const currentMode = mode; // Simpan mode saat tombol ditekan

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "mahasiswa-1",
          message: userMessage,
          mode: currentMode
        }),
      });

      const data = await response.json();

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.answer,
        references: data.references
      }]);

      // Jika backend mengirim data canvas (kuis/gambar), update layar kanan
      if (data.canvas_data) {
        setCanvasData(data.canvas_data);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "Error: Tidak dapat terhubung ke server backend.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans p-4 gap-4 overflow-hidden">
      
      {/* KOLOM KIRI: CHAT INTERFACE */}
      <div className="w-1/2 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <header className="p-4 bg-slate-900 text-white flex items-center gap-3 shadow-md z-10">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm">AI</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">AICademics</h1>
            <p className="text-[10px] text-blue-200 opacity-80">RAG Learning Assistant</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3.5 rounded-2xl text-sm prose prose-sm max-w-none shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.role === 'ai' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                </div>
                
                {/* Referensi (Hanya muncul jika ada) */}
                {msg.references && msg.references.length > 0 && (
                  <div className="mt-1 ml-1 text-[10px] text-gray-400 flex gap-1 items-center">
                    <BookOpen size={10}/> Sumber Terverifikasi
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex gap-3 ml-1">
               <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center"><Bot size={16} className="text-gray-400"/></div>
               <div className="bg-gray-50 px-4 py-2 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2">
                 <Loader2 className="animate-spin text-blue-500" size={14} />
                 <span className="text-gray-400 text-xs italic">Sedang berpikir...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          
          {/* Mode Selector Buttons */}
          <div className="flex gap-2 mb-3 justify-center">
            <button 
              onClick={() => setMode('chat')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                mode === 'chat' ? 'bg-blue-600 text-white ring-2 ring-blue-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}>
              <MessageSquare size={14}/> Chat
            </button>
            <button 
              onClick={() => setMode('visual')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                mode === 'visual' ? 'bg-purple-600 text-white ring-2 ring-purple-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}>
              <ImageIcon size={14}/> Visual
            </button>
            <button 
              onClick={() => setMode('quiz')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                mode === 'quiz' ? 'bg-green-600 text-white ring-2 ring-green-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}>
              <HelpCircle size={14}/> Quiz
            </button>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ketik pesan untuk mode ${mode.toUpperCase()}...`}
              disabled={loading}
              className="flex-1 p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-inner bg-white"
            />
            <button onClick={handleSend} disabled={loading} className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* KOLOM KANAN: LEARNING CANVAS */}
      <div className="w-1/2 flex flex-col bg-gray-50 rounded-2xl border border-gray-200 p-1 shadow-inner relative">
        <div className="absolute top-0 left-0 right-0 h-14 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 rounded-t-2xl z-10">
           <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
            <BookOpen className="text-orange-500" size={18}/> Learning Canvas
          </h2>
          <span className="text-[10px] font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded border border-gray-300">
            {canvasData ? canvasData.type.toUpperCase() : 'IDLE'} MODE
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto pt-16 px-4 pb-4">
          <LearningCanvas data={canvasData} />
        </div>
      </div>

    </div>
  );
}