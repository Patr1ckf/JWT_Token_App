# JWT_Token_App

Projekt przedstawia prosty system umożliwiający bezpieczny dostęp do dokumentów z wykorzystaniem tokenów JWT (JSON Web Token). System ten realizuje kontrolę dostępu do zasobów (dokumentów), weryfikując tożsamość użytkownika przy każdym żądaniu dostępu do dokumentu. Do stworzenia serwera (backendu) użyto Pythona wykorzystując Flask i PyJWT. Frontend został stworzony z użyciem Next.js

Przed uruchomienie aplikacji należy dodać odpowiednie klucze do pliku .env znajdujacego się w folderze backend.

Zaprojektowany serwer może wykorzystywać RSA lub HMAC z funkcją skrótu SHA-256. Wybrany algorytm(HS256 lub RS256) należy podać w pliku .env znajdującym się w folderze backend.

SECRET_KEY - klucz używany w HS256 (HMAC z funkcją skrótu SHA-256), czyli symetrycznym algorytmie kryptograficznym, bazującym na jednym kluczu do podpisu i weryfikacji integralności danych. 

PRIVATE_KEY i PUBLIC_KEY - klucze używane w RS256 (RSA z funkcją skrótu SHA-256), czyli asymetrycznym algorytmnie kryptograficznym, bazującym na parze kluczy (klucz publiczny i prywatny), które umożliwiają bezpieczną wymianę danych.

Uruchomienie aplikacji poprzez wywołanie komendy w głównym katalogu aplikacji: npm run dev