import pygetwindow as gw
import time

window_title = 'SIGA - Google Chrome'

windows = [w for w in gw.getWindowsWithTitle(window_title) if w.title]

if windows:
    win = windows[0]
    win.activate()
    time.sleep(1)
    win.moveTo(0, 0)
    win.resizeTo(900, 1020)
    print("✅ Ukuran dan posisi jendela berhasil diatur.")
else:
    print("❌ Jendela SIGA tidak ditemukan.")
