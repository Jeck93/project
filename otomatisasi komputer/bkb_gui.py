import tkinter as tk
from tkinter import ttk, messagebox
from pynput import mouse, keyboard
import json
import threading
import pyautogui
import time
from PIL import ImageGrab
import cv2
import numpy as np
import os

# --- Global Variable ---
fields = [
    "Keanggotaan BKB",
    "Cari Anggota",
    "Select Anggota",
    "Cari Data Anak",
    "Select Anak",
    "KKA",
    "KMS",
    "Perkembangan Anak",
    "Tambah"
]

coord_data = {}
show_buttons = {}
ok_status = {}
listeners = {}
berhenti = False
jumlah_loop = 0
maks_loop = 111
sleep_factor = 1.0
path_hand_cursor = r"C:\\python\\otomatisasi komputer\\gambar\\select.png"

# --- Listener Keyboard untuk stop ---
def on_press(key):
    global berhenti
    try:
        if key.char == 'n':
            berhenti = True
            print("\U0001F6D1 Dihentikan oleh pengguna.")
            return False
    except:
        pass

# --- Fungsi ambil koordinat ---
def start_mouse_listener(field):
    # allow reselection: clear previous ok flag so user can change coordinates
    ok_status[field] = False
    show_buttons[field].config(state="normal", text="Menunggu Klik...")

    if field in listeners:
        listeners[field].stop()

    def on_click(x, y, button, pressed):
        if pressed:
            coord_data[field] = (x, y)
            show_buttons[field].config(text=f"{x}, {y}")
            listener.stop()
            listeners.pop(field, None)

    listener = mouse.Listener(on_click=on_click)
    listener.start()
    listeners[field] = listener

# --- Validasi tombol OK ---
def ok_action(field):
    if field in coord_data:
        show_buttons[field].config(state="disabled")
        ok_status[field] = True
    else:
        messagebox.showwarning("Belum Dipilih", f"Silakan pilih '{field}' dulu.")

# --- Simpan ke file koordinatbkb.json ---
def simpan_ke_file():
    data_simpan = coord_data.copy()
    data_simpan["maks_loop"] = entry_loop.get()
    try:
        data_simpan["kecepatan"] = speed_var.get()
    except NameError:
        data_simpan["kecepatan"] = 5
    with open("koordinatbkb.json", "w") as f:
        json.dump(data_simpan, f)
    messagebox.showinfo("Disimpan", "Koordinat dan loop disimpan ke 'koordinatbkb.json'.")

# --- Fungsi Tunggu Kursor ---
def tunggu_kursor_tangan(template_path, posisi, ukuran=72, threshold=0.5):
    x, y = posisi
    region = (x - ukuran//2, y - ukuran//2, x + ukuran//2, y + ukuran//2)
    template = cv2.imread(template_path)
    if template is None:
        print("❌ Gambar template tidak ditemukan.")
        return False
    template = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

    while not berhenti:
        screenshot = ImageGrab.grab(bbox=region)
        screenshot = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2GRAY)
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        if np.any(result >= threshold):
            return True
        # gunakan sleep_factor global agar polling menyesuaikan kecepatan
        try:
            time.sleep(0.2 * sleep_factor)
        except Exception:
            time.sleep(0.2)
    return False

# --- Jalankan otomatisasi klik ---
def mulai_otomatisasi():
    global jumlah_loop, berhenti, maks_loop
    try:
        with open("koordinatbkb.json") as f:
            posisi = json.load(f)
            maks_loop = int(posisi.get("maks_loop", entry_loop.get()))
            # baca kecepatan jika ada, lalu hapus sebelum konversi tuple
            kecepatan_file = int(posisi.pop("kecepatan", 5))
            posisi.pop("maks_loop", None)
            posisi = {k: tuple(v) for k, v in posisi.items()}
    except:
        messagebox.showerror("Gagal", "Gagal membuka file koordinatbkb.json")
        return

    jumlah_loop = 0
    berhenti = False
    keyboard.Listener(on_press=on_press).start()

    # set kecepatan dari file atau dari kontrol GUI
    try:
        speed = int(kecepatan_file)
    except NameError:
        try:
            speed = int(speed_var.get())
        except Exception:
            speed = 5

    # faktor jeda: 1 (paling lambat) .. 0.1 (paling cepat)
    global sleep_factor
    sleep_factor = (11 - speed) / 10.0
    # atur pyautogui pause sebagai nilai kecil dikalikan faktor
    pyautogui.PAUSE = 0.05 * sleep_factor

    print("▶️ Mulai Otomatisasi. Tekan 'n' untuk berhenti.")

    while not berhenti and jumlah_loop < maks_loop:
        jumlah_loop += 1
        print(f"\n🔁 Loop ke-{jumlah_loop}")
        pyautogui.click(*posisi["Keanggotaan BKB"])
        time.sleep(0.5 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(1.5 * sleep_factor)
        pyautogui.click(*posisi["Cari Anggota"])
        time.sleep(1.5 * sleep_factor)

        pyautogui.moveTo(*posisi["Select Anggota"])
        if not tunggu_kursor_tangan(path_hand_cursor, posisi["Select Anggota"]):
            break
        pyautogui.click(*posisi["Select Anggota"])
        time.sleep(2 * sleep_factor)

        pyautogui.click(*posisi["Cari Data Anak"])
        time.sleep(1.5 * sleep_factor)

        pyautogui.moveTo(*posisi["Select Anak"])
        if not tunggu_kursor_tangan(path_hand_cursor, posisi["Select Anak"]):
            break
        pyautogui.click(*posisi["Select Anak"])
        time.sleep(1.5 * sleep_factor)

        pyautogui.click(*posisi["KKA"])
        pyautogui.press('enter')
        pyautogui.click(*posisi["KMS"])
        pyautogui.press('enter')
        pyautogui.click(*posisi["Perkembangan Anak"])
        pyautogui.press('enter')
        time.sleep(0.5 * sleep_factor)

        pyautogui.click(*posisi["Tambah"])
        time.sleep(2 * sleep_factor)

    print("\n✅ Otomatisasi selesai.")
    messagebox.showinfo("Selesai", "Otomatisasi telah dihentikan atau selesai.")


# --- GUI ---
root = tk.Tk()
root.title("Ambil & Jalankan Otomatisasi Klik BKB")
root.geometry("820x600")

# Judul
tk.Label(root, text="Klik 'Select Kursor', lalu klik posisi di layar untuk ambil X,Y", font=("Segoe UI", 12)).pack(pady=10)

mainframe = ttk.Frame(root)
mainframe.pack(padx=10, pady=10)

# Load jika file json sudah ada
koordinat_sudah_ada = {}
if os.path.exists("koordinatbkb.json"):
    try:
        with open("koordinatbkb.json") as f:
            koordinat_sudah_ada = json.load(f)
    except:
        koordinat_sudah_ada = {}

for i, field in enumerate(fields):
    ttk.Label(mainframe, text=field, width=25).grid(row=i, column=0, padx=5, pady=5)
    ttk.Button(mainframe, text="Select Kursor", command=lambda f=field: start_mouse_listener(f)).grid(row=i, column=1)
    btn_show = ttk.Button(mainframe, text="Tampilkan Lokasi", command=lambda f=field: ok_action(f))
    btn_show.grid(row=i, column=2)
    show_buttons[field] = btn_show

    # Tampilkan dari file jika ada
    if field in koordinat_sudah_ada:
        coord_data[field] = tuple(koordinat_sudah_ada[field])
        btn_show.config(text=f"{coord_data[field][0]}, {coord_data[field][1]}")
        ok_status[field] = True

# Entry untuk maks_loop
loop_frame = ttk.Frame(root)
loop_frame.pack(pady=5)

loop_label = ttk.Label(loop_frame, text="Jumlah Maksimal Looping:")
loop_label.pack(side="left")

entry_loop = ttk.Entry(loop_frame, width=5)
entry_loop.insert(0, str(koordinat_sudah_ada.get("maks_loop", "111")))
entry_loop.pack(side="left")

# Kontrol kecepatan (1..10): slider + spinbox
speed_var = tk.IntVar(value=int(koordinat_sudah_ada.get("kecepatan", 5)))
speed_frame = ttk.Frame(root)
speed_frame.pack(pady=5)
speed_label = ttk.Label(speed_frame, text="Kecepatan (1=pelan, 10=cepat):")
speed_label.pack(side="left", padx=(0, 8))
speed_scale = tk.Scale(speed_frame, from_=1, to=10, orient="horizontal", variable=speed_var, length=200)
speed_scale.pack(side="left")
speed_spin = tk.Spinbox(speed_frame, from_=1, to=10, width=3, textvariable=speed_var)
speed_spin.pack(side="left", padx=(8,0))

frame_bawah = ttk.Frame(root)
frame_bawah.pack(pady=20)

btn_simpan = ttk.Button(frame_bawah, text="💾 Simpan Koordinat", command=simpan_ke_file)
btn_simpan.grid(row=0, column=0, padx=10)

btn_mulai = ttk.Button(frame_bawah, text="▶️ Mulai Otomatisasi", command=lambda: threading.Thread(target=mulai_otomatisasi).start())
btn_mulai.grid(row=0, column=1, padx=10)

root.mainloop()
