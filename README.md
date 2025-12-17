# AICademics 🎓

**AICademics** adalah asisten belajar berbasis AI (*Retrieval Augmented Generation* / RAG) yang dirancang khusus untuk membantu mahasiswa memahami materi kuliah dengan lebih interaktif.

Proyek ini memiliki fitur unggulan **Multimodal Learning Canvas**, di mana antarmuka terbagi menjadi dua bagian:
1.  **Chat Interface (Kiri)**: Diskusi teks mendalam berdasarkan referensi materi kuliah.
2.  **Learning Canvas (Kanan)**: Menampilkan visualisasi materi atau kuis interaktif yang dihasilkan secara dinamis oleh AI.

---

## 🚀 Tech Stack

Aplikasi ini dibangun menggunakan teknologi modern untuk menjamin performa dan skalabilitas:

### **Backend (The Brain)**
* **Framework**: Python FastAPI (Async)
* **AI Orchestration**: LangChain & LangGraph
* **LLM**: Google Gemini 2.5 Flash
* **Embeddings**: Hugging Face `all-MiniLM-L6-v2`
* **Vector Driver**: `langchain-postgres`

### **Frontend (The Interface)**
* **Framework**: React JS (Vite)
* **Styling**: Tailwind CSS v3.4
* **Icons**: Lucide React
* **Rendering**: React Markdown

### **Infrastructure & Database**
* **Database**: PostgreSQL dengan ekstensi `pgvector`
* **Containerization**: Docker & Docker Compose

---

## 🛠️ Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:
* [Docker Desktop](https://www.docker.com/)
* [Python 3.10+](https://www.python.org/)
* [Node.js](https://nodejs.org/)
