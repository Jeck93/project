#Persistent                           ; Menjaga script tetap berjalan
CoordMode, Mouse, Screen             ; Gunakan koordinat layar penuh

SetTimer, TampilkanPosisi, 100       ; Jalankan setiap 100 milidetik (0.1 detik)
return

TampilkanPosisi:
MouseGetPos, xpos, ypos
ToolTip, 📍 Posisi Kursor - X: %xpos%  Y: %ypos%
return

; Tekan tombol "a" untuk keluar dari script
a::
ToolTip                               ; Hilangkan tooltip sebelum keluar
ExitApp
