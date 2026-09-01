"""
Routines Core Person & User Model Interface
"""
from models import Kisiler, KullaniciOlustur

# Alias for backwards compatibility with Person class naming
Person = Kisiler

if __name__ == "__main__":
    print("Routines Terminal Interface")
    kisi = KullaniciOlustur()
    kisi.oturumAc()