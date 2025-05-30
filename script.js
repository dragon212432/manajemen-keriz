// Helper Functions
function loadData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Fungsi untuk menampilkan notifikasi toast
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'} mr-2"></i> ${message}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Fungsi addRow yang dimodifikasi untuk menambahkan tombol hapus dan edit serta kolom keterangan
function addRow(tableId, rowData, originalIndex, type, rawItem) { // Parameter originalIndex
  const tbody = document.querySelector(`#${tableId} tbody`);
  const tr = document.createElement('tr');
  tr.dataset.originalIndex = originalIndex; // Simpan originalIndex di dataset

  rowData.forEach((text) => {
    const td = document.createElement('td');
    td.className = 'p-2 border-b';
    td.textContent = text;
    tr.appendChild(td);
  });

  const tdAksi = document.createElement('td');
  tdAksi.className = 'p-2 border-b flex gap-1';

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.className = 'bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors duration-150';
  editButton.onclick = () => editEntry(originalIndex, type, rawItem); // Gunakan originalIndex
  tdAksi.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Hapus';
  deleteButton.className = 'bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors duration-150';
  deleteButton.onclick = () => confirmDelete(originalIndex, type, rawItem); // Gunakan originalIndex
  tdAksi.appendChild(deleteButton);

  tr.appendChild(tdAksi);
  tbody.appendChild(tr);
}

// Fungsi Konfirmasi Hapus yang lebih informatif
function confirmDelete(index, type, item) {
  let message = '';
  if (type === 'uang') {
    message = `Apakah Anda yakin ingin menghapus transaksi uang pada tanggal ${item.tanggal} sejumlah ${formatRupiah(item.jumlah)} (${item.jenis}) ${item.keterangan ? `dengan keterangan "${item.keterangan}"` : ''}?`;
  } else if (type === 'stok') {
    message = `Apakah Anda yakin ingin menghapus transaksi barang "${item.nama}" sejumlah ${item.jumlah} (${item.jenis}) pada tanggal ${item.tanggal} ${item.keterangan ? `dengan keterangan "${item.keterangan}"` : ''}?`;
  }

  const confirmation = confirm(message);
  if (confirmation) {
    deleteEntry(index, type);
    showToast('Transaksi berhasil dihapus!', 'success');
  } else {
    showToast('Penghapusan dibatalkan.', 'info');
  }
}

// Fungsi untuk menghapus entri
function deleteEntry(index, type) {
  let data;
  let tableId;
  let key;

  if (type === 'uang') {
    key = 'uang';
    tableId = 'tabelUang';
  } else if (type === 'stok') {
    key = 'stok';
    tableId = 'tabelStok';
  }

  data = loadData(key);
  data.splice(index, 1);
  saveData(key, data);

  // Re-apply current filters after deletion
  if (type === 'uang') {
    document.getElementById('applyFilterUang').click(); // Re-apply filter
  } else if (type === 'stok') {
    document.getElementById('applyFilterStok').click(); // Re-apply filter
    renderInventarisStok();
  }
}

// Fungsi Edit Entri (Uang dan Stok)
function editEntry(index, type, item) {
  if (type === 'uang') {
    document.getElementById('uangId').value = index;
    document.getElementById('uangTanggal').value = item.tanggal;
    document.getElementById('uangJumlah').value = item.jumlah;
    document.getElementById('uangJenis').value = item.jenis;
    document.getElementById('uangKeterangan').value = item.keterangan || '';
    document.getElementById('uangFormButtonText').textContent = 'Update Transaksi';
    showToast('Mode Edit Transaksi Uang.', 'info');
  } else if (type === 'stok') {
    document.getElementById('stokId').value = index;
    document.getElementById('stokTanggal').value = item.tanggal;
    document.getElementById('stokNama').value = item.nama;
    document.getElementById('stokJumlah').value = item.jumlah;
    document.getElementById('stokJenis').value = item.jenis;
    document.getElementById('stokKeterangan').value = item.keterangan || '';
    document.getElementById('stokFormButtonText').textContent = 'Update Barang';
    showToast('Mode Edit Transaksi Barang.', 'info');
  }
}

function renderTable(tableId, data, type) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = '';
  const originalData = loadData(type); // Ambil data asli untuk mendapatkan originalIndex

  data.forEach((item, index) => {
    // Cari index asli item ini di data yang belum difilter
    // Ini penting karena filter mengubah urutan dan jumlah item
    const originalIndex = originalData.findIndex(originalItem =>
      originalItem.tanggal === item.tanggal &&
      originalItem.jumlah === item.jumlah &&
      originalItem.jenis === item.jenis &&
      originalItem.keterangan === item.keterangan &&
      (type === 'stok' ? originalItem.nama === item.nama : true)
    );

    if (type === 'uang') {
      addRow(tableId, [item.tanggal, formatRupiah(item.jumlah), item.jenis, item.keterangan || '-'], originalIndex, 'uang', item);
    } else if (type === 'stok') {
      addRow(tableId, [item.tanggal, item.nama, item.jumlah, item.jenis, item.keterangan || '-'], originalIndex, 'stok', item);
    }
  });
}

// Format Angka ke Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}

// Fungsi untuk memperbarui ringkasan uang (berdasarkan data yang difilter)
function updateUangSummary(filteredData = null) {
  const dataToSummarize = filteredData || loadData('uang'); // Gunakan data yang difilter jika ada, jika tidak, semua data
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  dataToSummarize.forEach(item => {
    const jumlah = parseFloat(item.jumlah);
    if (item.jenis === 'masuk') {
      totalPemasukan += jumlah;
    } else if (item.jenis === 'keluar') {
      totalPengeluaran += jumlah;
    }
  });

  document.getElementById('totalPemasukan').textContent = formatRupiah(totalPemasukan);
  document.getElementById('totalPengeluaran').textContent = formatRupiah(totalPengeluaran);
  document.getElementById('saldoBersih').textContent = formatRupiah(totalPemasukan - totalPengeluaran);
}

// Fungsi untuk merender tabel inventaris stok
function renderInventarisStok() {
  const dataStok = loadData('stok');
  const inventaris = {};

  dataStok.forEach(item => {
    const namaBarang = item.nama.toLowerCase();
    const jumlah = parseInt(item.jumlah);

    if (!inventaris[namaBarang]) {
      inventaris[namaBarang] = 0;
    }

    if (item.jenis === 'masuk') {
      inventaris[namaBarang] += jumlah;
    } else if (item.jenis === 'keluar') {
      inventaris[namaBarang] -= jumlah;
    }
  });

  const tbodyInventaris = document.querySelector('#tabelInventarisStok tbody');
  tbodyInventaris.innerHTML = '';

  for (const namaBarang in inventaris) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 border-b">${namaBarang.charAt(0).toUpperCase() + namaBarang.slice(1)}</td>
      <td class="p-2 border-b">${inventaris[namaBarang]}</td>
    `;
    tbodyInventaris.appendChild(tr);
  }
}

// Fungsi printTable yang dimodifikasi untuk judul laporan dan menyembunyikan aksi
function printTable(tableId, title) {
  const printWindow = window.open('', '_blank');
  const tableHTML = document.getElementById(tableId).outerHTML;
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h2 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
          thead { background-color: #f2f2f2; }
          /* Sembunyikan kolom "Aksi" saat print */
          table th:last-child,
          table td:last-child {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${tableHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Tab Switching
function showTab(tabId, clickedButton) {
  document.getElementById('tab-uang').classList.add('hidden');
  document.getElementById('tab-stok').classList.add('hidden');
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-green-600', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  });

  if (clickedButton) {
    clickedButton.classList.add('bg-green-600', 'text-white');
    clickedButton.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  }

  // Reset filters and forms when switching tabs
  if (tabId === 'uang') {
    document.getElementById('filterUangTanggalAwal').value = '';
    document.getElementById('filterUangTanggalAkhir').value = '';
    document.getElementById('filterUangJenis').value = '';
    document.getElementById('searchUang').value = '';
    document.getElementById('formUang').reset();
    document.getElementById('uangId').value = '';
    document.getElementById('uangFormButtonText').textContent = 'Tambah Transaksi';
    
    // Apply initial filter (all data)
    applyFilterUangInternal('', '', '', ''); // Apply no date filter initially
    updateUangSummary(loadData('uang')); // Update summary for all data
  } else if (tabId === 'stok') {
    document.getElementById('filterStokTanggalAwal').value = '';
    document.getElementById('filterStokTanggalAkhir').value = '';
    document.getElementById('searchStokNama').value = '';
    document.getElementById('filterStokJenis').value = '';
    document.getElementById('formStok').reset();
    document.getElementById('stokId').value = '';
    document.getElementById('stokFormButtonText').textContent = 'Tambah Barang';

    // Apply initial filter (all data)
    applyFilterStokInternal('', '', '', ''); // Apply no date filter initially
    renderInventarisStok();
  }
}

// Internal filter function for Uang (reusable for initial load, filter, and delete)
function applyFilterUangInternal(tanggalAwal, tanggalAkhir, jenis, searchTerm) {
  const originalData = loadData('uang');
  const filteredData = originalData.filter(item => {
    const itemTanggal = item.tanggal; // Format YYYY-MM-DD

    if (tanggalAwal && itemTanggal < tanggalAwal) return false;
    if (tanggalAkhir && itemTanggal > tanggalAkhir) return false;

    if (jenis && item.jenis !== jenis) return false;

    // Search by formatted amount or description
    const includesSearchTerm = (
      formatRupiah(item.jumlah).toLowerCase().includes(searchTerm) ||
      (item.keterangan || '').toLowerCase().includes(searchTerm)
    );
    if (searchTerm && !includesSearchTerm) return false;

    return true;
  });
  renderTable('tabelUang', filteredData, 'uang');
  updateUangSummary(filteredData); // Update summary based on filtered data
}

// Internal filter function for Stok (reusable for initial load, filter, and delete)
function applyFilterStokInternal(tanggalAwal, tanggalAkhir, nama, jenis) {
  const originalData = loadData('stok');
  const filteredData = originalData.filter(item => {
    const itemTanggal = item.tanggal;

    if (tanggalAwal && itemTanggal < tanggalAwal) return false;
    if (tanggalAkhir && itemTanggal > tanggalAkhir) return false;

    // Search by item name or description
    const includesSearchTerm = (
      item.nama.toLowerCase().includes(nama) ||
      (item.keterangan || '').toLowerCase().includes(nama)
    );
    if (nama && !includesSearchTerm) return false;

    if (jenis && item.jenis !== jenis) return false;

    return true;
  });
  renderTable('tabelStok', filteredData, 'stok');
}


// Form Handlers
document.getElementById('formUang').addEventListener('submit', function (e) {
  e.preventDefault();
  let data = loadData('uang');
  const uangId = document.getElementById('uangId').value;
  const jumlah = parseFloat(document.getElementById('uangJumlah').value);

  if (isNaN(jumlah) || jumlah <= 0) {
    showToast('Jumlah harus berupa angka positif!', 'error');
    return;
  }

  const entry = {
    tanggal: document.getElementById('uangTanggal').value,
    jumlah: jumlah,
    jenis: document.getElementById('uangJenis').value,
    keterangan: document.getElementById('uangKeterangan').value.trim() || '-' // Pastikan keterangan disimpan, default ke '-'
  };

  if (uangId !== '') {
    data[parseInt(uangId)] = entry;
    showToast('Transaksi uang berhasil diperbarui!', 'success');
  } else {
    data.push(entry);
    showToast('Transaksi uang berhasil ditambahkan!', 'success');
  }
  saveData('uang', data);
  // Re-apply current filters after adding/updating
  document.getElementById('applyFilterUang').click(); 
  this.reset();
  document.getElementById('uangId').value = '';
  document.getElementById('uangFormButtonText').textContent = 'Tambah Transaksi';
});

document.getElementById('formStok').addEventListener('submit', function (e) {
  e.preventDefault();
  let data = loadData('stok');
  const stokId = document.getElementById('stokId').value;
  const jumlah = parseInt(document.getElementById('stokJumlah').value);

  if (isNaN(jumlah) || jumlah <= 0) {
    showToast('Jumlah harus berupa angka positif!', 'error');
    return;
  }

  const entry = {
    tanggal: document.getElementById('stokTanggal').value,
    nama: document.getElementById('stokNama').value.trim(),
    jumlah: jumlah,
    jenis: document.getElementById('stokJenis').value,
    keterangan: document.getElementById('stokKeterangan').value.trim() || '-' // Pastikan keterangan disimpan, default ke '-'
  };

  if (stokId !== '') {
    data[parseInt(stokId)] = entry;
    showToast('Transaksi barang berhasil diperbarui!', 'success');
  } else {
    data.push(entry);
    showToast('Transaksi barang berhasil ditambahkan!', 'success');
  }
  saveData('stok', data);
  // Re-apply current filters after adding/updating
  document.getElementById('applyFilterStok').click();
  renderInventarisStok();
  this.reset();
  document.getElementById('stokId').value = '';
  document.getElementById('stokFormButtonText').textContent = 'Tambah Barang';
});

// Filter Handler Uang
document.getElementById('applyFilterUang').addEventListener('click', () => {
  const tanggalAwal = document.getElementById('filterUangTanggalAwal').value;
  const tanggalAkhir = document.getElementById('filterUangTanggalAkhir').value;
  const jenis = document.getElementById('filterUangJenis').value;
  const searchTerm = document.getElementById('searchUang').value.toLowerCase();
  
  applyFilterUangInternal(tanggalAwal, tanggalAkhir, jenis, searchTerm);
  showToast('Filter uang diterapkan!', 'info');
});

// Filter Handler Stok
document.getElementById('applyFilterStok').addEventListener('click', () => {
  const tanggalAwal = document.getElementById('filterStokTanggalAwal').value;
  const tanggalAkhir = document.getElementById('filterStokTanggalAkhir').value;
  const nama = document.getElementById('searchStokNama').value.toLowerCase(); // Ini juga berfungsi sebagai search term untuk keterangan
  const jenis = document.getElementById('filterStokJenis').value;

  applyFilterStokInternal(tanggalAwal, tanggalAkhir, nama, jenis);
  showToast('Filter stok diterapkan!', 'info');
});


// Load data on start
document.addEventListener('DOMContentLoaded', () => {
  // Initial load of tables with default filter (all data)
  applyFilterUangInternal('', '', '', ''); 
  updateUangSummary(loadData('uang')); // Update summary for all data on initial load
  applyFilterStokInternal('', '', '', '');
  renderInventarisStok();

  // Set tab 'uang' sebagai default aktif saat pertama kali dimuat
  const defaultTabButton = document.querySelector('.tab-btn');
  showTab('uang', defaultTabButton);
});