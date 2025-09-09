import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BASE_URL } from "../lib/Service";
import axios from "axios";
import { useState } from "react";
import { useDispatch } from 'react-redux'
import { login } from "../redux/slice/authSlice";

type LoginFormInputs = {
  email: string;
  password: string;
};

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  })
  .required();

export default function Login() {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
  });
  const onSubmit = async (data: any) => {
    const response = await axios.post(`${BASE_URL}/api/local-login`, data);
    if (response.data.status == 200) {
      alert(response.data.message);
      navigate("/scanner");
      dispatch(login({
        user: response.data.user,
        token: "dummy-token",
      }));
    } else {
      alert(response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-6">
          Welcome Back 👋
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Please sign in to continue using{" "}
          <span className="font-semibold">VIN Detector</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
              Remember Me
            </label>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Rules & Regulations */}
        <div className="text-xs text-gray-500 space-y-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
          <p className="font-semibold text-gray-700">Rules & Regulations:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use valid credentials to access your account.</li>
            <li>Do not share your password with anyone.</li>
            <li>System access is monitored for security purposes.</li>
            <li>Unauthorized use may result in account suspension.</li>
            <li>
              By logging in, you agree to our Terms & Privacy Policy.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
