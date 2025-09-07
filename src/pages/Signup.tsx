import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Swal from "sweetalert2";
import { BASE_URL } from "../lib/Service";

type SignupFormInputs = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  profileImage?: FileList;
};

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is required"),
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    profileImage: yup
      .mixed<FileList>()
      .test("fileList", "Invalid file type", (value) => !value || value instanceof FileList)
      .optional(),
  })
  .required();

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("password", data.password);
      formData.append("role", "user");

      if (data.profileImage && data.profileImage[0]) {
        formData.append("profileImage", data.profileImage[0]);
      }

      await axios.post(`${BASE_URL}/api/users`, formData);

      Swal.fire({
        title: "🎉 Signup Successful!",
        text: "Your account has been created successfully.",
        icon: "success",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#2563eb",
      }).then(() => {
        navigate("/login");
      });
    } catch (error: any) {
      Swal.fire({
        title: "❌ Signup Failed",
        text: error.response?.data?.message || "Something went wrong, please try again.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800">
          Create Account 🚀
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          {/* First Name */}
          <div>
            <input
              type="text"
              placeholder="First Name"
              {...register("firstName")}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <input
              type="text"
              placeholder="Last Name"
              {...register("lastName")}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Profile Image */}
          <div>
            <input
              type="file"
              accept="image/*"
              {...register("profileImage")}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            {errors.profileImage && (
              <p className="text-red-500 text-sm">{String(errors.profileImage.message)}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-md"
          >
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
