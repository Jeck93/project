import pyautogui
import time
from pynput import keyboard
import threading
import os
from PIL import ImageGrab
import cv2
import numpy as np
import json
from pyautogui import ImageNotFoundException

# Load konfigurasi
try:
    with open("konfigurasi.json", "r") as f:
        config = json.load(f)
    maks_siklus = config["maks_siklus"]
    metode = config["metode"]
    status_peserta_down = config["status_peserta_down"]
    asuransi_down = config["asuransi_down"]
    list_desa_down = config["list_desa_down"]
    koordinat = config["koordinat_opsi"]
except Exception as e:
    print("⚠️ Gagal memuat konfigurasi:", e)
    exit(1)

if maks_siklus != len(list_desa_down):
    print(f"❌ Konfigurasi tidak sesuai:\n - maks_siklus = {maks_siklus}\n - panjang list_desa_down = {len(list_desa_down)}")
    exit(1)

# Status kontrol
berhenti = False
pause = False
restart = False
pause_event = threading.Event()

metode_kb = {
    'iud': 5, 'implan': 4, 'suntik': 2, 'pil': 3, 'kondom': 5
}

# Path gambar
path_halaman = r"C:\\python\\otomatisasi komputer\\gambar\\halaman.png"
path_hand_cursor = r"C:\\python\\otomatisasi komputer\\gambar\\select.png"
gambar_filter_list = [
    r"C:\\python\\otomatisasi komputer\\gambar\\filter1.png",
    r"C:\\python\\otomatisasi komputer\\gambar\\filter2.png",
    r"C:\\python\\otomatisasi komputer\\gambar\\filter3.png"
]

def pantau_keyboard():
    def on_press(key):
        global berhenti, pause, restart
        try:
            if key.char == 'p':
                pause = True
                pause_event.set()
                print("⏸️ Dijeda (p ditekan)")
            elif key.char == 'r':
                pause = False
                pause_event.clear()
                restart = True
                print("🔄 Restart dari awal (r ditekan)")
            elif key.char == 'n':
                berhenti = True
                print("🛑 Dihentikan (n ditekan)")
        except AttributeError:
            pass
    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()

def tunggu_jika_pause():
    while pause:
        time.sleep(0.1)

def tunggu_semua_gambar(gambar_list, timeout=100, confidence=0.5):
    print("🔎 Menunggu semua gambar filter...")
    waktu_mulai = time.time()

    while time.time() - waktu_mulai < timeout:
        if berhenti:
            return False
        tunggu_jika_pause()

        semua_ditemukan = True
        for g in gambar_list:
            if not os.path.exists(g):
                print(f"❌ File gambar tidak ditemukan: {g}")
                semua_ditemukan = False
                break
            try:
                lokasi = pyautogui.locateOnScreen(g, confidence=confidence)
                if lokasi is None:
                    print(f"⏳ Gambar belum muncul: {g}")
                    semua_ditemukan = False
                    break
            except ImageNotFoundException:
                print(f"❌ Gagal mendeteksi gambar di layar: {g}")
                semua_ditemukan = False
                break
            except Exception as e:
                print(f"⚠️ Error saat mencari gambar {g}: {e}")
                semua_ditemukan = False
                break

        if semua_ditemukan:
            print("✅ Semua gambar filter ditemukan.")
            return True

        time.sleep(0.3)

    print("⚠️ Timeout: Tidak semua gambar filter muncul.")
    return False

def tunggu_kursor_tangan(template_path, posisi, ukuran=72, threshold=0.5):
    print(f"🔎 Menunggu kursor di {posisi}")
    x, y = posisi
    region = (x - ukuran//2, y - ukuran//2, ukuran, ukuran)
    template = cv2.imread(template_path, 0)
    if template is None:
        print("❌ Gambar kursor tidak ditemukan.")
        return False
    while not berhenti:
        tunggu_jika_pause()
        screenshot = ImageGrab.grab(bbox=(region[0], region[1], region[0]+region[2], region[1]+region[3]))
        screenshot = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2GRAY)
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        if np.max(result) >= threshold:
            print("✅ Kursor tangan terdeteksi.")
            return True
        time.sleep(0.2)
    return False

def tunggu_halaman(path, timeout=100, confidence=0.7):
    print("🔎 Menunggu halaman dimuat...")
    waktu_mulai = time.time()
    while time.time() - waktu_mulai < timeout:
        if berhenti:
            return False
        tunggu_jika_pause()
        try:
            if pyautogui.locateOnScreen(path, confidence=confidence):
                print("✅ Halaman ditemukan.")
                return True
        except:
            pass
        time.sleep(0.5)
    print("⚠️ halaman.png tidak ditemukan dalam batas waktu.")
    return False

def warna_bukan_putih(x, y):
    try:
        r, g, b = pyautogui.screenshot().getpixel((x, y))
        return (r, g, b) != (255, 255, 255)
    except:
        return False

def klik_koordinat(kunci):
    if kunci in koordinat:
        x, y = koordinat[kunci]
        pyautogui.click(x, y)
        time.sleep(0.3)
    else:
        print(f"⚠️ Koordinat {kunci} tidak ditemukan")

# Mulai thread keyboard
threading.Thread(target=pantau_keyboard, daemon=True).start()

print("⏳ Menunggu 3 detik sebelum mulai...")
time.sleep(3)

siklus = 0
while siklus < maks_siklus:
    if berhenti: break
    if restart:
        print("\n🔄 Restart dari awal...")
        siklus = 0
        restart = False
        klik_koordinat("cari")
        continue

    desa_down = list_desa_down[siklus]
    print(f"\n▶️ Siklus {siklus+1}/{maks_siklus} | Desa Down Index: {desa_down}")

    klik_koordinat("cari")
    pyautogui.click()
    time.sleep(0.3)

    klik_koordinat("excel")
    pyautogui.hotkey('ctrl', 'c')
    pyautogui.press('down')
    time.sleep(0.5)

    if not tunggu_semua_gambar(gambar_filter_list):
        siklus += 1
        continue

    klik_koordinat("nik")
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)

    klik_koordinat("desa")
    for _ in range(desa_down):
        pyautogui.press('down')
        time.sleep(0.1)
    pyautogui.press('enter')
    time.sleep(0.5)

    klik_koordinat("cari_data")
    time.sleep(1)

    titik1 = tuple(koordinat.get("pilih_peserta"))
    pyautogui.moveTo(*titik1)
    if not tunggu_kursor_tangan(path_hand_cursor, titik1):
        siklus += 1
        continue
    pyautogui.click(*titik1)
    time.sleep(1.5)

    if not tunggu_halaman(path_halaman):
        siklus += 1
        continue

    print("✅ Halaman dimuat.")

    if warna_bukan_putih(*koordinat.get("samping_status")):
        klik_koordinat("samping_status")
        time.sleep(1)

    for key, down_count in [("status", status_peserta_down), ("pasca", 0), ("asuransi", asuransi_down)]:
        klik_koordinat(key)
        for _ in range(down_count):
            pyautogui.press('down')
            time.sleep(0.1)
        pyautogui.press('enter')
        time.sleep(0.3)

    klik_koordinat("alkon")
    pyautogui.press('enter')

    klik_koordinat("informed")
    if metode in ['suntik', 'pil', 'kondom']:
        pyautogui.press('down')
    pyautogui.press('enter')

    klik_koordinat("tindakan")
    pyautogui.press('enter')

    klik_koordinat("alkon_jenis")
    for _ in range(metode_kb.get(metode, 1)):
        pyautogui.press('down')
        time.sleep(0.1)
    pyautogui.press('enter')

    klik_koordinat("bergerak")
    pyautogui.press('enter')

    klik_koordinat("tambah")
    print("➕ Tambah selesai")

    siklus += 1

print("✅ Program selesai.")
os._exit(0)