import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  Clock,
  Download,
  Eye,
  FileText,
  Printer,
  School,
  User,
} from "lucide-react";
import React, { useRef, useState } from "react";

const ResultPPDB = () => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const printRef = useRef();

  // Data siswa yang lulus - bisa diganti dengan props atau state dari parent
  const studentData = {
    namaLengkap: "Ahmad Rizki Pratama",
    nisn: "0012345678",
    tempatLahir: "Jakarta",
    tanggalLahir: "15 Mei 2008",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Merdeka No. 123, Jakarta Pusat",
    noTelp: "081234567890",
    email: "ahmad.rizki@email.com",
    asalSekolah: "SMP Negeri 1 Jakarta",
    jurusan: "IPA",
    nilaiTotal: 385,
    ranking: 15,
    tanggalDaftar: "15 Januari 2024",
    tanggalPengumuman: "28 Februari 2024",
    tahunAjaran: "2024/2025",
  };

  const schoolData = {
    nama: "SMA Negeri 1 Samarinda",
    alamat: "Jl. Pendidikan No. 456, Samarinda, Kalimantan Timur",
    telepon: "(0541) 123-4567",
    email: "info@sman1samarinda.sch.id",
    website: "www.sman1samarinda.sch.id",
    kepalaSekolah: "Dr. Siti Aminah, S.Pd., M.Ed.",
    nip: "196501231990032001",
  };

  const getCurrentDate = () => {
    const date = new Date();
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDownloadPDF = () => {
    // Simulasi download PDF
    alert(
      "Fitur download PDF akan segera tersedia! Untuk sementara, gunakan tombol Print untuk mencetak surat."
    );
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const winPrint = window.open(
      "",
      "",
      "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0"
    );

    winPrint.document.write(`
      <html>
        <head>
          <title>Surat Penerimaan - ${studentData.namaLengkap}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.6;
              color: #000;
            }
            .letterhead { 
              text-align: center; 
              border-bottom: 3px solid #000; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .school-logo { 
              width: 80px; 
              height: 80px; 
              margin: 0 auto 15px; 
              background: #e5e7eb; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin: 10px 0; 
            }
            .subtitle { 
              font-size: 14px; 
              margin: 5px 0; 
            }
            .letter-content { 
              margin: 30px 0; 
            }
            .letter-title { 
              text-align: center; 
              font-size: 18px; 
              font-weight: bold; 
              text-decoration: underline; 
              margin: 30px 0; 
            }
            .date-number { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .content p { 
              margin: 15px 0; 
              text-align: justify; 
            }
            .student-table { 
              width: 100%; 
              margin: 20px 0; 
              border-collapse: collapse; 
            }
            .student-table td { 
              padding: 8px 0; 
              vertical-align: top; 
            }
            .student-table td:first-child { 
              width: 200px; 
            }
            .student-table td:nth-child(2) { 
              width: 20px; 
              text-align: center; 
            }
            .signature { 
              margin-top: 50px; 
              text-align: right; 
            }
            .signature-space { 
              height: 80px; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    winPrint.document.close();
    winPrint.focus();
    winPrint.print();
    winPrint.close();
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const SuratContent = () => (
    <div
      ref={printRef}
      className="bg-white shadow-2xl rounded-3xl overflow-hidden max-w-4xl mx-auto">
      {/* Letterhead */}
      <div className="letterhead p-8 border-b-4 border-blue-600">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <School className="w-10 h-10 text-blue-600" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              PEMERINTAH PROVINSI KALIMANTAN TIMUR
            </h1>
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {schoolData.nama.toUpperCase()}
            </h2>
            <p className="text-sm text-gray-600 mb-1">{schoolData.alamat}</p>
            <p className="text-sm text-gray-600">
              Telp: {schoolData.telepon} | Email: {schoolData.email} | Web:{" "}
              {schoolData.website}
            </p>
          </div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Award className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Letter Content */}
      <div className="p-8">
        {/* Letter Title */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-800 underline decoration-2 underline-offset-4 mb-4">
            SURAT PENERIMAAN SISWA BARU
          </h3>
          <p className="text-gray-600">
            Nomor: 421/001/SMAN1-SMD/{new Date().getFullYear()} | Tanggal:{" "}
            {getCurrentDate()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-gray-700">
          <p className="text-justify leading-relaxed">
            Berdasarkan hasil seleksi penerimaan siswa baru {schoolData.nama}{" "}
            tahun ajaran {studentData.tahunAjaran}, dengan ini kami sampaikan
            bahwa:
          </p>

          {/* Student Details Table */}
          <div className="bg-gray-50 rounded-2xl p-6 my-8">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 font-semibold w-48">Nama Lengkap</td>
                  <td className="py-2 w-4">:</td>
                  <td className="py-2 font-bold text-blue-600">
                    {studentData.namaLengkap}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">NISN</td>
                  <td className="py-2">:</td>
                  <td className="py-2">{studentData.nisn}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Tempat, Tanggal Lahir</td>
                  <td className="py-2">:</td>
                  <td className="py-2">
                    {studentData.tempatLahir}, {studentData.tanggalLahir}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Jenis Kelamin</td>
                  <td className="py-2">:</td>
                  <td className="py-2">{studentData.jenisKelamin}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Alamat</td>
                  <td className="py-2">:</td>
                  <td className="py-2">{studentData.alamat}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Asal Sekolah</td>
                  <td className="py-2">:</td>
                  <td className="py-2">{studentData.asalSekolah}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Jurusan Pilihan</td>
                  <td className="py-2">:</td>
                  <td className="py-2 font-semibold text-green-600">
                    {studentData.jurusan}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Nilai Total</td>
                  <td className="py-2">:</td>
                  <td className="py-2 font-bold text-green-600">
                    {studentData.nilaiTotal}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Ranking</td>
                  <td className="py-2">:</td>
                  <td className="py-2 font-bold text-blue-600">
                    {studentData.ranking}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Acceptance Notice */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 my-8">
            <div className="flex items-center gap-3 mb-4">
              <Check className="w-8 h-8 text-green-600" />
              <h4 className="text-xl font-bold text-green-700">
                DINYATAKAN DITERIMA
              </h4>
            </div>
            <p className="text-green-700 font-semibold">
              sebagai siswa baru di {schoolData.nama} pada jurusan{" "}
              {studentData.jurusan}
              untuk tahun ajaran {studentData.tahunAjaran}.
            </p>
          </div>

          <p className="text-justify leading-relaxed">
            Sehubungan dengan diterimanya yang bersangkutan, maka dimohon untuk
            melakukan
            <strong> daftar ulang </strong> pada:
          </p>

          {/* Registration Info */}
          <div className="bg-blue-50 rounded-2xl p-6 my-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-700">
                    Tanggal Daftar Ulang
                  </p>
                  <p className="text-blue-600 font-bold">1 - 15 Maret 2024</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-700">Waktu</p>
                  <p className="text-blue-600 font-bold">08.00 - 15.00 WIB</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-justify leading-relaxed">
            Dengan membawa kelengkapan dokumen sebagai berikut:
          </p>

          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h5 className="font-bold text-gray-800 mb-3">Dokumen Asli:</h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Ijazah SMP/MTs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>SKHUN SMP/MTs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Akta Kelahiran</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Kartu Keluarga</span>
                </li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h5 className="font-bold text-gray-800 mb-3">
                Fotokopi (3 lembar):
              </h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Ijazah & SKHUN SMP/MTs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Akta Kelahiran</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Kartu Keluarga</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>Pas foto 3x4 (6 lembar)</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-justify leading-relaxed">
            Apabila dalam batas waktu yang ditentukan yang bersangkutan tidak
            melakukan daftar ulang, maka dianggap{" "}
            <strong>mengundurkan diri</strong> dan haknya akan diberikan kepada
            calon siswa lain.
          </p>

          <p className="text-justify leading-relaxed">
            Demikian surat penerimaan ini dibuat untuk dapat dipergunakan
            sebagaimana mestinya.
          </p>
        </div>

        {/* Signature */}
        <div className="flex justify-end mt-12">
          <div className="text-center">
            <p className="mb-1">Samarinda, {getCurrentDate()}</p>
            <p className="mb-16 font-semibold">Kepala Sekolah</p>
            <div className="border-b-2 border-gray-800 pb-1 mb-2">
              <p className="font-bold">{schoolData.kepalaSekolah}</p>
            </div>
            <p className="text-sm">NIP. {schoolData.nip}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          {/* Preview Header */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={togglePreview}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Editor</span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <SuratContent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl mb-6">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">Generator Surat</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Surat Penerimaan Siswa
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate dan download surat penerimaan resmi untuk siswa yang
            diterima
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Student Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                Data Siswa
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Nama Lengkap
                  </label>
                  <p className="text-lg font-bold text-gray-800">
                    {studentData.namaLengkap}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    NISN
                  </label>
                  <p className="text-gray-800">{studentData.nisn}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Jurusan
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {studentData.jurusan}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Nilai Total
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    {studentData.nilaiTotal}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Ranking
                  </label>
                  <p className="text-xl font-bold text-blue-600">
                    #{studentData.ranking}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-8 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center gap-3 text-green-700">
                  <Check className="w-6 h-6" />
                  <span className="font-bold text-lg">STATUS: LULUS</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={togglePreview}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                  <Eye className="w-5 h-5" />
                  <span>Preview Surat</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
                  <Download className="w-5 h-5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Letter Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Preview Surat
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Print">
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Download">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Letter Preview with smaller scale */}
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                <div className="transform scale-75 origin-top-left w-[133.33%] h-auto">
                  <SuratContent />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Petunjuk Penggunaan
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">1. Preview</h4>
              <p className="text-gray-600 text-sm">
                {`                Klik "Preview Surat" untuk melihat surat dalam tampilan penuh
`}{" "}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">2. Download</h4>
              <p className="text-gray-600 text-sm">
                Download surat dalam format PDF untuk arsip digital
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Printer className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">3. Print</h4>
              <p className="text-gray-600 text-sm">
                Cetak surat menggunakan printer untuk keperluan resmi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPPDB;
