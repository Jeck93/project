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

# Ukuran window 90% layar
sw, sh = root.winfo_screenwidth(), root.winfo_screenheight()
ww, wh = int(sw * 0.4), int(sh * 0.8)
root.geometry(f"{ww}x{wh}")

# Scrollable container
container = ttk.Frame(root)
container.grid(row=0, column=0, sticky="nsew")

canvas = tk.Canvas(container)
scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
scrollable_frame = ttk.Frame(canvas)

scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
canvas.configure(yscrollcommand=scrollbar.set)

canvas.grid(row=0, column=0, sticky="nsew")
scrollbar.grid(row=0, column=1, sticky="ns")

root.columnconfigure(0, weight=1)
root.rowconfigure(0, weight=1)
container.columnconfigure(0, weight=1)
container.rowconfigure(0, weight=1)

# Mainframe
mainframe = ttk.Frame(scrollable_frame)
mainframe.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)

for i in range(3): mainframe.columnconfigure(i, weight=1)

# Load dari file jika ada
koordinat_sudah_ada = {}
if os.path.exists("konfigurasi.json"):
    try:
        with open("konfigurasi.json") as f:
            koordinat_sudah_ada = json.load(f).get("koordinat_opsi", {})
    except:
        koordinat_sudah_ada = {}

for i, field in enumerate(fields):
    ttk.Label(mainframe, text=field, width=25).grid(row=i, column=0, padx=5, pady=5, sticky="w")
    ttk.Button(mainframe, text="Select Kursor", command=lambda f=field: start_mouse_listener(f)).grid(row=i, column=1, sticky="ew")

    btn_show = ttk.Button(mainframe, text="Tampilkan Lokasi", command=lambda f=field: ok_action(f))
    btn_show.grid(row=i, column=2, sticky="ew")
    show_buttons[field] = btn_show

    if field in koordinat_sudah_ada:
        coord_data[field] = tuple(koordinat_sudah_ada[field])
        btn_show.config(text=f"{coord_data[field][0]}, {coord_data[field][1]}")
        ok_status[field] = True

def save_config():
    try:
        with open("konfigurasi.json", "r") as f:
            existing = json.load(f)
    except:
        existing = {}

    existing["koordinat_opsi"] = {key: list(coord_data[key]) for key in coord_data}
    existing["list_desa_down"] = []
    for var_desa, var_ulang in desa_vars:
        nama_desa = var_desa.get()
        if nama_desa in list_desa:
            existing["list_desa_down"].extend([list_desa.index(nama_desa)] * var_ulang.get())
    existing["maks_siklus"] = len(existing["list_desa_down"])
    existing["metode"] = var_metode.get()
    existing["status_peserta_down"] = opsi_status_peserta.index(var_status_peserta.get())
    existing["asuransi_down"] = opsi_asuransi.index(var_asuransi.get())

    with open("konfigurasi.json", "w") as f:
        json.dump(existing, f, indent=2)

def mulai_otomatisasi():
    save_config()
    if os.path.exists("pelayanan.py"):
        try:
            subprocess.Popen(["python", "pelayanan.py"])
            update_status("Program berjalan...", "blue")
        except Exception as e:
            update_status(f"Gagal menjalankan: {e}", "red")
    else:
        update_status("File pelayanan.py tidak ditemukan", "red")

# Tombol simpan & mulai
ttk.Button(mainframe, text="💾 Simpan Koordinat", command=save_config).grid(row=len(fields)+1, column=1, columnspan=2, pady=10)
ttk.Button(mainframe, text="▶️ Mulai Otomatisasi", command=mulai_otomatisasi).grid(row=len(fields)+2, column=1, columnspan=2, pady=(0, 10))

# Frame desa
desa_frame = ttk.LabelFrame(scrollable_frame, text="Konfigurasi Desa per Siklus")
desa_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=5)
desa_frame.columnconfigure(0, weight=1)
desa_vars = []

def tambah_desa():
    var_desa = tk.StringVar(value=list_desa[0])
    var_ulang = tk.IntVar(value=1)
    row = len(desa_vars)

    combo = ttk.Combobox(desa_frame, textvariable=var_desa, values=list_desa, width=20)
    combo.grid(row=row, column=0, padx=5, pady=2, sticky="ew")

    entry = tk.Entry(desa_frame, textvariable=var_ulang, width=5)
    entry.grid(row=row, column=1, padx=5)

    def hapus_baris():
        combo.destroy()
        entry.destroy()
        btn_hapus.destroy()
        desa_vars.remove((var_desa, var_ulang))
        update_desa_frame()

    btn_hapus = ttk.Button(desa_frame, text="🗑️ Hapus", command=hapus_baris)
    btn_hapus.grid(row=row, column=2, padx=5)

    desa_vars.append((var_desa, var_ulang))

def update_desa_frame():
    for widget in desa_frame.winfo_children():
        widget.grid_forget()

    for row, (var_desa, var_ulang) in enumerate(desa_vars):
        combo = ttk.Combobox(desa_frame, textvariable=var_desa, values=list_desa, width=20)
        combo.grid(row=row, column=0, padx=5, pady=2, sticky="ew")

        entry = tk.Entry(desa_frame, textvariable=var_ulang, width=5)
        entry.grid(row=row, column=1, padx=5)

        def hapus_baris(vd=var_desa, vu=var_ulang):
            desa_vars.remove((vd, vu))
            update_desa_frame()

        ttk.Button(desa_frame, text="🗑️ Hapus", command=hapus_baris).grid(row=row, column=2, padx=5)

ttk.Frame(scrollable_frame).grid(row=2, column=0, pady=5)
ttk.Button(scrollable_frame, text="➕ Tambah Desa", command=tambah_desa).grid(row=3, column=0, padx=10, pady=5, sticky="w")

# Opsi tambahan
frame_opsi = ttk.LabelFrame(scrollable_frame, text="Pengaturan Tambahan")
frame_opsi.grid(row=4, column=0, sticky="ew", padx=10, pady=5)

opsi_metode = ["suntik", "pil", "implan", "iud", "kondom", "lainnya"]
opsi_status_peserta = ["Baru", "Ganti Cara", "Ulangan"]
opsi_asuransi = ["BPJS", "Lainnya", "Tidak"]

ttk.Label(frame_opsi, text="Metode KB:").grid(row=0, column=0, padx=5, pady=2, sticky="w")
var_metode = tk.StringVar(value="suntik")
ttk.Combobox(frame_opsi, textvariable=var_metode, values=opsi_metode, width=15).grid(row=0, column=1, padx=5, pady=2)

ttk.Label(frame_opsi, text="Status Peserta:").grid(row=1, column=0, padx=5, pady=2, sticky="w")
var_status_peserta = tk.StringVar(value="Ulangan")
ttk.Combobox(frame_opsi, textvariable=var_status_peserta, values=opsi_status_peserta, width=15).grid(row=1, column=1, padx=5, pady=2)

ttk.Label(frame_opsi, text="Asuransi:").grid(row=2, column=0, padx=5, pady=2, sticky="w")
var_asuransi = tk.StringVar(value="Tidak")
ttk.Combobox(frame_opsi, textvariable=var_asuransi, values=opsi_asuransi, width=15).grid(row=2, column=1, padx=5, pady=2)

# Status info
status_label = ttk.Label(scrollable_frame, text="", foreground="green")
status_label.grid(row=5, column=0, padx=10, pady=10, sticky="w")

def update_status(text, color="green"):
    status_label.config(text=text, foreground=color)
    root.update_idletasks()

def start_mouse_listener(field):
    def on_click(x, y, button, pressed):
        if pressed:
            coord_data[field] = (x, y)
            show_buttons[field].config(text=f"{x}, {y}")
            ok_status[field] = True
            print(f"📍 Koordinat untuk '{field}' dicatat: {x}, {y}")
            root.deiconify()  # Kembalikan jendela GUI
            return False

    root.iconify()  # Minimize jendela sebelum mulai listener

    from threading import Thread
    Thread(target=Listener(on_click=on_click).start).start()


def ok_action(field):
    if field in coord_data:
        x, y = coord_data[field]
        messagebox.showinfo("Koordinat", f"Koordinat {field}: ({x}, {y})")
    else:
        messagebox.showwarning("Belum Ada", f"Koordinat untuk '{field}' belum ditentukan.")

root.mainloop()
