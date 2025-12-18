import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document
from dotenv import load_dotenv

# Load Environment Variables (API Key & DB URL)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Konfigurasi Koneksi Database
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("❌ ERROR: DATABASE_URL tidak ditemukan di .env")
    exit()

# Setup koneksi postgres
connection_string = db_url.replace("postgresql://", "postgresql+psycopg2://")
collection_name = "materi_kuliah"

def ingest_data():
    print("🚀 Memulai proses ingestion data...")

    # Load File Materi
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, "materi_biologi.txt")
    
    if not os.path.exists(file_path):
        print(f"❌ File {file_path} tidak ditemukan!")
        # Membuat file dummy jika tidak ada, agar script bisa dites jalan
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("Biologi adalah kajian tentang kehidupan, dan organisme hidup, termasuk struktur, fungsi, pertumbuhan, evolusi, persebaran, dan taksonominya.")
        print(f"⚠️  File dummy dibuat di {file_path}. Silakan ganti isinya dengan materi asli.")

    # Baca file teks
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    
    raw_documents = [Document(page_content=text, metadata={"source": "materi_biologi.txt"})]
    print(f"📄 Berhasil membaca file: {file_path}")

    # Split Text
    text_splitter = CharacterTextSplitter(
        separator="\n", # Mengubah separator jadi newline biasa agar lebih aman untuk teks pendek
        chunk_size=500,
        chunk_overlap=50
    )
    docs = text_splitter.split_documents(raw_documents)
    print(f"✂️  Dokumen dipecah menjadi {len(docs)} bagian (chunks).")

    # Simpan ke Vector Database (PostgreSQL)
    print("💾 Menyiapkan Embedding Model (all-MiniLM-L6-v2)...")
    print("   (Pertama kali run akan download model ±80MB, mohon tunggu)")
    
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        print("💾 Menyimpan ke Database... Mohon tunggu.")
        
        PGVector.from_documents(
            embedding=embeddings,
            documents=docs,
            collection_name=collection_name,
            connection=connection_string,
            # pre_delete_collection=True # Uncomment jika ingin menghapus data lama setiap kali run
        )
        print("✅ SUKSES! Data berhasil di-embedding dan disimpan ke PostgreSQL.")
        print("   Data siap digunakan untuk retrieval.")
        
    except Exception as e:
        print(f"❌ Terjadi kesalahan saat menyimpan ke database: {e}")
        print("   Pastikan Docker container database sudah berjalan.")
        print("   TIP: Coba jalankan 'docker-compose down -v' lalu 'docker-compose up -d' untuk reset password DB.")

if __name__ == "__main__":
    ingest_data()
