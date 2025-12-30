from pynput import mouse, keyboard
import threading

# Flag global untuk mengontrol loop
berjalan = True

def tampilkan_koordinat():
    def on_move(x, y):
        if berjalan:
            print(f"\rPosisi kursor: {x}, {y}", end='')

    with mouse.Listener(on_move=on_move) as listener:
        listener.join()

def pantau_keyboard():
    global berjalan

    def on_press(key):
        global berjalan
        if key == keyboard.Key.esc:
            print("\nProgram dihentikan.")
            berjalan = False
            return False  # Stop listener

    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()

# Jalankan pemantau mouse di thread terpisah
thread_mouse = threading.Thread(target=tampilkan_koordinat)
thread_mouse.start()

# Jalankan pemantau keyboard di thread utama
pantau_keyboard()

# Hentikan thread mouse jika belum selesai 
thread_mouse.join()
import os

# setelah thread_mouse.join()
os._exit(0)

