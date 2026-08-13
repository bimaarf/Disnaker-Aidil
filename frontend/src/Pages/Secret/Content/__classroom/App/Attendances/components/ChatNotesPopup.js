import React, { useState, useEffect, useRef } from "react";

const ChatNotesPopup = ({
  attendanceId,
  studentName,
  notes,
  onClose,
  onAddNote,
  onDeleteNote,
  isLoading,
  isReadOnly,
}) => {
  const [newNote, setNewNote] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Fungsi untuk menggulir ke bagian bawah
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Menggulir ke bawah setiap kali notes berubah
  useEffect(() => {
    scrollToBottom();
  }, [notes]);

  // Menggulir ke bawah saat komponen pertama kali dimuat
  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      // Assuming onAddNote handles the type as 'teacher_note' or similar
      await onAddNote(attendanceId, { content: newNote, type: "teacher_note" });
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const getEmoji = (type) => {
    switch (type) {
      case "teacher_note":
        return "👨‍🏫";
      case "student_note":
        return "👨‍🎓";
      case "parent_note":
        return "👨‍👩‍👧";
      default:
        return "👔";
    }
  };

  return (
    <div className="relative w-80 h-[32rem] bg-base-100 rounded-3xl shadow-2xl border border-base-200/50 overflow-hidden flex flex-col transform transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-base-200/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary text-xl font-bold">
              {studentName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base-content">{studentName}</h3>
            <p className="text-xs text-base-content/60">Catatan Kehadiran</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-full transition-all duration-200">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/20">
        {notes.length === 0 ? (
          <div className="text-center text-base-content/60 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Belum ada catatan
          </div>
        ) : (
          notes.map((note) => {
            const isStudent = note.type === "student_note";
            return (
              <div
                key={note.id}
                className={`chat ${isStudent ? "chat-end" : "chat-start"}`}>
                <div className="chat-image avatar">
                  <div className="w-8 rounded-full bg-base-200 flex items-center justify-center">
                    <span className="text-xl">{getEmoji(note.type)}</span>
                  </div>
                </div>
                <div className="chat-header text-xs opacity-70 mb-1">
                  {note.creator.name}
                  {/* If there's timestamp, add: <time className="ml-2">{formatTime(note.created_at)}</time> */}
                </div>
                <div
                  className={`chat-bubble ${
                    isStudent ? "chat-bubble-primary" : "chat-bubble-secondary"
                  }`}>
                  {note.content}
                </div>
                <div className="chat-footer opacity-50 text-xs mt-1 flex gap-2">
                  <span>Delivered</span>
                  {!isReadOnly && (
                    <button
                      onClick={() =>
                        !isReadOnly && onDeleteNote(attendanceId, note.id)
                      }
                      disabled={isLoading}
                      className="text-error hover:underline">
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        {/* Elemen dummy untuk menjadi target scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-base-200/50 bg-base-100 flex items-center gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Tambah catatan..."
          className="flex-1 px-4 py-2.5 bg-base-200/50 border border-base-300/50 rounded-full text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={isLoading || !newNote.trim()}
          className="p-2.5 bg-primary text-white rounded-full hover:shadow-md disabled:opacity-50 transition-all duration-200">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatNotesPopup;
