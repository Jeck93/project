import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
import subprocess
from pynput.mouse import Listener

list_desa = [
    "Sukorejo", "Botekan", "Rowosari", "Ambowetan", "Pagergunung",
    "Wiyorowetan", "Samong", "Tasikrejo", "Bumirejo", "Kaliprau",
    "Kertosari", "Pamutih", "Padek", "Blendung", "Ketapang",
    "Limbangan", "Mojo", "Pesantren"
]

fields = {
    "cari": ["CARI", 0, 0],
    "excel": ["EXCEL", 0, 0],
    "nik": ["KOLOM NIK", 0, 0],
    "desa": ["DESA", 0, 0],
    "cari_data": ["CARI DATA", 0, 0],
    "pilih_peserta": ["PILIH PESERTA", 0, 0],
    "samping_status": ["SAMPING STATUS", 0, 0],
    "status": ["STATUS PESERTA", 0, 0],
    "pasca": ["KOLOM PASCA", 0, 0],
    "asuransi": ["ASURANSI", 0, 0],
    "alkon": ["SUMBER ALKON", 0, 0],
    "informed": ["INFORMED", 0, 0],
    "tindakan": ["JENIS TINDAKAN", 0, 0],
    "alkon_jenis": ["JENIS ALKON", 0, 0],
    "bergerak": ["BERGERAK", 0, 0],
    "tambah": ["TAMBAH PESERTA", 0, 0]
}

coord_data = {}
ok_status = {}
show_buttons = {}

root = tk.Tk()
root.title("Konfigurasi Koordinat Klik")
mainframe = ttk.Frame(root)
mainframe.pack(padx=10, pady=10)

# Load koordinat dari file jika ada
koordinat_sudah_ada = {}
if os.path.exists("konfigurasi.json"):
    try:
        with open("konfigurasi.json") as f:
            konfigurasi = json.load(f)
            koordinat_sudah_ada = konfigurasi.get("koordinat_opsi", {})
    except:
        koordinat_sudah_ada = {}

for i, field in enumerate(fields):
    ttk.Label(mainframe, text=field, width=25).grid(row=i, column=0, padx=5, pady=5)
    ttk.Button(mainframe, text="Select Kursor", command=lambda f=field: start_mouse_listener(f)).grid(row=i, column=1)

    btn_show = ttk.Button(mainframe, text="Tampilkan Lokasi", command=lambda f=field: ok_action(f))
    btn_show.grid(row=i, column=2)
    show_buttons[field] = btn_show

    if field in koordinat_sudah_ada:
        coord_data[field] = tuple(koordinat_sudah_ada[field])
        btn_show.config(text=f"{coord_data[field][0]}, {coord_data[field][1]}")
        ok_status[field] = True

# Fungsi simpan konfigurasi

def save_config():
    if not coord_data:
        messagebox.showwarning("Kosong", "Belum ada koordinat yang disimpan.")
        return
    try:
        with open("konfigurasi.json", "r") as f:
            existing = json.load(f)
    except:
        existing = {}

    existing["koordinat_opsi"] = {key: list(coord_data[key]) for key in coord_data}

    with open("konfigurasi.json", "w") as f:
        json.dump(existing, f, indent=2)
    messagebox.showinfo("Berhasil", "Koordinat berhasil disimpan ke konfigurasi.json ✅")

# Setelah menambahkan semua row
ttk.Button(mainframe, text="💾 Simpan Koordinat", command=save_config).grid(
    row=len(fields)+1, column=1, columnspan=2, pady=10
)

def start_mouse_listener(field):
    def on_click(x, y, button, pressed):
        if pressed:
            coord_data[field] = (x, y)
            show_buttons[field].config(text=f"{x}, {y}")
            ok_status[field] = True
            print(f"📍 Koordinat untuk '{field}' dicatat: {x}, {y}")
            return False  # Stop listener setelah klik pertama

    listener = Listener(on_click=on_click)
    listener.start()

def ok_action(field):
    if field in coord_data:
        x, y = coord_data[field]
        messagebox.showinfo("Koordinat", f"Koordinat {field}: ({x}, {y})")
    else:
        messagebox.showwarning("Belum Ada", f"Koordinat untuk '{field}' belum ditentukan.")

# Tombol mulai otomatisasi

def mulai_otomatisasi():
    if os.path.exists("pelayanan.py"):
        subprocess.Popen(["python", "pelayanan.py"])
    else:
        messagebox.showerror("Tidak Ditemukan", "File pelayanan.py tidak ditemukan.")

# Tambahkan tombol ke GUI

ttk.Button(mainframe, text="▶️ Mulai Otomatisasi", command=mulai_otomatisasi).grid(
    row=len(fields)+2, column=1, columnspan=2, pady=(0, 10)
)

root.mainloop()
