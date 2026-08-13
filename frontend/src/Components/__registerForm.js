// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import {
//   register,
//   setErrors,
//   clearErrors,
// } from "../features/authentication/AuthSlice";
// import { CircularLoader } from "./_CircularLoader";
// import PhoneNumberInput from "../Pages/Secret/Components/phoneNumberInput";

// const RegisterForm = () => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [image, setImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState("");
//   const [password, setPassword] = useState("");
//   const [passwordConfirm, setPasswordConfirm] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [loading, setLoading] = useState(false);

//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { error } = useSelector((state) => state.auth); // Get error from Redux state

//   // Image validation and preview handling
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (!file.type.startsWith("image/")) {
//         toast.error("Please upload a valid image.");
//         return;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("Image size exceeds 5MB.");
//         return;
//       }
//       setImage(file);
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setImage(null);
//       setImagePreview("");
//     }
//   };

//   const renderErrorMessages = (field) => {
//     const fieldErrors = error?.[field];
//     console.log(fieldErrors); // Log to check if there are errors for this field

//     if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
//       return fieldErrors.map((message, index) => (
//         <span key={index} className="text-red-500 text-sm">
//           {message}
//         </span>
//       ));
//     }
//     return null;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const formData = new FormData();
//     formData.append("name", name);
//     formData.append("email", email);
//     formData.append("password", password);
//     formData.append("passwordConfirm", passwordConfirm);
//     formData.append("phone_number", phoneNumber);

//     if (image) {
//       formData.append("image", image);
//     }

//     try {
//       // Dispatch registration action
//       await dispatch(register(formData)).unwrap();
//       toast.success("Register successfully!");
//       navigate("/login");
//     } catch (err) {
//       const validationErrors = err || {};
//       dispatch(setErrors(validationErrors)); // Dispatch errors to Redux
//       console.log(validationErrors);

//       // Show toast for each field error
//       Object.keys(validationErrors).forEach((field) => {
//         const fieldError = validationErrors[field];
//         if (Array.isArray(fieldError)) {
//           toast.error(` ${fieldError.join(", ")}`);
//         } else if (typeof fieldError === "string") {
//           toast.error(`${fieldError}`);
//         }
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFocus = () => {
//     dispatch(clearErrors()); // Clear errors when any field is focused
//   };

//   return (
//     <>
//       {loading && <CircularLoader />}
//       <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase text-center">
//         <h1>Informasi Pribadi</h1>
//       </div>
//       <div className="w-full">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Username */}
//           <div className="form-control">
//             <label className="label text-white">Username</label>
//             <label className="input rounded-lg input-bordered flex items-center gap-2">
//               <span className="material-symbols-outlined">person</span>
//               <input
//                 type="text"
//                 name="name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 onFocus={handleFocus} // Clear errors on focus
//                 required
//                 className={`grow bg-transparent ${
//                   error?.name ? "border-red-500" : ""
//                 }`}
//                 placeholder="Enter username"
//               />
//             </label>
//             {renderErrorMessages("name")}
//           </div>

//           {/* Email */}
//           <div className="form-control">
//             <label className="label text-white">Email</label>
//             <label className="input rounded-lg input-bordered flex items-center gap-2">
//               <span className="material-symbols-outlined">mail</span>
//               <input
//                 type="email"
//                 name="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 onFocus={handleFocus} // Clear errors on focus
//                 required
//                 className={`grow bg-transparent ${
//                   error?.email ? "border-red-500" : ""
//                 }`}
//                 placeholder="example@gmail.com"
//               />
//             </label>
//             {renderErrorMessages("email")}
//           </div>
//           {/* Password */}
//           <div className="form-control">
//             <label className="label text-white">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               onFocus={handleFocus} // Clear errors on focus
//               className={`input input-bordered w-full ${
//                 error?.password ? "border-red-500" : ""
//               }`}
//               required
//               placeholder="*****"
//             />
//             {renderErrorMessages("password")}
//           </div>
//           {/* Password Confirmation */}
//           <div className="form-control">
//             <label className="label text-white">Password Confirm</label>
//             <input
//               type="password"
//               value={passwordConfirm}
//               onChange={(e) => setPasswordConfirm(e.target.value)}
//               onFocus={handleFocus} // Clear errors on focus
//               className={`input input-bordered w-full ${
//                 error?.passwordConfirm ? "border-red-500" : ""
//               }`}
//               required
//               placeholder="*****"
//             />
//             {renderErrorMessages("passwordConfirm")}
//           </div>

//           {/* Phone Number */}
//           <div className="form-control">
//             <label className="label text-white">Phone Number</label>
//             <label className="input rounded-lg input-bordered flex items-center gap-2">
//               <span className="material-symbols-outlined">call</span>
//               <PhoneNumberInput
//                 initialValue={phoneNumber}
//                 onChange={(formattedPhone) => setPhoneNumber(formattedPhone)}
//                 onFocus={handleFocus} // Clear errors on focus
//               />
//             </label>
//           </div>

//           {/* Avatar */}
//           <div className="form-control">
//             <label className="label text-white">Avatar</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//               className="file-input file-input-bordered w-full"
//             />

//             {imagePreview && (
//               <div className="mt-4">
//                 <img
//                   src={imagePreview}
//                   alt="Preview"
//                   className="max-w-xs max-h-64 object-cover"
//                 />
//               </div>
//             )}
//           </div>
//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="btn btn-primary w-full"
//             disabled={loading}>
//             {loading ? "Loading..." : "Register"}
//           </button>
//         </form>
//       </div>
//     </>
//   );
// };

// export default RegisterForm;
