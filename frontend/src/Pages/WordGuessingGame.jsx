import React, { useState, useEffect } from "react";
import { Star, RefreshCw, Award, BookOpen } from "lucide-react";

const WordGuessingGame = () => {
  const [currentWord, setCurrentWord] = useState("");
  const [hint, setHint] = useState("");
  const [guessedWord, setGuessedWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing"); // playing, won, lost
  const [currentCategory, setCurrentCategory] = useState("");
  const [showHint, setShowHint] = useState(false);

  const maxWrongGuesses = 6;

  const wordCategories = {
    hewan: [
      { word: "KUCING", hint: "Hewan peliharaan yang suka mengeong" },
      { word: "GAJAH", hint: "Hewan terbesar di darat dengan belalai panjang" },
      { word: "BURUNG", hint: "Hewan yang bisa terbang dan bertelur" },
      {
        word: "IKAN",
        hint: "Hewan yang hidup di air dan bernafas dengan insang",
      },
      { word: "SINGA", hint: "Raja hutan yang memiliki surai" },
      { word: "ZEBRA", hint: "Hewan bergaris hitam putih seperti kuda" },
      {
        word: "PINGUIN",
        hint: "Burung yang tidak bisa terbang, hidup di kutub",
      },
    ],
    buah: [
      { word: "APEL", hint: "Buah merah atau hijau yang dimakan Snow White" },
      { word: "PISANG", hint: "Buah kuning panjang yang disukai monyet" },
      { word: "JERUK", hint: "Buah bulat berwarna oranye, kaya vitamin C" },
      { word: "MANGGA", hint: "Buah manis berwarna kuning, raja buah tropis" },
      { word: "ANGGUR", hint: "Buah kecil yang tumbuh bergerombol" },
      {
        word: "SEMANGKA",
        hint: "Buah besar berkulit hijau, daging merah berair",
      },
      { word: "DURIAN", hint: "Buah berduri dengan aroma khas yang kuat" },
    ],
    negara: [
      { word: "INDONESIA", hint: "Negara kepulauan di Asia Tenggara" },
      { word: "JEPANG", hint: "Negara matahari terbit di Asia Timur" },
      { word: "BRASIL", hint: "Negara terbesar di Amerika Selatan" },
      {
        word: "PRANCIS",
        hint: "Negara di Eropa terkenal dengan Menara Eiffel",
      },
      { word: "MESIR", hint: "Negara dengan piramida dan sungai Nil" },
      {
        word: "AUSTRALIA",
        hint: "Benua dan negara yang terkenal dengan kanguru",
      },
      { word: "KANADA", hint: "Negara di Amerika Utara dengan daun maple" },
    ],
    makanan: [
      { word: "NASI", hint: "Makanan pokok orang Indonesia dari beras" },
      { word: "PIZZA", hint: "Makanan Italia berbentuk bulat dengan topping" },
      { word: "SUSHI", hint: "Makanan Jepang dengan nasi dan ikan mentah" },
      { word: "BAKSO", hint: "Makanan berkuah dengan bola daging" },
      { word: "RENDANG", hint: "Masakan Padang dengan daging dan santan" },
      { word: "HAMBURGER", hint: "Makanan cepat saji dengan roti dan daging" },
      { word: "SATAY", hint: "Daging tusuk yang dibakar dengan bumbu kacang" },
    ],
  };

  const initializeGame = () => {
    const categories = Object.keys(wordCategories);
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const categoryWords = wordCategories[randomCategory];
    const randomWordObj =
      categoryWords[Math.floor(Math.random() * categoryWords.length)];

    setCurrentCategory(randomCategory);
    setCurrentWord(randomWordObj.word);
    setHint(randomWordObj.hint);
    setGuessedWord("_".repeat(randomWordObj.word.length));
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus("playing");
    setShowHint(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleLetterGuess = (letter) => {
    if (guessedLetters.includes(letter) || gameStatus !== "playing") return;

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (currentWord.includes(letter)) {
      let newGuessedWord = "";
      for (let i = 0; i < currentWord.length; i++) {
        if (newGuessedLetters.includes(currentWord[i])) {
          newGuessedWord += currentWord[i];
        } else {
          newGuessedWord += "_";
        }
      }
      setGuessedWord(newGuessedWord);

      if (newGuessedWord === currentWord) {
        setGameStatus("won");
        setScore(score + (10 - wrongGuesses * 2));
      }
    } else {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);

      if (newWrongGuesses >= maxWrongGuesses) {
        setGameStatus("lost");
        setGuessedWord(currentWord);
      }
    }
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const getHangmanDrawing = () => {
    const parts = [
      "  +---+",
      "  |   |",
      "  |   O",
      "  |  /|\\",
      "  |  / \\",
      "  |",
      "__|__",
    ];

    const visibleParts = Math.min(wrongGuesses + 1, parts.length);
    return parts.slice(0, visibleParts).join("\n");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🎯 TEBAK KATA
          </h1>
          <div className="flex justify-center items-center gap-6 text-white">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur">
              <Star className="text-yellow-400" size={20} />
              <span className="font-bold">Skor: {score}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur">
              <BookOpen className="text-blue-400" size={20} />
              <span className="capitalize font-bold">
                Kategori: {currentCategory}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Area */}
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
            {/* Hangman Drawing */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <pre className="text-white font-mono text-sm leading-tight">
                {getHangmanDrawing()}
              </pre>
            </div>

            {/* Word Display */}
            <div className="text-center mb-6">
              <div className="text-4xl md:text-5xl font-bold text-white tracking-widest mb-4">
                {guessedWord.split("").join(" ")}
              </div>
              <div className="text-red-400 font-bold">
                Kesalahan: {wrongGuesses}/{maxWrongGuesses}
              </div>
            </div>

            {/* Hint */}
            <div className="text-center mb-6">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-bold transition-all duration-200 transform hover:scale-105">
                  💡 Tampilkan Petunjuk
                </button>
              ) : (
                <div className="bg-yellow-400/20 border border-yellow-400 rounded-xl p-4">
                  <p className="text-yellow-200 font-bold">
                    💡 Petunjuk: {hint}
                  </p>
                </div>
              )}
            </div>

            {/* Game Status */}
            {gameStatus === "won" && (
              <div className="text-center mb-6">
                <div className="bg-green-500/20 border border-green-400 rounded-xl p-6">
                  <Award className="mx-auto text-green-400 mb-2" size={48} />
                  <h2 className="text-2xl font-bold text-green-400 mb-2">
                    SELAMAT!
                  </h2>
                  <p className="text-white">
                    Anda berhasil menebak kata dengan benar!
                  </p>
                  <p className="text-green-300">
                    +{10 - wrongGuesses * 2} poin
                  </p>
                </div>
              </div>
            )}

            {gameStatus === "lost" && (
              <div className="text-center mb-6">
                <div className="bg-red-500/20 border border-red-400 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-red-400 mb-2">
                    GAME OVER
                  </h2>
                  <p className="text-white">
                    Kata yang benar adalah:{" "}
                    <span className="font-bold">{currentWord}</span>
                  </p>
                </div>
              </div>
            )}

            {/* New Game Button */}
            <div className="text-center">
              <button
                onClick={initializeGame}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-bold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto">
                <RefreshCw size={20} />
                Kata Baru
              </button>
            </div>
          </div>

          {/* Alphabet */}
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Pilih Huruf
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {alphabet.map((letter) => {
                const isGuessed = guessedLetters.includes(letter);
                const isCorrect = isGuessed && currentWord.includes(letter);
                const isWrong = isGuessed && !currentWord.includes(letter);

                return (
                  <button
                    key={letter}
                    onClick={() => handleLetterGuess(letter)}
                    disabled={isGuessed || gameStatus !== "playing"}
                    className={`
                      aspect-square rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100
                      ${isCorrect ? "bg-green-500 text-white" : ""}
                      ${isWrong ? "bg-red-500 text-white" : ""}
                      ${
                        !isGuessed && gameStatus === "playing"
                          ? "bg-white/20 text-white hover:bg-white/30 active:scale-95"
                          : ""
                      }
                      ${
                        isGuessed || gameStatus !== "playing"
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}>
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Guessed Letters Info */}
            <div className="mt-6 p-4 bg-black/20 rounded-xl">
              <div className="mb-2">
                <span className="text-green-400 font-bold">Benar: </span>
                <span className="text-white">
                  {guessedLetters
                    .filter((letter) => currentWord.includes(letter))
                    .join(", ") || "-"}
                </span>
              </div>
              <div>
                <span className="text-red-400 font-bold">Salah: </span>
                <span className="text-white">
                  {guessedLetters
                    .filter((letter) => !currentWord.includes(letter))
                    .join(", ") || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/10 backdrop-blur rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            Cara Bermain
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-white text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-2">🎯</div>
              <p>Tebak kata tersembunyi dengan memilih huruf satu per satu</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-2">💡</div>
              <p>Gunakan petunjuk jika kesulitan menebak kata</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl mb-2">⭐</div>
              <p>Dapatkan poin lebih tinggi dengan sedikit kesalahan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordGuessingGame;
