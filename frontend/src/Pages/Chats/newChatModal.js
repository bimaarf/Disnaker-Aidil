import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { selectUser } from "../../features/authentication/AuthSlice";
import {
    addChatRoom,
    setActiveRoom
} from "../../features/chats/chatSlice";
import { fetchUsers } from "../../features/users/userSlice";

const NewChatModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { users, status: usersStatus } = useSelector((state) => state.users);
//   const chatRooms = useSelector((state) => state.chat.chatRooms); // <<--- Move here first

  // Load users when modal opens
  useEffect(() => {
    if (isOpen && usersStatus === "idle") {
      dispatch(fetchUsers({ page: 1, perPage: 100 }));
    }
  }, [isOpen, dispatch, usersStatus]);

  // Fetch users based on search term
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First try to search in Redux users
      if (users && users.length > 0) {
        const filteredUsers = users.filter(
          (user) =>
            user.id !== currentUser.id &&
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredUsers.length > 0) {
          setSearchResults(filteredUsers);
          return;
        }
      }

      // If no results in Redux, try API search
      await axios.get("/sanctum/csrf-cookie");
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/get-users`,
        {
          params: { search: searchTerm },
          headers: { Authorization: `Bearer ${currentUser.token}` },
        }
      );

      setSearchResults(
        response.data.filter((user) => user.id !== currentUser.id)
      );
    } catch (err) {
      setError("Failed to search users");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize a temporary chat room
  const initializeTempChatRoom = (recipient) => {
    const tempId = `temp-${uuidv4()}`; // Generate unique temp_id
    const tempRoom = {
      id: tempId,
      name: `Chat with ${recipient.name}`,
      is_creator: true,
      creator_id: String(currentUser.id),
      recipient_id: String(recipient.id),
      has_messages: false,
      last_message: null,
      created_at: new Date().toISOString(),
      creator: {
        id: String(currentUser.id),
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      recipient: {
        id: String(recipient.id),
        name: recipient.name,
        avatar: recipient.avatar,
      },
      is_temp: true, // Flag to indicate temporary room
    };

    dispatch(addChatRoom(tempRoom));

    onClose();

    // Select the temporary room
    dispatch(setActiveRoom(tempId));
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.classList.contains("modal-backdrop")) {
        onClose();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black bg-opacity-50">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-white dark:bg-[#111b21] rounded-lg w-full max-w-md mx-4">
          <div className="p-4 border-b border-[#e9edef] dark:border-[#252d32]">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">
                New Chat
              </h3>
              <button
                onClick={onClose}
                className="text-[#54656f] dark:text-[#aebac1] hover:text-[#25d366]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#25d366]"
                />
                <span className="absolute left-3 top-2.5 text-[#54656f] dark:text-[#aebac1]">
                  <span className="material-symbols-outlined">search</span>
                </span>
              </div>
            </form>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex justify-center p-4">
                <span className="loading loading-spinner loading-sm text-[#25d366]"></span>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-500">{error}</div>
            )}

            {searchResults.length > 0 && (
              <div className="divide-y divide-[#e9edef] dark:divide-[#252d32]">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => initializeTempChatRoom(user)}
                    className="flex items-center p-4 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img
                          src={
                            user.avatar
                              ? `${process.env.REACT_APP_API}user/images/${user.avatar}`
                              : "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                          }
                          alt={user.name}
                        />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-[#111b21] dark:text-[#e9edef]">
                        {user.name}
                      </h4>
                      <p className="text-sm text-[#667781] dark:text-[#8696a0]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchTerm && searchResults.length === 0 && (
              <div className="p-4 text-center text-[#667781] dark:text-[#8696a0]">
                No users found
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;
