import tkinter as tk
from tkinter import ttk, messagebox
from pynput import mouse, keyboard
import json
import threading
import pyautogui
import time
import os
import random
import datetime
import pyautogui
import time

# --- Global Variable ---
fields = [
    "Keanggotaan BKB",
    "Klik Nama",
    "Excel",
    "Web",
    "PUS",
    "Hamil",
    "KB",
    "Nama Anak",
    "ttl",
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

    # stop previous listener if any
    if field in listeners:
        try:
            listeners[field].stop()
        except Exception:
            pass

    # Mouse callback runs in a separate thread. Use root.after to update Tk widgets.
    def on_click(x, y, button, pressed):
        if pressed:
            coord = (x, y)
            coord_data[field] = coord

            # Update the button text on the main thread
            def ui_update():
                try:
                    show_buttons[field].config(text=f"{coord[0]}, {coord[1]}")
                except Exception:
                    pass

            # quick console feedback for debugging
            try:
                print(f"[Select Kursor] Pilih {field}: {coord}")
            except Exception:
                pass

            root.after(0, ui_update)

            # stop the listener (runs in its own thread)
            try:
                listener.stop()
            except Exception:
                pass

            # remove listener reference on the main thread to avoid concurrency issues
            def cleanup():
                listeners.pop(field, None)

            root.after(0, cleanup)

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

# --- Simpan ke file koordinatnonbkb.json ---
def simpan_ke_file():
    data_simpan = coord_data.copy()
    data_simpan["maks_loop"] = entry_loop.get()
    try:
        data_simpan["kecepatan"] = speed_var.get()
    except NameError:
        data_simpan["kecepatan"] = 5
    with open("koordinatnonbkb.json", "w") as f:
        json.dump(data_simpan, f)
    messagebox.showinfo("Disimpan", "Koordinat dan loop disimpan ke 'koordinatnonbkb.json'.")

# --- Jalankan otomatisasi klik ---
def mulai_otomatisasi():
    global jumlah_loop, berhenti, maks_loop
    try:
        with open("koordinatnonbkb.json") as f:
            posisi = json.load(f)
            maks_loop = int(posisi.get("maks_loop", entry_loop.get()))
            # baca kecepatan jika ada
            kecepatan_file = int(posisi.pop("kecepatan", 5))
            posisi.pop("maks_loop", None)
            posisi = {k: tuple(v) for k, v in posisi.items()}
    except:
        messagebox.showerror("Gagal", "Gagal membuka file koordinatnonbkb.json")
        return

    jumlah_loop = 0
    berhenti = False
    keyboard.Listener(on_press=on_press).start()
    print("▶️ Mulai Otomatisasi dalam 3 detik...")
    time.sleep(3)

    print("▶️ Mulai Otomatisasi. Tekan 'n' untuk berhenti.")

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
    pyautogui.PAUSE = 0.05 * sleep_factor

    while not berhenti and jumlah_loop < maks_loop:
        jumlah_loop += 1
        print(f"\n🔁 Loop ke-{jumlah_loop}")
                
        # Tahun sekarang
        tahun_sekarang = datetime.datetime.now().year

        # Range tahun untuk umur <7
        tahun_min = tahun_sekarang - 6
        tahun_max = tahun_sekarang

        # Generate tanggal acak untuk umur <7
        bulan = random.randint(1, 12)
        hari = random.randint(1, 28)  # supaya aman
        tahun = random.randint(tahun_min, tahun_max)

        ttl_random = f"{bulan:02d}{hari:02d}{tahun}"

        pyautogui.click(*posisi["Keanggotaan BKB"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('down')
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Excel"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('down')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Web"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('down')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["PUS"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Hamil"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('down')
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["KB"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Excel"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('down')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Nama Anak"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["ttl"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.typewrite(ttl_random)
        pyautogui.click(*posisi["KKA"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["KMS"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Perkembangan Anak"])
        time.sleep(0.3 * sleep_factor)
        pyautogui.press('enter')
        time.sleep(0.3 * sleep_factor)
        pyautogui.click(*posisi["Tambah"])
        time.sleep(0.3 * sleep_factor)

# --- GUI ---
root = tk.Tk()
root.title("Bukan Anggota BKB")
root.geometry("820x600")

tk.Label(root, text="Klik 'Select Kursor', lalu klik posisi di layar untuk ambil X,Y", font=("Segoe UI", 12)).pack(pady=10)

mainframe = ttk.Frame(root)
mainframe.pack(padx=10, pady=10)

# Load koordinat dari JSON jika sudah ada
koordinat_sudah_ada = {}
if os.path.exists("koordinatnonbkb.json"):
    try:
        with open("koordinatnonbkb.json") as f:
            koordinat_sudah_ada = json.load(f)
    except:
        koordinat_sudah_ada = {}

for i, field in enumerate(fields):
    ttk.Label(mainframe, text=field, width=25).grid(row=i, column=0, padx=5, pady=5)
    ttk.Button(mainframe, text="Select Kursor", command=lambda f=field: start_mouse_listener(f)).grid(row=i, column=1)

    # Tombol Tampilkan Lokasi + isi koordinat jika ada
    btn_show = ttk.Button(mainframe, text="Tampilkan Lokasi", command=lambda f=field: ok_action(f))
    if field in koordinat_sudah_ada:
        coord_data[field] = tuple(koordinat_sudah_ada[field])
        btn_show.config(text=f"{coord_data[field][0]}, {coord_data[field][1]}")
        ok_status[field] = True
    btn_show.grid(row=i, column=2)
    show_buttons[field] = btn_show

# Entry untuk maks_loop
loop_frame = ttk.Frame(root)
loop_frame.pack(pady=5)
ttk.Label(loop_frame, text="Jumlah Maksimal Looping:").pack(side="left")

entry_loop = ttk.Entry(loop_frame, width=5)
entry_loop.insert(0, str(koordinat_sudah_ada.get("maks_loop", "111")))
entry_loop.pack(side="left")

# Kontrol kecepatan (1..10): slider + spinbox
try:
    speed_default = int(koordinat_sudah_ada.get("kecepatan", 5))
except Exception:
    speed_default = 5
speed_var = tk.IntVar(value=speed_default)
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

ttk.Button(frame_bawah, text="💾 Simpan Koordinat", command=simpan_ke_file).grid(row=0, column=0, padx=10)
ttk.Button(frame_bawah, text="▶️ Mulai Otomatisasi", command=lambda: threading.Thread(target=mulai_otomatisasi).start()).grid(row=0, column=1, padx=10)

root.mainloop()
