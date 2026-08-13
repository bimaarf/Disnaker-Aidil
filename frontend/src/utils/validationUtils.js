export const calculateValidationStatus = (result) => {
  if (!result) return getValidationStatusObject("Belum_Diverifikasi");
  return getValidationStatusObject(
    getStatusFromResult(result.status, result.is_approve, result.selection_type)
  );
};
export const getValidationStatusObject = (status) => {
  const normalizedStatus = status ? status : "Belum_Diverifikasi";
  const validStatuses = [
    "Belum_Diverifikasi",   // Status awal saat submit
    "Belum_Ditentukan",      // Setelah verifikasi berkas (diterima/dikembalikan), tapi belum ada hasil seleksi
    "Menunggu_Hasil",        // User biasa menunggu publikasi hasil
    "Berkas_Diterima",       // Berkas disetujui
    "Berkas_Dikembalikan",   // Berkas dikembalikan
    "Lulus",                 // Hasil akhir: lulus
    "Tidak_Lulus",           // Hasil akhir: tidak lulus
  ];

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      label: "Belum_Diverifikasi",
      icon: "help",
      color: "orange",
    };
  }

  return {
    label: normalizedStatus,
    icon:
      normalizedStatus === "Lulus"
        ? "check_circle"
        : normalizedStatus === "Tidak_Lulus"
        ? "cancel"
        : normalizedStatus === "Berkas_Diterima"
        ? "check_circle"
        : normalizedStatus === "Berkas_Dikembalikan"
        ? "cancel"
        : normalizedStatus === "Menunggu_Hasil"
        ? "pending"
        : normalizedStatus === "Belum_Ditentukan"
        ? "schedule"
        : normalizedStatus === "Belum_Diverifikasi"
        ? "help"
        : "help",
    color:
      normalizedStatus === "Lulus"
        ? "green"
        : normalizedStatus === "Tidak_Lulus"
        ? "red"
        : normalizedStatus === "Berkas_Diterima"
        ? "green"
        : normalizedStatus === "Berkas_Dikembalikan"
        ? "red"
        : normalizedStatus === "Menunggu_Hasil"
        ? "blue"
        : normalizedStatus === "Belum_Ditentukan"
        ? "gray"
        : normalizedStatus === "Belum_Diverifikasi"
        ? "orange"
        : "orange",
  };
};

export const getStatusFromResult = (
  status,
  is_approve,
  selection_type,
  is_published = true,
  userRole = "administrator"
) => {
  // 1. Status awal: Belum_Diverifikasi (saat pertama submit)
  let statusLabel = "Belum_Diverifikasi";

  // 2. Jika berkas sudah diverifikasi (diterima atau dikembalikan)
  if (is_approve === true) {
    statusLabel = "Berkas_Diterima";
    
    // Jika berkas diterima tapi belum ada hasil seleksi
    if (status === null && selection_type !== null) {
      statusLabel = "Belum_Ditentukan";
    }
  } else if (is_approve === false) {
    statusLabel = "Berkas_Dikembalikan";
    
    // Jika berkas dikembalikan tapi belum ada hasil seleksi
    if (status === null && selection_type !== null) {
      statusLabel = "Belum_Ditentukan";
    }
  }

  // 3. Untuk user biasa: jika periode belum publish dan ada seleksi, tampilkan "Menunggu_Hasil"
  if (userRole === "user" && selection_type !== null && !is_published) {
    // Hanya tampilkan "Menunggu_Hasil" jika berkas sudah diverifikasi
    if (is_approve === true || is_approve === false) {
      statusLabel = "Menunggu_Hasil";
    }
  }

  // 4. Status hasil seleksi HANYA jika periode sudah publish
  if (is_published) {
    if (status === true) {
      statusLabel = "Lulus";
    } else if (status === false && selection_type !== null) {
      statusLabel = "Tidak_Lulus";
    }
  }

  return statusLabel;
};

// Contoh penggunaan dan flow status:
/*
Flow Status Submission:

1. BELUM_DIVERIFIKASI (Status Awal)
   - Kondisi: User baru submit, belum ada verifikasi
   - is_approve = null
   - status = null

2. BERKAS_DITERIMA / BERKAS_DIKEMBALIKAN
   - Kondisi: Admin sudah verifikasi berkas
   - is_approve = true (diterima) atau false (dikembalikan)
   - status = null (belum ada hasil seleksi)

3. BELUM_DITENTUKAN
   - Kondisi: Berkas sudah diverifikasi (diterima/dikembalikan) 
             DAN ada proses seleksi (selection_type !== null)
             TAPI belum ada hasil (status = null)
   - is_approve = true atau false
   - status = null
   - selection_type !== null

4. MENUNGGU_HASIL (Khusus User Biasa)
   - Kondisi: User role = "user"
             Berkas sudah diverifikasi
             Ada proses seleksi
             Hasil belum dipublish (is_published = false)
   - is_approve = true atau false
   - status = null atau boolean
   - selection_type !== null
   - is_published = false

5. LULUS / TIDAK_LULUS (Status Akhir)
   - Kondisi: Hasil sudah dipublish
   - is_approve = true/false (bisa apapun)
   - status = true (lulus) atau false (tidak lulus)
   - is_published = true

Contoh Skenario:

Skenario A: Submit → Verifikasi Berkas
- Submit: Belum_Diverifikasi
- Berkas diterima: Berkas_Diterima

Skenario B: Submit → Verifikasi → Ada Seleksi → Belum Ada Hasil
- Submit: Belum_Diverifikasi
- Berkas diterima: Berkas_Diterima
- Admin set selection_type, tapi status = null: Belum_Ditentukan

Skenario C: Submit → Verifikasi → Ada Seleksi → Hasil Belum Publish (User View)
- Submit: Belum_Diverifikasi
- Berkas diterima: Berkas_Diterima
- Ada seleksi, hasil ada tapi belum publish: Menunggu_Hasil

Skenario D: Submit → Verifikasi → Ada Seleksi → Hasil Publish
- Submit: Belum_Diverifikasi
- Berkas diterima: Berkas_Diterima
- Hasil publish: Lulus atau Tidak_Lulus
*/