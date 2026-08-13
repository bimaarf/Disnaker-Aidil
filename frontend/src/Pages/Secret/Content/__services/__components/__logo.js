// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import {
//   fetchLogos,
//   uploadLogo,
// } from "../../../../../features/LandingPages/logoSlice";
// import { selectUser } from "../../../../../features/authentication/AuthSlice";

// export const Logo = () => {
//   const dispatch = useDispatch();
//   const user = useSelector(selectUser);
//   const logos = useSelector((state) => state.logos.logos);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const getLogo = async () => {
//       try {
//         await dispatch(fetchLogos()).unwrap();
//       } catch (error) {
//         console.error("Failed to fetch logo data:", error);
//       }
//     };
//     getLogo();
//   }, [dispatch]);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const previewUrl = URL.createObjectURL(file);
//       setPreviewUrl(previewUrl);
//       handleUpload(file);
//     } else {
//       setPreviewUrl(null);
//     }
//   };

//   const handleUpload = async (imageFile) => {
//     setLoading(true);

//     try {
//       if (imageFile) {
//         const formData = new FormData();
//         formData.append("image", imageFile);
//         await dispatch(uploadLogo(formData)).unwrap();
//         toast.success("Logo updated successfully.");
//         await dispatch(fetchLogos()).unwrap();
//       }
//     } catch (error) {
//       toast.error("Failed to update logo.");
//       console.error("Logo update error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderLogoImage = () => {
//     if (loading) {
//       return (
//         <div className="avatar placeholder">
//           <div className="bg-neutral text-neutral-content rounded-full w-20 h-20 animate-pulse">
//             <span className="loading loading-spinner loading-md"></span>
//           </div>
//         </div>
//       );
//     }

//     if (previewUrl) {
//       return (
//         <div className="avatar">
//           <div className="ring-primary ring-offset-base-100 w-20 h-20 rounded-full ring ring-offset-2 shadow-lg">
//             <img
//               src={previewUrl}
//               alt="Preview Logo"
//               className="object-cover rounded-full"
//             />
//           </div>
//         </div>
//       );
//     }

//     if (logos?.image) {
//       return (
//         <div className="avatar">
//           <div className="ring-primary ring-offset-base-100 w-20 h-20 rounded-full ring ring-offset-2 shadow-lg">
//             <img
//               src={`${process.env.REACT_APP_API}logo/images/${logos.image}`}
//               alt="Current Logo"
//               className="object-cover rounded-full"
//             />
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="avatar placeholder">
//         <div className="bg-gradient-to-br from-base-300 to-base-200 text-base-content rounded-full w-20 h-20 border-2 border-dashed border-base-300">
//           <span className="material-symbols-outlined text-2xl opacity-60">
//             image
//           </span>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Section Header */}
//       <div className="divider divider-primary">Logo Applications</div>

//       {/* Logo Card */}
//       <div className="max-w-2xl mx-auto">
//         <div className="card bg-base-100 dark:bg-base-200 shadow-md backdrop-blur-sm border border-base-200">
//           <div className="card-body p-6">
//             <div className="flex flex-col sm:flex-row items-center gap-6">
//               {/* Logo Display */}
//               <div className="flex-shrink-0">{renderLogoImage()}</div>

//               {/* Logo Info & Actions */}
//               <div className="flex-1 text-center sm:text-left">
//                 <h3 className="text-xl font-bold text-base-content mb-2">
//                   Website Logo
//                 </h3>
//                 <p className="text-base-content/70 text-sm mb-4">
//                   {logos?.image
//                     ? "Current logo is displayed above"
//                     : "No logo uploaded yet"}
//                 </p>

//                 {/* Upload Button - Only for Super Admin */}
//                 {(user?.role === "super admin" ||
//                   user?.role === "administrator") && (
//                   <div className="flex justify-center sm:justify-start">
//                     <label className="btn btn-primary btn-sm gap-2 cursor-pointer hover:scale-105 transition-transform">
//                       <span className="material-symbols-outlined text-base">
//                         upload
//                       </span>
//                       {logos?.image ? "Update Logo" : "Upload Logo"}
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={handleImageChange}
//                         className="hidden"
//                         disabled={loading}
//                       />
//                     </label>
//                   </div>
//                 )}

//                 {/* Loading Indicator */}
//                 {loading && (
//                   <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
//                     <span className="loading loading-spinner loading-xs"></span>
//                     <span className="text-xs text-base-content/60">
//                       Uploading logo...
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Logo Guidelines */}
//             {user?.role === "super admin" && (
//               <div className="divider divider-start text-xs opacity-50">
//                 Guidelines
//               </div>
//             )}
//             {user?.role === "super admin" && (
//               <div className="bg-base-200/50 rounded-lg p-4 mt-4">
//                 <ul className="text-xs text-base-content/60 space-y-1">
//                   <li>• Recommended size: 256x256 pixels or larger</li>
//                   <li>• Supported formats: JPG, PNG, SVG</li>
//                   <li>• Square images work best for circular display</li>
//                   <li>• Maximum file size: 5MB</li>
//                 </ul>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
