// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { CircularLoader } from "../../../../../Components/_CircularLoader";

// const UserPreviewPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [data, setGame] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchGame = async () => {
//       try {
//         const response = await axios.get(`api/users/${id}`);
//         setGame(response.data?.user);
//         setLoading(false);
//       } catch (err) {
//         setLoading(false);
//       }
//     };
//     if (window.innerWidth >= 1024) {
//       document.body.style.overflow = "hidden";
//     }
//     fetchGame();
//   }, [id]);
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
//   };
//   const handleEditData = (data) => {
//     navigate(`/users/update/${data?.id}`, {
//       state: { id: data?.id, dataProps: data },
//     });
//   };
//   return (
//     <div className="md:flex justify-center md:h-screen items-center">
//       {loading && <CircularLoader />}
//       <div
//         className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
//         onClick={() => handleEditData(data)}>
//         <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
//           <span className="material-symbols-outlined">edit</span>
//         </div>
//       </div>
//       {data?.avatar ? (
//         <div className="md:w-2/3 mb-4 flex justify-center">
//           <img
//             src={`${process.env.REACT_APP_API}user/images/${data?.avatar}`}
//             alt={data?.name}
//             className="w-full md:h-screen object-contain"
//           />
//         </div>
//       ) : (
//         <div className="md:w-2/3 mb-4 flex justify-center">
//           <div className="bg-neudival text-neudival-content w-full h-96 place-content-center text-center rounded-full">
//             <span className="material-symbols-outlined">
//               add_photo_alternate
//             </span>
//             <p>Image does not exist</p>
//           </div>
//         </div>
//       )}
//       <div className="md:w-1/3 border-t md:border-t-transparent md:border-l p-2 border-base-300 md:h-screen overflow-y-auto space-y-2">
//         <div className="flex justify-start items-start gap-2">
//           <span className="select-none material-symbols-outlined">
//             sports_esports
//           </span>
//           <h1 className="font-bold">{data?.name}</h1>
//         </div>
//         <div className="flex justify-between items-center">
//           <div className="flex gap-1 items-center justify-start text-xs">
//             {data?.status ? (
//               <span className="material-symbols-outlined text-success text-xs">
//                 lock_open
//               </span>
//             ) : (
//               <span className="material-symbols-outlined text-error text-xs">
//                 lock
//               </span>
//             )}

//             <p className={`${data?.status ? "text-success" : "text-danger"}`}>
//               {data?.status ? "Visible" : "Hidden"}
//             </p>
//           </div>
//           <div className="text-xs text-base-300">
//             {formatDate(data?.created_at)}
//           </div>
//         </div>
//       </div>
//       {/* Add more details about the data as needed */}
//     </div>
//   );
// };

// export default UserPreviewPage;
