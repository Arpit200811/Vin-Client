import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BASE_URL } from '../lib/Service';

type SignupFormInputs = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  profileImage?: FileList; // File upload instead of URL
};
const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  profileImage: yup
    .mixed<FileList>()
    .test("fileList", "Invalid file type", (value) => !value || value instanceof FileList)
    .optional(),
}).required();

export default function Signup() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // toggle state

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInputs>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: any) => {
    try {
      setErrorMessage("");
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("password", data.password); // append password
      formData.append("role", "user");

      if (data.profileImage && data.profileImage[0]) {
        formData.append("profileImage", data.profileImage[0]);
      }

      await axios.post(`${BASE_URL}/api/users`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Signup successful ✅");
      navigate("/login");
    } catch (error: any) {
      console.error("Signup failed:", error);
      setErrorMessage(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 bg-white rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        {errorMessage && (
          <p className="text-red-500 text-sm mb-4 text-center">{errorMessage}</p>
        )}

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            className="w-full p-2 border rounded"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="First Name"
            {...register("firstName")}
            className="w-full p-2 border rounded"
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Last Name"
            {...register("lastName")}
            className="w-full p-2 border rounded"
          />
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
        </div>

        {/* Password Field */}
        <div className="mb-4 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            {...register("password")}
            className="w-full p-2 border rounded"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            {...register("profileImage")}
            className="w-full p-2 border rounded"
          />
          {errors.profileImage && (
            <p className="text-red-500 text-sm">{String(errors.profileImage.message)}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2 bg-primary text-white rounded hover:bg-blue-600 transition"
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
